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
