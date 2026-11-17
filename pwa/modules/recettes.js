import { appState, uiState, sauvegarderDonnees, escapeHtml, escapeJsStr } from './state.js';
export function rendreRecettes() {
  const container = document.getElementById('recettes-list');
  const countDesc = document.getElementById('recettes-count');

  let list = appState.recettes || [];
  if (!uiState.afficherMasquees) {
    list = list.filter(r => !r.masquee);
  }
  if (uiState.filtreFamilleCourant !== 'Toutes') {
    list = list.filter(r => r.famille === uiState.filtreFamilleCourant);
  }

  const query = (document.getElementById('search-recettes').value || '').trim().toLowerCase();
  if (query) {
    list = list.filter(r => r.nom.toLowerCase().includes(query) || (r.description && r.description.toLowerCase().includes(query)));
  }

  countDesc.innerText = `${list.length} charcuterie${list.length > 1 ? 's' : ''} disponible${list.length > 1 ? 's' : ''}`;

  const chipMasquees = document.getElementById('chip-masquees');
  const aDesMasquees = appState.recettes.some(r => r.masquee);
  if (chipMasquees) chipMasquees.style.display = aDesMasquees ? 'inline-block' : 'none';

  if (list.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:32px; color:var(--text-muted);">Aucune recette trouvée.</div>';
    return;
  }

  container.innerHTML = list.map(r => {
    const etapesCount = (r.etapes || []).length;
    const ingrCount = (r.ingredients || []).length;
    const varCount = (r.variantes || []).length;
    const cible = r.perteCiblePct || r.perteCible;

    return `
      <div class="card" style="cursor:pointer; ${r.masquee ? 'opacity:0.6; border-style:dashed;' : ''}" onclick="ouvrirFicheRecette('${escapeJsStr(r.id || r.code)}')">
        <div class="card-header" style="margin-bottom:6px;">
          <div style="flex:1; padding-right:8px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="badge badge-mini">${escapeHtml(r.famille || 'Artisanal')}</span>
              ${r.typeRecette ? `<span class="badge badge-muted">${escapeHtml(r.typeRecette)}</span>` : ''}
              ${r.masquee ? '<span class="badge badge-muted">Masquée</span>' : ''}
            </div>
            <div style="font-weight:800; font-size:1.05rem; margin-top:3px;">${escapeHtml(r.nom)}</div>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            ${cible ? `<div class="badge badge-green">-${cible}% perte</div>` : ''}
            <button class="btn-icon" style="color:var(--danger); padding:4px;" title="Supprimer la recette" onclick="event.stopPropagation(); supprimerRecetteDirect('${escapeJsStr(r.id || r.code)}')">🗑️</button>
          </div>
        </div>
        <p style="font-size:0.83rem; color:var(--text-muted); line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
          ${escapeHtml(r.description || '')}
        </p>
        <div style="display:flex; gap:12px; margin-top:8px; font-size:0.75rem; color:var(--text-muted);">
          <span>⏱ ${etapesCount} étape${etapesCount > 1 ? 's' : ''}</span>
          <span>🧂 ${ingrCount} ingrédient${ingrCount > 1 ? 's' : ''}</span>
          ${varCount > 0 ? `<span>🌿 ${varCount} lot${varCount > 1 ? 's' : ''} d'épices</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

export function setFamilleFiltre(famille) {
  uiState.filtreFamilleCourant = famille;
  document.querySelectorAll('#familles-chips .chip').forEach(c => {
    if (c.id !== 'chip-masquees') {
      c.classList.toggle('active', c.innerText.trim() === famille);
    }
  });
  rendreRecettes();
}

export function basculerAfficherMasquees() {
  uiState.afficherMasquees = !uiState.afficherMasquees;
  const chip = document.getElementById('chip-masquees');
  if (chip) chip.classList.toggle('active', uiState.afficherMasquees);
  rendreRecettes();
}

export function filtrerRecettes() {
  rendreRecettes();
}

let recetteFicheActiveId = null;

export function ouvrirFicheRecette(id) {
  const r = appState.recettes.find(x => x.id === id || x.code === id);
  if (!r) return;
  recetteFicheActiveId = r.id || r.code;

  document.getElementById('fiche-nom').innerText = r.nom;
  document.getElementById('fiche-famille').innerText = `${r.famille} · ${r.typeRecette || ''}`;

  const btnMasquer = document.getElementById('btn-fiche-masquer');
  if (btnMasquer) {
    btnMasquer.innerText = r.masquee ? 'Démasquer' : 'Masquer';
  }

  let html = `
    <p style="font-size:0.88rem; line-height:1.5; color:var(--text); margin-bottom:12px;">${escapeHtml(r.description || '')}</p>
  `;

  if (r.conditionsConservation) {
    html += `<div class="conservation-box">🌡️ <strong>Conservation :</strong> ${escapeHtml(r.conditionsConservation)}</div>`;
  }

  if (r.pointsVigilance) {
    html += `<div class="vigilance-box">⚠️ <strong>Points de vigilance :</strong><br>${escapeHtml(r.pointsVigilance).replace(/\n/g, '<br>')}</div>`;
  }

  // Sorties de découpe (si multi-sorties)
  if (r.sortiesDecoupe && r.sortiesDecoupe.length > 0) {
    html += `
      <div style="font-weight:700; font-size:0.9rem; margin-top:14px; margin-bottom:6px;">Parties valorisées & Rendements</div>
      <table class="bilan-table">
        <thead><tr><th>Sortie</th><th>Rendement / ${escapeHtml(r.uniteBase || 'unité')}</th><th>Réf boutique</th></tr></thead>
        <tbody>
          ${r.sortiesDecoupe.map(s => `
            <tr>
              <td style="font-weight:600;">${escapeHtml(s.nom)}</td>
              <td>${s.rendementParUniteBase} ${escapeHtml(s.unite)}</td>
              <td>${s.valeurRefBoutiqueUnitaire.toFixed(2)} €</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // Ingrédients
  if (r.ingredients && r.ingredients.length > 0) {
    html += `
      <div style="font-weight:700; font-size:0.9rem; margin-top:14px; margin-bottom:6px;">Ingrédients de base</div>
      <div style="background:var(--surface-subtle); border-radius:var(--radius-sm); padding:10px 12px;">
        ${r.ingredients.map(ing => `
          <div style="display:flex; justify-content:space-between; padding:4px 0; font-size:0.82rem; border-bottom:1px solid var(--border-light);">
            <span>${escapeHtml(ing.nomIngredient || ing.nom)}</span>
            <strong style="color:var(--primary);">${ing.quantite || ing.qte} ${escapeHtml(ing.unite)}</strong>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Variantes
  if (r.variantes && r.variantes.length > 0) {
    html += `
      <div style="font-weight:700; font-size:0.9rem; margin-top:14px; margin-bottom:6px;">Lots & Variantes d'épices</div>
      <div style="display:flex; flex-direction:column; gap:6px;">
        ${r.variantes.map(v => `
          <div style="font-size:0.8rem; padding:8px 10px; border-radius:var(--radius-sm); border:1px solid var(--border); background:var(--surface);">
            <strong>${escapeHtml(v.nom)}</strong> : ${escapeHtml(v.descriptionEpices || '')}
            ${v.epicesGrammesParUnite ? `<span style="color:var(--primary);">(${v.epicesGrammesParUnite}g/${escapeHtml(r.uniteBase || 'pièce')})</span>` : ''}
            ${v.ajouteEtapeFumage ? ' <span class="badge badge-mini">Fumé</span>' : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Étapes
  if (r.etapes && r.etapes.length > 0) {
    html += `
      <div style="font-weight:700; font-size:0.9rem; margin-top:14px; margin-bottom:6px;">Planning de fabrication</div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        ${r.etapes.map(e => `
          <div style="font-size:0.82rem; padding:8px 10px; border-radius:var(--radius-sm); background:var(--surface-subtle);">
            <div style="font-weight:700; color:var(--text);">${e.ordre}. ${escapeHtml(e.titre)}</div>
            <div style="color:var(--text-muted); font-size:0.75rem; margin-top:2px; white-space:pre-line;">${escapeHtml(e.instructions || '')}</div>
            ${e.astuce ? `<div class="astuce-box" style="margin-top:4px;">💡 ${escapeHtml(e.astuce)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  document.getElementById('fiche-body').innerHTML = html;
  document.getElementById('modal-fiche-recette').classList.add('active');
}

export function basculerMasquageDepuisFiche() {
  if (!recetteFicheActiveId) return;
  const r = appState.recettes.find(x => x.id === recetteFicheActiveId || x.code === recetteFicheActiveId);
  if (!r) return;
  r.masquee = !r.masquee;
  sauvegarderDonnees();
  window.fermerModals();
  rendreRecettes();
}

export function planifierDepuisFiche() {
  if (!recetteFicheActiveId) return;
  const recId = recetteFicheActiveId;
  window.fermerModals();
  window.ouvrirModalPlanifier(recId);
}

export function supprimerRecetteDirect(id) {
  const r = appState.recettes.find(x => x.id === id || x.code === id);
  if (!r) return;
  if (!confirm(`Supprimer définitivement la recette « ${r.nom} » ?\nCette action est irréversible.`)) {
    return;
  }
  supprimerRecetteParId(id);
}

export function supprimerRecetteDepuisFiche() {
  if (!recetteFicheActiveId) return;
  const r = appState.recettes.find(x => x.id === recetteFicheActiveId || x.code === recetteFicheActiveId);
  if (!r) return;
  if (!confirm(`Supprimer définitivement la recette « ${r.nom} » ?\nCette action est irréversible.`)) {
    return;
  }
  supprimerRecetteParId(recetteFicheActiveId);
  window.fermerModals();
}

export function supprimerRecetteParId(id) {
  const idx = appState.recettes.findIndex(x => x.id === id || x.code === id);
  if (idx === -1) return;
  const rec = appState.recettes[idx];
  const recId = rec.id || rec.code;

  if (!Array.isArray(appState.recettesSupprimees)) {
    appState.recettesSupprimees = [];
  }
  if (!appState.recettesSupprimees.includes(recId)) {
    appState.recettesSupprimees.push(recId);
  }

  appState.recettes.splice(idx, 1);

  if (uiState.dropdownRecetteSelectionneeId === recId) {
    uiState.dropdownRecetteSelectionneeId = appState.recettes.length > 0 ? (appState.recettes[0].id || appState.recettes[0].code) : '';
  }

  sauvegarderDonnees();
  rendreRecettes();
  if (typeof window.initialiserSelectRecettesLotsParam === 'function') window.initialiserSelectRecettesLotsParam();
}

export function ouvrirModalCreerRecette() {
  const modal = document.getElementById('modal-creer-recette');
  if (!modal) return;
  document.getElementById('cr-nom').value = '';
  document.getElementById('cr-famille').value = 'Porc';
  document.getElementById('cr-perte').value = '35';
  document.getElementById('cr-desc').value = '';
  const ingList = document.getElementById('cr-ingredients-list');
  const etapesList = document.getElementById('cr-etapes-list');
  if (ingList) ingList.innerHTML = '';
  if (etapesList) etapesList.innerHTML = '';
  ajouterLigneIngredient('Sel fin', '28', 'g', 'POURCENT_POIDS');
  ajouterLigneEtape('Salage & Assaisonnement', '2', 'jours', 'Frotter la pièce avec le mélange sel et épices puis mettre au frais.');
  modal.classList.add('active');
}

export function ajouterLigneIngredient(nom = '', quantite = '', unite = 'g', typeCalcul = 'POURCENT_POIDS') {
  const list = document.getElementById('cr-ingredients-list');
  if (!list) return;
  const row = document.createElement('div');
  row.className = 'cr-ing-row';
  row.style.cssText = 'display:grid; grid-template-columns:1.5fr 0.7fr 0.7fr 1.1fr auto; gap:6px; margin-bottom:6px; align-items:center;';
  row.innerHTML = `
    <input type="text" class="form-control cr-ing-nom" placeholder="Ingrédient" value="${escapeHtml(nom)}" style="padding:7px 8px; font-size:0.82rem;">
    <input type="number" step="0.1" class="form-control cr-ing-qte" placeholder="Qté" value="${escapeHtml(String(quantite))}" style="padding:7px 8px; font-size:0.82rem;">
    <select class="form-control cr-ing-unite" style="padding:7px 6px; font-size:0.82rem;">
      <option value="g" ${unite === 'g' ? 'selected' : ''}>g</option>
      <option value="kg" ${unite === 'kg' ? 'selected' : ''}>kg</option>
      <option value="mL" ${unite === 'mL' ? 'selected' : ''}>mL</option>
      <option value="pièce" ${unite === 'pièce' ? 'selected' : ''}>pièce</option>
    </select>
    <select class="form-control cr-ing-mode" style="padding:7px 6px; font-size:0.82rem;">
      <option value="POURCENT_POIDS" ${typeCalcul === 'POURCENT_POIDS' ? 'selected' : ''}>par kg</option>
      <option value="PAR_UNITE" ${typeCalcul === 'PAR_UNITE' ? 'selected' : ''}>par unité</option>
      <option value="FIXE" ${typeCalcul === 'FIXE' ? 'selected' : ''}>fixe</option>
    </select>
    <button type="button" class="btn-icon" onclick="this.parentElement.remove()" style="color:var(--danger); padding:4px 6px;" title="Supprimer">✕</button>
  `;
  list.appendChild(row);
}

export function ajouterLigneEtape(titre = '', duree = '1', uniteDuree = 'jours', instructions = '') {
  const list = document.getElementById('cr-etapes-list');
  if (!list) return;
  const row = document.createElement('div');
  row.className = 'cr-etape-row';
  row.style.cssText = 'background:var(--surface-subtle); border:1px solid var(--border); border-radius:8px; padding:8px; margin-bottom:8px;';
  row.innerHTML = `
    <div style="display:flex; gap:6px; margin-bottom:6px; align-items:center;">
      <input type="text" class="form-control cr-etape-titre" placeholder="Titre de l'étape" value="${escapeHtml(titre)}" style="flex:2; padding:7px 8px; font-size:0.82rem;">
      <input type="number" min="0" step="1" class="form-control cr-etape-duree" value="${escapeHtml(String(duree))}" style="width:62px; padding:7px 6px; font-size:0.82rem;">
      <select class="form-control cr-etape-unite" style="width:86px; padding:7px 6px; font-size:0.82rem;">
        <option value="heures" ${uniteDuree === 'heures' ? 'selected' : ''}>heures</option>
        <option value="jours" ${uniteDuree === 'jours' ? 'selected' : ''}>jours</option>
        <option value="semaines" ${uniteDuree === 'semaines' ? 'selected' : ''}>sem.</option>
      </select>
      <button type="button" class="btn-icon" onclick="this.closest('.cr-etape-row').remove()" style="color:var(--danger); padding:4px 6px;" title="Supprimer">✕</button>
    </div>
    <input type="text" class="form-control cr-etape-instr" placeholder="Instructions (optionnel)" value="${escapeHtml(instructions)}" style="padding:7px 8px; font-size:0.8rem;">
  `;
  list.appendChild(row);
}

export function sauvegarderRecettePersonnalisee() {
  const nom = (document.getElementById('cr-nom').value || '').trim();
  if (!nom) {
    alert('Veuillez saisir un nom de recette.');
    return;
  }
  const famille = document.getElementById('cr-famille').value || 'Porc';
  const perteParsed = parseFloat(document.getElementById('cr-perte').value);
  const perteCiblePct = (!Number.isNaN(perteParsed) && perteParsed >= 0) ? perteParsed : 35;
  const description = (document.getElementById('cr-desc').value || '').trim();

  const ingredients = Array.from(document.querySelectorAll('#cr-ingredients-list .cr-ing-row')).map(row => {
    const ingNom = (row.querySelector('.cr-ing-nom')?.value || '').trim();
    const qte = parseFloat(row.querySelector('.cr-ing-qte')?.value || '0') || 0;
    const unite = row.querySelector('.cr-ing-unite')?.value || 'g';
    const typeCalcul = row.querySelector('.cr-ing-mode')?.value || 'POURCENT_POIDS';
    return {
      nom: ingNom,
      quantite: qte,
      unite,
      typeCalcul,
      categorieCourses: 'Épices & Assaisonnement',
      prixKgOuUniteEstime: 0
    };
  }).filter(i => i.nom && i.quantite > 0);

  let offsetMin = 0;
  const etapes = Array.from(document.querySelectorAll('#cr-etapes-list .cr-etape-row')).map((row, idx) => {
    const titre = (row.querySelector('.cr-etape-titre')?.value || '').trim();
    const dureeVal = Math.max(0, parseFloat(row.querySelector('.cr-etape-duree')?.value || '1') || 0);
    const uniteDuree = row.querySelector('.cr-etape-unite')?.value || 'jours';
    const instr = (row.querySelector('.cr-etape-instr')?.value || '').trim();
    const mult = uniteDuree === 'heures' ? 60 : (uniteDuree === 'semaines' ? 7 * 1440 : 1440);
    const dureeMin = Math.round(dureeVal * mult);
    const jourNum = Math.floor(offsetMin / 1440) + 1;
    const etape = {
      ordre: idx + 1,
      titre: titre || `Étape ${idx + 1}`,
      instructions: instr,
      offsetDebutMinutes: offsetMin,
      dureeMinutes: dureeMin,
      jourLibelle: `Jour ${jourNum}`,
      astuce: ''
    };
    offsetMin += dureeMin;
    return etape;
  });

  const code = 'custom_' + Date.now();
  const nouvelleRecette = {
    id: code,
    code,
    nom,
    famille,
    typeRecette: 'Personnalisée',
    uniteBase: 'kg',
    quantiteBaseDefaut: 1,
    description: description || 'Recette personnalisée',
    perteCiblePct,
    ingredients,
    etapes,
    variantes: [],
    sortiesDecoupe: []
  };

  appState.recettes.unshift(nouvelleRecette);
  sauvegarderDonnees();
  rendreRecettes();
  if (typeof window.initialiserSelectRecettesLotsParam === 'function') window.initialiserSelectRecettesLotsParam();
  window.fermerModals();
}
