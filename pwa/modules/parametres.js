import { appState, uiState, sauvegarderDonnees, verifierPersistanceStockage, escapeHtml, escapeJsStr } from './state.js';
export function basculerSousOngletParametres(onglet) {
  document.querySelectorAll('#view-parametres .sub-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-btn-params-' + onglet).classList.add('active');

  document.getElementById('subview-params-tarifs').style.display = (onglet === 'tarifs') ? 'block' : 'none';
  document.getElementById('subview-params-lots').style.display = (onglet === 'lots') ? 'block' : 'none';

  if (onglet === 'lots') {
    initialiserSelectRecettesLotsParam();
    rendreLotsParametrage();
  } else {
    rendreParametres();
  }
}

export function rendreParametres() {
  if (typeof window.appliquerOptionRevente === 'function') window.appliquerOptionRevente();
  const statusEl = document.getElementById('ios-storage-status');
  if (statusEl) {
    const persistedTxt = uiState.storagePersisted === true
      ? '🔒 Stockage persistant activé'
      : (uiState.storagePersisted === false ? '⚠️ Stockage non persistant (export régulier recommandé)' : 'ℹ️ Vérification du stockage...');
    const lastB = appState.lastBackupAt
      ? `Dernier export : ${new Date(appState.lastBackupAt).toLocaleDateString('fr-FR')}`
      : 'Aucun export effectué';
    statusEl.textContent = `${persistedTxt} · ${lastB}`;
  }
  const container = document.getElementById('params-tarifs-list');
  if (!container) return;

  const params = (appState.parametres || []).filter(p => p.cle !== 'ACTIVER_REVENTE' && p.cle !== 'ACTIVER_PRIX');
  container.innerHTML = params.map(p => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border-light);">
      <div>
        <div style="font-weight:600; font-size:0.85rem;">${escapeHtml(p.libelle)}</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(p.description || '')}</div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <strong>${p.valeur} ${escapeHtml(p.unite)}</strong>
        <button class="btn btn-secondary btn-sm" onclick="ouvrirModalModifierParam('${escapeJsStr(p.cle)}')" style="padding:4px 8px;">✎</button>
      </div>
    </div>
  `).join('');
}

export function ouvrirModalModifierParam(cle) {
  const p = appState.parametres.find(x => x.cle === cle);
  if (!p) return;
  document.getElementById('edit-param-cle').value = p.cle;
  document.getElementById('modal-param-libelle').innerText = p.libelle;
  document.getElementById('modal-param-desc').innerText = p.description || '';
  document.getElementById('modal-param-unite').innerText = p.unite || '';
  document.getElementById('edit-param-valeur').value = p.valeur;
  document.getElementById('modal-edit-param').classList.add('active');
}

export function sauvegarderParametreModal() {
  const cle = document.getElementById('edit-param-cle').value;
  const p = appState.parametres.find(x => x.cle === cle);
  if (!p) return;
  p.valeur = parseFloat(document.getElementById('edit-param-valeur').value) || p.valeur;
  sauvegarderDonnees();
  if (typeof window.fermerModals === 'function') window.fermerModals();
  rendreParametres();
}

// Onglet Lots à paramétrer
export function initialiserSelectRecettesLotsParam() {
  const select = document.getElementById('select-recette-lots-param');
  if (!select) return;
  const recettes = appState.recettes || [];
  select.innerHTML = recettes.map(r => `
    <option value="${escapeHtml(r.id || r.code)}">${escapeHtml(r.nom)} (${escapeHtml(r.famille)})</option>
  `).join('');
}

export function rendreLotsParametrage() {
  const select = document.getElementById('select-recette-lots-param');
  const container = document.getElementById('lots-param-list');
  if (!select || !container) return;

  const recId = select.value;
  const r = appState.recettes.find(x => x.id === recId || x.code === recId);
  if (!r) return;

  const vars = r.variantes || [];
  if (vars.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted); font-size:0.8rem; padding:8px 0;">Aucun lot d\'épices prédéfini pour cette charcuterie.</div>';
    return;
  }

  container.innerHTML = vars.map((v, idx) => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border-light);">
      <div>
        <div style="font-weight:600; font-size:0.85rem;">${escapeHtml(v.nom)} ${v.ajouteEtapeFumage ? '<span class="badge badge-mini">Fumage</span>' : ''}</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(v.descriptionEpices || '')} · ${v.epicesGrammesParUnite || 0}g/${escapeHtml(r.uniteBase || 'pièce')} · Salage : ${v.dureeSalageHeuresSpecifique || 24}h</div>
      </div>
      <div style="display:flex; gap:6px;">
        <button class="btn btn-secondary btn-sm" onclick="ouvrirModalModifierVariante('${escapeJsStr(recId)}', ${idx})">✎</button>
        <button class="btn btn-secondary btn-sm" onclick="supprimerVariante('${escapeJsStr(recId)}', ${idx})" style="color:var(--danger);">✕</button>
      </div>
    </div>
  `).join('');
}

