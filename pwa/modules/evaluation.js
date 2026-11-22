// Fiche d'évaluation & Dégustation finale + Rappel automatique lors de la planification
import { appState, uiState, sauvegarderDonnees, escapeHtml, escapeJsStr, svgIcon } from './state.js';

export function getEvaluationProjet(projetId) {
  if (!Array.isArray(appState.evaluations)) return null;
  return appState.evaluations.find(e => e.projetId === projetId) || null;
}

export function getDerniereEvaluationRecette(recetteId, nomRecette = '') {
  if (!Array.isArray(appState.evaluations) || appState.evaluations.length === 0) return null;
  const matches = appState.evaluations.filter(e =>
    (recetteId && (e.recetteId === recetteId || e.recetteCode === recetteId)) ||
    (nomRecette && e.nomRecette && e.nomRecette.toLowerCase() === nomRecette.toLowerCase())
  );
  if (matches.length === 0) return null;
  matches.sort((a, b) => new Date(b.date) - new Date(a.date));
  return matches[0];
}

export function ouvrirModalEvaluationProjet(projId = null) {
  const id = projId || uiState.projetActuelId;
  const p = appState.projets.find(x => x.id === id);
  if (!p) return;

  const exist = getEvaluationProjet(p.id);
  document.getElementById('eval-proj-id').value = p.id;
  document.getElementById('eval-proj-nom').textContent = p.nom;
  document.getElementById('eval-note').value = exist ? exist.noteGlobale : 5;
  document.getElementById('eval-texture').value = exist ? exist.texture : 'Équilibrée / Fondante';
  document.getElementById('eval-salinite').value = exist ? exist.salinite : 'Parfaite';
  document.getElementById('eval-aromes').value = exist ? exist.aromes : 'Équilibrés';
  document.getElementById('eval-commentaire').value = exist ? (exist.commentaire || '') : '';

  document.getElementById('modal-evaluation').classList.add('active');
}

export function sauvegarderEvaluationModal() {
  const projId = document.getElementById('eval-proj-id').value;
  const p = appState.projets.find(x => x.id === projId);
  if (!p) return;

  const noteGlobale = parseInt(document.getElementById('eval-note').value, 10) || 5;
  const texture = document.getElementById('eval-texture').value;
  const salinite = document.getElementById('eval-salinite').value;
  const aromes = document.getElementById('eval-aromes').value;
  const commentaire = document.getElementById('eval-commentaire').value.trim();

  if (!Array.isArray(appState.evaluations)) appState.evaluations = [];
  const idx = appState.evaluations.findIndex(e => e.projetId === p.id);
  const record = {
    id: idx >= 0 ? appState.evaluations[idx].id : ('eval_' + Date.now()),
    projetId: p.id,
    recetteId: p.recettePrincipaleId || p.recetteId,
    nomRecette: p.nomRecettePrincipale || p.nom,
    date: new Date().toISOString().slice(0, 10),
    noteGlobale,
    texture,
    salinite,
    aromes,
    commentaire
  };

  if (idx >= 0) {
    appState.evaluations[idx] = record;
  } else {
    appState.evaluations.push(record);
  }

  sauvegarderDonnees();
  if (typeof window.fermerModals === 'function') window.fermerModals();
  if (typeof window.rendreBudgetProjet === 'function') window.rendreBudgetProjet(p);
  if (typeof window.rendreProductionProjet === 'function') window.rendreProductionProjet(p);
}

export function rendreCarteEvaluationProjet(p) {
  const ev = getEvaluationProjet(p.id);
  if (!ev) {
    return `
      <div class="card" style="border:1px dashed var(--primary); background:var(--surface-subtle);">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <div>
            <div style="font-weight:700; font-size:0.92rem;">${svgIcon('wine', 16)} Fiche d'évaluation & Dégustation</div>
            <div style="font-size:0.78rem; color:var(--text-muted);">Notez texture, salinité et arômes pour ajuster votre prochaine session.</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="ouvrirModalEvaluationProjet('${escapeJsStr(p.id)}')">Évaluer</button>
        </div>
      </div>
    `;
  }

  const noteClamp = Math.max(0, Math.min(5, Number(ev.noteGlobale) || 0));
  const etoiles = svgIcon('star-filled', 14).repeat(noteClamp) + svgIcon('star', 14).repeat(5 - noteClamp);
  return `
    <div class="card" style="border-left:4px solid var(--primary);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <div style="font-weight:700; font-size:0.95rem;">${svgIcon('wine', 16)} Évaluation & Dégustation</div>
        <button class="btn btn-secondary btn-sm" onclick="ouvrirModalEvaluationProjet('${escapeJsStr(p.id)}')">Modifier</button>
      </div>
      <div style="font-size:0.95rem; margin-bottom:6px;">${etoiles} <span style="font-size:0.78rem; color:var(--text-muted);">(${new Date(ev.date).toLocaleDateString('fr-FR')})</span></div>
      <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
        <span class="badge-mini">Texture : ${escapeHtml(ev.texture)}</span>
        <span class="badge-mini">Salinité : ${escapeHtml(ev.salinite)}</span>
        <span class="badge-mini">Arômes : ${escapeHtml(ev.aromes)}</span>
      </div>
      ${ev.commentaire ? `<div style="font-size:0.82rem; font-style:italic; color:var(--text);">"${escapeHtml(ev.commentaire)}"</div>` : ''}
    </div>
  `;
}

export function rendreRappelEvaluationPlanification(recetteId, nomRecette) {
  const box = document.getElementById('plan-eval-rappel');
  if (!box) return;
  const ev = getDerniereEvaluationRecette(recetteId, nomRecette);
  if (!ev) {
    box.style.display = 'none';
    box.innerHTML = '';
    return;
  }
  const noteClamp = Math.max(0, Math.min(5, Number(ev.noteGlobale) || 0));
  const etoiles = svgIcon('star-filled', 13).repeat(noteClamp);
  box.style.display = 'block';
  box.innerHTML = `
    <div style="font-weight:700; font-size:0.82rem; margin-bottom:3px;">${svgIcon('lightbulb', 14)} Retour de votre dernière session (${new Date(ev.date).toLocaleDateString('fr-FR')}) ${etoiles}</div>
    <div style="font-size:0.78rem; color:var(--text);">
      Texture : <strong>${escapeHtml(ev.texture)}</strong> · Salinité : <strong>${escapeHtml(ev.salinite)}</strong> · Arômes : <strong>${escapeHtml(ev.aromes)}</strong>
    </div>
    ${ev.commentaire ? `<div style="font-size:0.78rem; color:var(--primary); margin-top:3px; font-weight:600;">${svgIcon('file-text', 13)} "${escapeHtml(ev.commentaire)}"</div>` : ''}
  `;
}