export function ouvrirModalAjouterVariante() {
  const recId = document.getElementById('select-recette-lots-param').value;
  document.getElementById('edit-var-recette-id').value = recId;
  document.getElementById('edit-var-index').value = '-1';
  document.getElementById('modal-var-titre').innerText = 'Ajouter un lot d\'assaisonnement';
  document.getElementById('edit-var-nom').value = '';
  document.getElementById('edit-var-desc').value = '';
  document.getElementById('edit-var-epices').value = '15';
  document.getElementById('edit-var-salage').value = '24';
  document.getElementById('edit-var-fume').checked = false;
  document.getElementById('modal-edit-variante').classList.add('active');
}

export function ouvrirModalModifierVariante(recId, idx) {
  const r = appState.recettes.find(x => x.id === recId || x.code === recId);
  if (!r || !r.variantes || !r.variantes[idx]) return;
  const v = r.variantes[idx];

  document.getElementById('edit-var-recette-id').value = recId;
  document.getElementById('edit-var-index').value = idx;
  document.getElementById('modal-var-titre').innerText = 'Modifier le lot';
  document.getElementById('edit-var-nom').value = v.nom;
  document.getElementById('edit-var-desc').value = v.descriptionEpices || '';
  document.getElementById('edit-var-epices').value = v.epicesGrammesParUnite || 15;
  document.getElementById('edit-var-salage').value = v.dureeSalageHeuresSpecifique || 24;
  document.getElementById('edit-var-fume').checked = v.ajouteEtapeFumage === true;

  document.getElementById('modal-edit-variante').classList.add('active');
}

export function sauvegarderVarianteModal() {
  const recId = document.getElementById('edit-var-recette-id').value;
  const r = appState.recettes.find(x => x.id === recId || x.code === recId);
  if (!r) return;

  const nom = (document.getElementById('edit-var-nom').value || '').trim();
  if (!nom) return;
  const desc = (document.getElementById('edit-var-desc').value || '').trim();
  const epices = parseFloat(document.getElementById('edit-var-epices').value) || 0;
  const salage = parseFloat(document.getElementById('edit-var-salage').value) || 24;
  const fume = document.getElementById('edit-var-fume').checked;

  const idx = parseInt(document.getElementById('edit-var-index').value, 10);
  if (!r.variantes) r.variantes = [];

  if (idx >= 0 && r.variantes[idx]) {
    r.variantes[idx].nom = nom;
    r.variantes[idx].descriptionEpices = desc;
    r.variantes[idx].epicesGrammesParUnite = epices;
    r.variantes[idx].dureeSalageHeuresSpecifique = salage;
    r.variantes[idx].ajouteEtapeFumage = fume;
  } else {
    r.variantes.push({
      nom: nom,
      descriptionEpices: desc,
      epicesGrammesParUnite: epices,
      dureeSalageHeuresSpecifique: salage,
      ajouteEtapeFumage: fume
    });
  }

  sauvegarderDonnees();
  if (typeof window.fermerModals === 'function') window.fermerModals();
  rendreLotsParametrage();
}

export function supprimerVariante(recId, idx) {
  const r = appState.recettes.find(x => x.id === recId || x.code === recId);
  if (!r || !r.variantes) return;
  if (!confirm('Supprimer cette variante d\'épices ?')) return;
  r.variantes.splice(idx, 1);
  sauvegarderDonnees();
  rendreLotsParametrage();
}