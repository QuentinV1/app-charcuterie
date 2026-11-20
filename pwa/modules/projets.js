// Gestion des projets / sessions (liste, planning, production & lots, budget & évaluation)
import { appState, uiState, sauvegarderDonnees, getValeurParametre, escapeHtml, escapeJsStr } from './state.js';
import { CalculateurCharcuterie, analyserCourbePesees } from './calculateur.js';
import { supprimerPhotosProjetIDB, chargerMiniaturesEtapesPWA } from './photos.js';
import { rendreCarteEvaluationProjet } from './evaluation.js';
import { estConnecteFirebase, saveUserRecipeFirestore } from './firebase.js';

export function masquerGuideDebutant() {
  let param = (appState.parametres || []).find(p => p.cle === 'MASQUER_GUIDE_DEBUTANT');
  if (!param) {
    appState.parametres.push({
      cle: 'MASQUER_GUIDE_DEBUTANT',
      libelle: 'Masquer le guide débutant',
      categorie: 'GENERAL',
      valeur: 1,
      unite: 'option'
    });
  } else {
    param.valeur = 1;
  }
  sauvegarderDonnees();
  rendreProjets();
}

export function rendreProjets() {
  const container = document.getElementById('projets-list');
  const summary = document.getElementById('projets-summary');
  const guideContainer = document.getElementById('guide-debutant-container');
  if (!container || !summary) return;

  if (guideContainer) {
    const masquerGuide = getValeurParametre('MASQUER_GUIDE_DEBUTANT', 0) >= 0.5;
    guideContainer.innerHTML = masquerGuide ? '' : `
      <div class="guide-debutant-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-weight:800; font-size:0.95rem;">Comment fonctionne l'application ?</div>
          <button type="button" class="btn btn-secondary btn-sm" style="padding:3px 9px; font-size:0.72rem;" onclick="masquerGuideDebutant()">Masquer</button>
        </div>
        <div class="guide-step-row"><span class="guide-step-num">1</span><span>Choisissez une recette dans <strong>Charcuteries</strong> et cliquez sur <strong>Planifier</strong>.</span></div>
        <div class="guide-step-row"><span class="guide-step-num">2</span><span>Retrouvez vos ingrédients auto-calculés dans <strong>Courses</strong> et vos lots en <strong>Production</strong>.</span></div>
        <div class="guide-step-row"><span class="guide-step-num">3</span><span>Suivez chaque étape du <strong>Planning</strong> et tracez vos pesées d'affinage jusqu'à dégustation.</span></div>
      </div>
    `;
  }

  const nbActifs = appState.projets.filter(p => p.statut === 'EN_COURS').length;
  summary.innerText = `${appState.projets.length} session${appState.projets.length > 1 ? 's' : ''} (${nbActifs} active${nbActifs > 1 ? 's' : ''})`;

  if (appState.projets.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 16px; color: var(--text-muted);">
        <div style="font-size: 3rem; margin-bottom: 12px;">🥩</div>
        <div style="font-weight: 700; font-size: 1.15rem; color: var(--text); margin-bottom: 6px;">Aucune session en cours</div>
        <p style="font-size: 0.88rem; max-width: 320px; margin: 0 auto 20px;">Lancez votre première fabrication artisanale (canard, jambon, coppa, sanglier, saucisses...).</p>
        <button class="btn btn-primary" onclick="ouvrirModalPlanifier()">+ Planifier une session</button>
      </div>
    `;
    return;
  }

  const prixActif = window.estOptionPrixActive ? window.estOptionPrixActive() : true;

  container.innerHTML = appState.projets.map(p => {
    const etapes = p.etapes || [];
    const terminees = etapes.filter(e => e.terminee || e.fait).length;
    const pct = etapes.length > 0 ? Math.round((terminees / etapes.length) * 100) : 0;
    const estTermine = p.statut === 'TERMINE';
    const dt = p.dateDebut ? new Date(p.dateDebut) : null;
    const dateFormatted = dt ? dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const heureFormatted = dt ? dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

    const prochaineEtape = etapes.find(e => !(e.terminee || e.fait));
    const lotsResume = (p.lots || [])
      .filter(l => (l.quantiteReelle ?? l.quantitePrevue ?? 0) > 0)
      .map(l => `${l.quantiteReelle ?? l.quantitePrevue} ${escapeHtml(l.variante || 'Standard')}`)
      .join(' · ');

    const bilan = prixActif ? CalculateurCharcuterie.calculerBilanProjet(p) : null;

    return `
      <div class="card" style="cursor:pointer;" onclick="ouvrirDetailProjet('${escapeJsStr(p.id)}')">
        <div class="card-header">
          <div>
            <div style="display:flex; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:4px;">
              <span class="badge badge-mini">${escapeHtml(p.nomRecettePrincipale || 'Artisanal')}</span>
              <span class="badge ${estTermine ? 'badge-muted' : 'badge-green'}">${estTermine ? 'Terminé' : 'En cours'}</span>
              ${heureFormatted ? `<span class="badge badge-muted">🕒 ${dateFormatted} · ${heureFormatted}</span>` : ''}
            </div>
            <div style="font-weight: 800; font-size: 1.05rem;">${escapeHtml(p.nom)}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top:2px;">
              ${(() => { const q = p.quantiteBasePrevue || p.quantite || 1; const u = p.unite || 'pièces'; const uPl = (q > 1 && ['canard', 'pièce', 'magret'].includes(u.toLowerCase())) ? u + 's' : u; return `${q} ${escapeHtml(uPl)}`; })()}
              ${lotsResume ? ` · ${lotsResume}` : ''}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:800; color:var(--primary); font-size:1.1rem;">${pct}%</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${terminees}/${etapes.length} étapes</div>
            ${bilan ? `<div style="font-size:0.75rem; font-weight:700; color:var(--text); margin-top:2px;">Coût : ${bilan.coutRevientGlobal.toFixed(0)} €</div>` : ''}
          </div>
        </div>

        <div style="width: 100%; height: 6px; background: var(--surface-subtle); border-radius: 3px; overflow: hidden; margin-top: 8px;">
          <div style="width: ${pct}%; height: 100%; background: ${estTermine ? 'var(--secondary)' : 'var(--primary)'}; border-radius: 3px; transition: width 0.3s ease;"></div>
        </div>

        ${prochaineEtape && !estTermine ? `
          <div class="proj-next-step">
            <span>▶ À suivre : ${escapeHtml(prochaineEtape.titre)}</span>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

export function ouvrirDetailProjet(projId) {
  const p = appState.projets.find(x => x.id === projId);
  if (!p) return;
  uiState.projetActuelId = projId;

  document.getElementById('proj-detail-titre').innerText = p.nom;
  document.getElementById('proj-detail-recette').innerText = `${p.nomRecettePrincipale || ''} · ${p.quantiteBasePrevue || p.quantite || 1} ${p.unite || 'pièces'}`;

  const btnStatut = document.getElementById('btn-toggle-termine-projet');
  if (p.statut === 'TERMINE') {
    btnStatut.innerText = 'Réactiver';
    btnStatut.className = 'btn btn-secondary btn-sm';
  } else {
    btnStatut.innerText = 'Terminer';
    btnStatut.className = 'btn btn-primary btn-sm';
  }

  const btnBudget = document.getElementById('tab-btn-budget');
  if (btnBudget) btnBudget.style.display = window.estOptionPrixActive() ? '' : 'none';

  basculerSousOngletProjet('planning');
  window.naviguerVers('projet-detail');
}

export function basculerSousOngletProjet(onglet) {
  if (onglet === 'budget' && !window.estOptionPrixActive()) {
    onglet = 'planning';
  }
  document.querySelectorAll('#view-projet-detail .sub-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-btn-' + onglet).classList.add('active');

  document.getElementById('subview-proj-planning').style.display = (onglet === 'planning') ? 'block' : 'none';
  document.getElementById('subview-proj-production').style.display = (onglet === 'production') ? 'block' : 'none';
  document.getElementById('subview-proj-budget').style.display = (onglet === 'budget') ? 'block' : 'none';

  if (!uiState.projetActuelId) return;
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p) return;

  if (onglet === 'planning') rendrePlanningProjet(p);
  else if (onglet === 'production') rendreProductionProjet(p);
  else if (onglet === 'budget') rendreBudgetProjet(p);
}

function estEtapeSechageOuPesee(et) {
  const t = (et?.titre || '').toLowerCase();
  return t.includes('séchage') || t.includes('affinage') || t.includes('maturation') || t.includes('pesée');
}

export function rendrePlanningProjet(p) {
  const container = document.getElementById('proj-etapes-list');
  const etapes = p.etapes || [];

  if (etapes.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted); padding:16px;">Aucune étape planifiée.</div>';
    return;
  }

  const activeIdx = etapes.findIndex(e => !(e.terminee || e.fait));
  let activeCardHtml = '';
  if (activeIdx >= 0) {
    const cur = etapes[activeIdx];
    const dtCur = new Date(getEtapeDebutMillisPWA(p, cur));
    const dtStr = dtCur.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const hasLots = Array.isArray(p.lots) && p.lots.length > 0;
    activeCardHtml = `
      <div class="active-step-card">
        <div class="active-step-badge">ÉTAPE EN COURS (${activeIdx + 1}/${etapes.length})</div>
        <div style="font-weight:800; font-size:1rem; margin-bottom:2px;">${cur.ordre ? cur.ordre + '. ' : ''}${escapeHtml(cur.titre)}</div>
        <div style="font-size:0.78rem; color:var(--primary-dark); font-weight:600; margin-bottom:8px;">📅 ${dtStr}</div>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          <button type="button" class="btn btn-primary btn-sm" onclick="basculerEtapeProjetActuel(${activeIdx})">✓ Marquer comme fait</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="demarrerEtapeMaintenantPWA(${activeIdx})">Démarrer maintenant</button>
          ${hasLots && estEtapeSechageOuPesee(cur) ? `<button type="button" class="btn btn-secondary btn-sm" onclick="basculerSousOngletProjet('production')">⚖️ Peser mes lots</button>` : ''}
        </div>
      </div>
    `;
  }

  container.innerHTML = activeCardHtml + etapes.map((et, idx) => {
    const isDone = et.terminee || et.fait;
    const dateEtape = et.debutPrevuMillis ? new Date(et.debutPrevuMillis) : (p.dateDebut ? new Date(new Date(p.dateDebut).getTime() + (et.offsetDebutMinutes || 0) * 60000) : null);
    const dateStr = dateEtape ? dateEtape.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
    const dureeH = et.dureeMinutes ? (et.dureeMinutes >= 60 ? (et.dureeMinutes / 60).toFixed(0) + 'h' : et.dureeMinutes + 'min') : '';
    const showPeser = !isDone && Array.isArray(p.lots) && p.lots.length > 0 && estEtapeSechageOuPesee(et);

    return `
      <div class="card" style="padding:12px; margin-bottom:10px; ${isDone ? 'opacity:0.75;' : ''}">
        <div style="display:flex; align-items:flex-start; gap:10px;">
          <input type="checkbox" ${isDone ? 'checked' : ''} onchange="basculerEtapeProjetActuel(${idx})" style="width:20px; height:20px; margin-top:3px; accent-color:var(--primary); cursor:pointer;">
          <div style="flex:1;">
            ${et.jourLibelle ? `<span class="badge-jour">${escapeHtml(et.jourLibelle)}</span>` : ''}
            <div style="font-weight:700; font-size:0.95rem; ${isDone ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">
              ${et.ordre ? et.ordre + '. ' : ''}${escapeHtml(et.titre)}
            </div>
            ${dateStr ? `<div style="font-size:0.75rem; color:var(--primary); font-weight:600; margin:2px 0;">📅 ${dateStr} ${dureeH ? '(' + dureeH + ')' : ''}</div>` : ''}
            <div style="font-size:0.82rem; color:var(--text); line-height:1.45; margin-top:4px; white-space:pre-line;">${escapeHtml(et.instructions || '')}</div>
            ${et.astuce ? `<div class="astuce-box">💡 <strong>Astuce Pro :</strong> ${escapeHtml(et.astuce)}</div>` : ''}
            ${Array.isArray(et.photoIds) && et.photoIds.length > 0 ? `<div class="etape-photos-strip" id="etape-photos-${idx}"></div>` : ''}
            <div class="etape-photo-actions">
              <label class="btn-photo-mini">
                📷 ${Array.isArray(et.photoIds) && et.photoIds.length > 0 ? `Ajouter photo (${et.photoIds.length})` : 'Ajouter photo'}
                <input type="file" accept="image/*" multiple style="display:none;" onchange="ajouterPhotosEtapePWA(${idx}, this.files); this.value='';">
              </label>
              ${showPeser ? `<button type="button" class="btn-photo-mini" onclick="basculerSousOngletProjet('production')">⚖️ Peser</button>` : ''}
            </div>
            ${!isDone ? `
              <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
                <button type="button" class="btn btn-secondary btn-sm" style="padding:4px 8px; font-size:0.75rem;" onclick="decalerEtapePWA(${idx}, -60)">-1h</button>
                <button type="button" class="btn btn-secondary btn-sm" style="padding:4px 8px; font-size:0.75rem;" onclick="decalerEtapePWA(${idx}, -15)">-15m</button>
                <button type="button" class="btn btn-secondary btn-sm" style="padding:4px 8px; font-size:0.75rem;" onclick="decalerEtapePWA(${idx}, 15)">+15m</button>
                <button type="button" class="btn btn-secondary btn-sm" style="padding:4px 8px; font-size:0.75rem;" onclick="decalerEtapePWA(${idx}, 60)">+1h</button>
                <button type="button" class="btn btn-secondary btn-sm" style="padding:4px 8px; font-size:0.75rem;" onclick="decalerEtapePWA(${idx}, 1440)">+1j</button>
                <button type="button" class="btn btn-secondary btn-sm" style="padding:4px 9px; font-size:0.75rem;" onclick="ouvrirModalHoraireEtape(${idx})">🕒 Horaire</button>
                <button type="button" class="btn btn-primary btn-sm" style="padding:4px 10px; font-size:0.75rem;" onclick="demarrerEtapeMaintenantPWA(${idx})">Maintenant</button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  chargerMiniaturesEtapesPWA(p);
}

export function ouvrirModalHoraireEtape(etapeIdx) {
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p || !p.etapes || !p.etapes[etapeIdx]) return;
  const et = p.etapes[etapeIdx];
  const ms = getEtapeDebutMillisPWA(p, et);
  const dt = new Date(ms);
  const pad = n => String(n).padStart(2, '0');
  const isoLocal = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  document.getElementById('modal-horaire-idx').value = etapeIdx;
  document.getElementById('modal-horaire-titre').innerText = et.titre || 'Étape';
  document.getElementById('modal-horaire-dt').value = isoLocal;
  document.getElementById('modal-horaire-etape').classList.add('active');
}

export function confirmerHoraireEtape() {
  const idx = parseInt(document.getElementById('modal-horaire-idx').value, 10);
  const val = document.getElementById('modal-horaire-dt').value;
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p || !p.etapes || !p.etapes[idx] || !val) return;
  const nouveauMs = new Date(val).getTime();
  if (!Number.isFinite(nouveauMs)) return;
  const actuelMs = getEtapeDebutMillisPWA(p, p.etapes[idx]);
  const deltaMin = Math.round((nouveauMs - actuelMs) / 60000);
  document.getElementById('modal-horaire-etape').classList.remove('active');
  decalerEtapePWA(idx, deltaMin);
}

function getEtapeDebutMillisPWA(p, et) {
  if (Number.isFinite(Number(et.debutPrevuMillis)) && Number(et.debutPrevuMillis) > 0) {
    return Number(et.debutPrevuMillis);
  }
  const base = p.dateDebut ? new Date(p.dateDebut).getTime() : Date.now();
  return (Number.isFinite(base) ? base : Date.now()) + (Number(et.offsetDebutMinutes) || 0) * 60000;
}

export function decalerEtapePWA(etapeIdx, deltaMinutes) {
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p || !Array.isArray(p.etapes) || !p.etapes[etapeIdx]) return;
  const baseOrdre = p.etapes[etapeIdx].ordre;
  const baseProjetMs = p.dateDebut ? new Date(p.dateDebut).getTime() : Date.now();
  p.etapes.forEach((s, i) => {
    const concerne = (baseOrdre != null && s.ordre != null) ? (s.ordre >= baseOrdre) : (i >= etapeIdx);
    if (concerne) {
      s.debutPrevuMillis = getEtapeDebutMillisPWA(p, s) + deltaMinutes * 60000;
      if (Number.isFinite(Number(s.offsetDebutMinutes))) {
        s.offsetDebutMinutes = Math.round(Number(s.offsetDebutMinutes) + deltaMinutes);
      }
      if (Number.isFinite(baseProjetMs)) {
        const jourNum = Math.max(1, Math.floor((s.debutPrevuMillis - baseProjetMs) / 86400000) + 1);
        s.jourLibelle = `Jour ${jourNum}`;
      }
    }
  });
  sauvegarderDonnees();
  rendrePlanningProjet(p);
  rendreProjets();
}

export function demarrerEtapeMaintenantPWA(etapeIdx) {
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p || !Array.isArray(p.etapes) || !p.etapes[etapeIdx]) return;
  const et = p.etapes[etapeIdx];
  const debutActuel = getEtapeDebutMillisPWA(p, et);
  const diffMin = Math.round((Date.now() - debutActuel) / 60000);
  decalerEtapePWA(etapeIdx, diffMin);
}

export function basculerEtapeProjetActuel(etapeIdx) {
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p || !p.etapes || !p.etapes[etapeIdx]) return;
  const et = p.etapes[etapeIdx];
  et.terminee = !et.terminee;
  et.fait = et.terminee;
  sauvegarderDonnees();
  rendrePlanningProjet(p);
  rendreProjets();
}

export function basculerStatutProjetActuel() {
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p) return;
  if (p.statut !== 'TERMINE' && !confirm(`Marquer la session « ${p.nom} » comme terminée ?`)) return;
  p.statut = (p.statut === 'TERMINE') ? 'EN_COURS' : 'TERMINE';
  sauvegarderDonnees();
  ouvrirDetailProjet(p.id);
  rendreProjets();
}

export function supprimerProjetActuel() {
  if (!uiState.projetActuelId) return;
  if (!confirm("Voulez-vous supprimer définitivement cette session et ses étapes ?")) return;
  const idASupprimer = uiState.projetActuelId;
  appState.projets = appState.projets.filter(p => p.id !== idASupprimer);
  appState.courses = appState.courses.filter(c => c.projetId !== idASupprimer);
  appState.commandes = (appState.commandes || []).filter(c => c.projetId !== idASupprimer);
  appState.evaluations = (appState.evaluations || []).filter(e => e.projetId !== idASupprimer);
  supprimerPhotosProjetIDB(idASupprimer);
  sauvegarderDonnees();
  window.naviguerVers('projets');
}

export function rendreProductionProjet(p) {
  const sortiesContainer = document.getElementById('proj-sorties-container');
  const lotsContainer = document.getElementById('proj-lots-list');

  const sorties = (p.sortiesDecoupe || [])
    .map((s, idx) => ({ s, idx }))
    .filter(({ s }) => s.actif !== false);
  if (sorties.length > 0) {
    sortiesContainer.innerHTML = `
      <div class="card">
        <div style="font-weight:700; margin-bottom:6px;">Sorties de découpe obtenues</div>
        <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:10px;">Ajustez les quantités réelles obtenues (ex: litres de graisse, magrets) :</p>
        <div class="table-scroll">
        <table class="bilan-table">
          <thead><tr><th>Produit</th><th>Prévu</th><th>Réel</th><th>Unité</th><th></th></tr></thead>
          <tbody>
            ${sorties.map(({ s, idx }) => `
              <tr>
                <td style="font-weight:600;">
                  ${escapeHtml(s.nom)}
                  ${s.commentaireSortie ? `<div style="font-size:0.7rem; color:var(--text-muted); font-weight:400;">${escapeHtml(s.commentaireSortie)}</div>` : ''}
                </td>
                <td>${s.quantitePrevue || 0}</td>
                <td><input type="number" id="sortie-qte-${idx}" value="${s.quantiteReelle ?? s.quantitePrevue ?? 0}" step="0.5" style="width:64px; padding:4px 6px; border:1px solid var(--border); border-radius:4px;"></td>
                <td>${escapeHtml(s.unite)}</td>
                <td style="white-space:nowrap;">
                  <button class="btn btn-secondary btn-sm" onclick="enregistrerSortieReelle(${idx})">OK</button>
                  <button class="btn btn-secondary btn-sm" style="padding:4px 7px;" title="Éditer détails" onclick="ouvrirModalSortieDecoupe(${idx})">✎</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        </div>
      </div>
    `;
  } else {
    sortiesContainer.innerHTML = '';
  }

  const evalHtml = rendreCarteEvaluationProjet(p);
  const lots = p.lots || [];
  if (lots.length === 0) {
    lotsContainer.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; margin-bottom:12px;">Aucun lot d\'affinage défini sur cette session.</div>' + evalHtml;
    return;
  }

  const recId = p.recettePrincipaleId || p.recetteId;
  const recette = appState.recettes.find(r => r.id === recId || r.code === recId);
  const cible = (recette && recette.perteCiblePct > 0) ? recette.perteCiblePct : (p.perteCiblePct || p.perteCible || 35);

  lotsContainer.innerHTML = lots.map((lot, idx) => {
    const analyse = analyserCourbePesees(lot, cible, p.dateDebut);
    const pInit = analyse.poidsInitial;
    const pAct = analyse.dernierPoids;
    const pertePct = analyse.perteActuellePct;
    const note = lot.noteSur5 || 5;
    const nbPesees = (lot.historiquePesees || []).length;
    const estAffine = pInit > 0 && pertePct >= cible;
    const progressRatio = cible > 0 ? Math.min(100, Math.max(0, Math.round((pertePct / cible) * 100))) : 0;
    const resteEauG = (pInit > 0 && pAct > 0 && !estAffine) ? Math.max(0, Math.round(pAct - pInit * (1 - cible / 100))) : 0;

    return `
      <div class="card" style="margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <span class="badge badge-primary">${escapeHtml(lot.variante || 'Lot standard')}</span>
              ${estAffine ? '<span class="badge badge-green">✨ Affiné</span>' : ''}
            </div>
            <div style="font-weight:800; font-size:0.95rem; margin-top:3px;">${escapeHtml(lot.nomProduit || p.nomRecettePrincipale || 'Charcuterie')}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">
              Quantité : ${lot.quantiteReelle || lot.quantitePrevue || 1} ${escapeHtml(lot.unite || 'pièces')} · ${nbPesees} pesée(s)
              ${lot.epicesUtiliseesGrammes ? ` · ${lot.epicesUtiliseesGrammes}g épices` : ''}
              ${lot.dureeSalageHeures ? ` · ${lot.dureeSalageHeures}h salage` : ''}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:800; font-size:1.1rem; color:${estAffine ? 'var(--secondary)' : 'var(--primary)'};">-${pertePct}%</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Cible : -${cible}%</div>
          </div>
        </div>

        <div class="lot-progress-track">
          <div class="lot-progress-fill ${estAffine ? 'done' : ''}" style="width:${progressRatio}%;"></div>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.72rem; color:var(--text-muted); margin-bottom:6px;">
          <span>${pInit > 0 ? (estAffine ? 'Objectif de perte atteint !' : `Reste ~${resteEauG}g d'eau à perdre`) : 'Saisissez le poids initial pour suivre le séchage'}</span>
          <span>${progressRatio}%</span>
        </div>

        <div style="display:flex; gap:12px; margin-top:6px; font-size:0.8rem; background:var(--surface-subtle); padding:8px 10px; border-radius:var(--radius-sm);">
          <div>Départ : <strong>${pInit ? pInit + ' g' : '--'}</strong></div>
          <div>Actuel : <strong>${pAct ? pAct + ' g' : '--'}</strong></div>
          <div>Note : <strong>${'★'.repeat(note)}</strong></div>
        </div>

        ${analyse.risqueCroutage ? `<div style="font-size:0.75rem; color:#C62828; background:#FFEBEE; padding:6px 8px; border-radius:6px; margin-top:6px; font-weight:600;">${escapeHtml(analyse.alerteCroutageMsg)}</div>` : ''}
        ${analyse.dateEstimeeFin ? `<div style="font-size:0.75rem; color:#2E7D32; margin-top:6px;">📅 Fin d'affinage estimée : <strong>${new Date(analyse.dateEstimeeFin).toLocaleDateString('fr-FR')}</strong></div>` : ''}
        ${lot.commentaire ? `<div style="font-size:0.78rem; color:var(--text-muted); margin-top:6px; font-style:italic;">« ${escapeHtml(lot.commentaire)} »</div>` : ''}

        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:10px;">
          <button class="btn btn-primary btn-sm" style="flex:1;" onclick="ouvrirModalPeseeLotProjet(${idx})">
            ⚖️ ${pInit ? `Peser (${nbPesees})` : 'Poids départ'}
          </button>
          <button class="btn btn-secondary btn-sm" onclick="ouvrirModalModifierLot(${idx})">
            ✎ Modifier & Avis
          </button>
          <button class="btn btn-secondary btn-sm" style="width:100%;" onclick="ouvrirModalAmeliorerRecette(${idx})">
            ✨ Améliorer la recette de base (futurs projets)
          </button>
        </div>
      </div>
    `;
  }).join('') + evalHtml;
}

export function enregistrerSortieReelle(idx) {
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p || !p.sortiesDecoupe || !p.sortiesDecoupe[idx]) return;
  const input = document.getElementById('sortie-qte-' + idx);
  if (input) {
    p.sortiesDecoupe[idx].quantiteReelle = parseFloat(input.value) || 0;
    sauvegarderDonnees();
    alert('Quantité réelle enregistrée !');
    basculerSousOngletProjet('production');
  }
}

export function rendreBudgetProjet(p) {
  const container = document.getElementById('proj-budget-container');
  const bilan = CalculateurCharcuterie.calculerBilanProjet(p);
  const reventeActive = p.activerRevente !== false;

  container.innerHTML = `
    <div class="card" style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
      <label style="display:flex; align-items:center; gap:10px; font-weight:700; font-size:0.9rem; cursor:pointer;">
        <input type="checkbox" ${reventeActive ? 'checked' : ''} onchange="basculerReventeProjetActuel(this.checked)" style="width:18px; height:18px; accent-color:var(--primary);">
        <span>Option Revente sur cette session</span>
      </label>
      <button type="button" class="btn btn-secondary btn-sm" onclick="ouvrirModalBudgetPrix()">✎ Modifier prix</button>
    </div>

    <div class="bilan-grid">
      <div class="bilan-stat-card">
        <div class="bilan-stat-label">Coût Matière Première</div>
        <div class="bilan-stat-val">${bilan.coutMatierePremiereTotal.toFixed(2)} €</div>
      </div>
      <div class="bilan-stat-card">
        <div class="bilan-stat-label">Ingrédients & Frais</div>
        <div class="bilan-stat-val">${bilan.coutIngredientsEtFraisTotal.toFixed(2)} €</div>
      </div>
      <div class="bilan-stat-card">
        <div class="bilan-stat-label">Coût de Revient Total</div>
        <div class="bilan-stat-val">${bilan.coutRevientGlobal.toFixed(2)} €</div>
      </div>
      <div class="bilan-stat-card">
        <div class="bilan-stat-label">Valeur Équivalente Boutique</div>
        <div class="bilan-stat-val secondary">${bilan.valeurRefBoutiqueGlobale.toFixed(2)} €</div>
      </div>
    </div>

    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:700;">Économie Réalisée vs Boutique</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">En fabriquant vous-même à l'atelier</div>
        </div>
        <div style="font-size:1.25rem; font-weight:800; color:var(--secondary);">
          +${bilan.economieRealiseeVsBoutique.toFixed(2)} €
        </div>
      </div>
    </div>

    ${bilan.resumeGraisse ? `
      <div class="card" style="background:var(--surface-subtle); border-color:var(--border);">
        <div style="font-size:0.85rem; font-weight:600; color:var(--text);">🦆 Bilan Graisse & Confit</div>
        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px; line-height:1.45;">${escapeHtml(bilan.resumeGraisse)}</div>
      </div>
    ` : ''}

    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <div style="font-weight:700;">Détail par produit valorisé</div>
        <span style="font-size:0.72rem; color:var(--text-muted);">Tap sur un prix pour ajuster</span>
      </div>
      <div class="table-scroll">
      <table class="bilan-table">
        <thead>
          <tr>
            <th>Produit</th>
            <th>Qte</th>
            <th>Coût unit.</th>
            <th>Prix conseillé</th>
          </tr>
        </thead>
        <tbody>
          ${bilan.lignesProduits.map(l => `
            <tr>
              <td style="font-weight:600;">${escapeHtml(l.nom)}</td>
              <td>${l.quantiteReelle} ${escapeHtml(l.unite)}</td>
              <td>${l.coutRevientUnitaire.toFixed(2)} €</td>
              <td style="color:var(--primary); font-weight:700; cursor:pointer;" onclick="ouvrirModalBudgetPrix()">${l.prixReventeConseilleUnitaire.toFixed(2)} € ✎</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      </div>
    </div>

    ${rendreCarteEvaluationProjet(p)}

    ${reventeActive ? `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div>
            <div style="font-weight:700;">Commandes Amis sur cette session</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Total : ${bilan.totalCommandesAmis.toFixed(2)} € (Encaissé : ${bilan.totalPayeParAmis.toFixed(2)} €)</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="ouvrirModalCommandePourProjetActuel()">+ Commande</button>
        </div>
        <div id="proj-commandes-list">
          ${(appState.commandes || []).filter(c => c.projetId === p.id || c.projetNom === p.nom).map(cmd => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border-light); font-size:0.85rem;">
              <div>
                <strong>${escapeHtml(cmd.nomAcheteur || cmd.client || 'Ami')}</strong> : ${cmd.quantite || 1} ${escapeHtml(cmd.produit || 'Magret')}
                ${cmd.moyenPaiement ? `<span style="font-size:0.75rem; color:var(--text-muted);">(${escapeHtml(cmd.moyenPaiement)})</span>` : ''}
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="badge ${cmd.paye ? 'badge-green' : 'badge-muted'}">${cmd.paye ? 'Payé' : 'En attente'}</span>
                <strong>${(cmd.montantTotal || cmd.prix || 0).toFixed(2)} €</strong>
              </div>
            </div>
          `).join('') || '<div style="font-size:0.8rem; color:var(--text-muted);">Aucune réservation pour le moment.</div>'}
        </div>
      </div>
    ` : ''}
  `;
}

export function ouvrirModalCommandePourProjetActuel() {
  window.ouvrirModalNouvelleCommande(uiState.projetActuelId);
}

export function basculerReventeProjetActuel(actif) {
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p) return;
  p.activerRevente = !!actif;
  sauvegarderDonnees();
  rendreBudgetProjet(p);
}

export function ouvrirModalModifierLot(idx) {
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p || !p.lots || !p.lots[idx]) return;
  const lot = p.lots[idx];
  document.getElementById('modal-lot-edit-idx').value = idx;
  document.getElementById('modal-lot-edit-titre').innerText = lot.variante || 'Lot';
  document.getElementById('modal-lot-edit-qte').value = lot.quantiteReelle ?? lot.quantitePrevue ?? 1;
  document.getElementById('modal-lot-edit-epices').value = lot.epicesUtiliseesGrammes ?? '';
  document.getElementById('modal-lot-edit-salage').value = lot.dureeSalageHeures ?? '';
  document.getElementById('modal-lot-edit-poids-init').value = lot.poidsInitialGrammes ?? '';
  document.getElementById('modal-lot-edit-poids-act').value = lot.poidsActuelGrammes ?? '';
  document.getElementById('modal-lot-edit-note').value = lot.noteSur5 || 5;
  document.getElementById('modal-lot-edit-comm').value = lot.commentaire || '';
  document.getElementById('modal-lot-edit').classList.add('active');
}

export function sauvegarderLotModifie() {
  const idx = parseInt(document.getElementById('modal-lot-edit-idx').value, 10);
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p || !p.lots || !p.lots[idx]) return;
  const lot = p.lots[idx];
  const qte = parseFloat(document.getElementById('modal-lot-edit-qte').value);
  const ep = parseFloat(document.getElementById('modal-lot-edit-epices').value);
  const sal = parseFloat(document.getElementById('modal-lot-edit-salage').value);
  const pInit = parseFloat(document.getElementById('modal-lot-edit-poids-init').value);
  const pAct = parseFloat(document.getElementById('modal-lot-edit-poids-act').value);
  if (Number.isFinite(qte) && qte >= 0) lot.quantiteReelle = qte;
  if (Number.isFinite(ep) && ep >= 0) lot.epicesUtiliseesGrammes = ep;
  if (Number.isFinite(sal) && sal >= 0) lot.dureeSalageHeures = sal;
  if (Number.isFinite(pInit) && pInit > 0) lot.poidsInitialGrammes = pInit;
  if (Number.isFinite(pAct) && pAct > 0) lot.poidsActuelGrammes = pAct;
  lot.noteSur5 = parseInt(document.getElementById('modal-lot-edit-note').value, 10) || 5;
  lot.commentaire = document.getElementById('modal-lot-edit-comm').value.trim();
  sauvegarderDonnees();
  document.getElementById('modal-lot-edit').classList.remove('active');
  rendreProductionProjet(p);
}

export function ouvrirModalAmeliorerRecette(idx) {
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p || !p.lots || !p.lots[idx]) return;
  const lot = p.lots[idx];
  const recId = p.recettePrincipaleId || p.recetteId;
  const recette = appState.recettes.find(r => r.id === recId || r.code === recId);
  if (!recette) {
    alert('Recette de base introuvable.');
    return;
  }
  const qte = lot.quantiteReelle || lot.quantitePrevue || 1;
  const epicesParUnite = (lot.epicesUtiliseesGrammes && qte > 0) ? Math.round((lot.epicesUtiliseesGrammes / qte) * 10) / 10 : '';
  document.getElementById('modal-ameliorer-lot-idx').value = idx;
  document.getElementById('modal-ameliorer-recette-nom').innerText = `${recette.nom} (v${recette.versionActuelle || 1} → v${(recette.versionActuelle || 1) + 1})`;
  document.getElementById('modal-ameliorer-salage').value = lot.dureeSalageHeures ?? '';
  document.getElementById('modal-ameliorer-epices').value = epicesParUnite;
  document.getElementById('modal-ameliorer-perte').value = recette.perteCiblePct || p.perteCiblePct || 35;
  document.getElementById('modal-ameliorer-note').value = lot.commentaire || '';
  document.getElementById('modal-ameliorer-recette').classList.add('active');
}

export function confirmerAmeliorerRecette() {
  const idx = parseInt(document.getElementById('modal-ameliorer-lot-idx').value, 10);
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p || !p.lots || !p.lots[idx]) return;
  const lot = p.lots[idx];
  const recId = p.recettePrincipaleId || p.recetteId;
  const recette = appState.recettes.find(r => r.id === recId || r.code === recId);
  if (!recette) return;

  const salageH = parseFloat(document.getElementById('modal-ameliorer-salage').value);
  const epicesG = parseFloat(document.getElementById('modal-ameliorer-epices').value);
  const pertePct = parseFloat(document.getElementById('modal-ameliorer-perte').value);
  const note = document.getElementById('modal-ameliorer-note').value.trim();

  if (Number.isFinite(pertePct) && pertePct > 0 && pertePct <= 80) {
    recette.perteCiblePct = pertePct;
  }
  if (Number.isFinite(salageH) && salageH > 0 && Array.isArray(recette.etapes)) {
    const stepSalage = recette.etapes.find(e => (e.titre || '').toLowerCase().includes('salage'));
    if (stepSalage) {
      stepSalage.dureeMinutes = Math.round(salageH * 60);
    }
  }
  if (Number.isFinite(epicesG) && epicesG >= 0 && Array.isArray(recette.variantes)) {
    const v = recette.variantes.find(va => va.nom === lot.variante);
    if (v) v.epicesGrammesParUnite = epicesG;
  }

  recette.versionActuelle = (recette.versionActuelle || 1) + 1;
  if (!Array.isArray(recette.historiqueVersions)) recette.historiqueVersions = [];
  recette.historiqueVersions.unshift({
    version: recette.versionActuelle,
    date: new Date().toISOString().slice(0, 10),
    resume: note || `Ajustement depuis la session "${p.nom}" (${lot.variante || 'Standard'})`
  });

  sauvegarderDonnees();
  if (estConnecteFirebase()) {
    saveUserRecipeFirestore(recette).then(saved => {
      if (saved) Object.assign(recette, saved);
    }).catch(err => console.warn('Sync amélioration recette:', err));
  }
  document.getElementById('modal-ameliorer-recette').classList.remove('active');
  alert(`Recette "${recette.nom}" mise à jour en v${recette.versionActuelle} !`);
}

export function ouvrirModalSortieDecoupe(idx) {
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p || !p.sortiesDecoupe || !p.sortiesDecoupe[idx]) return;
  const s = p.sortiesDecoupe[idx];
  document.getElementById('modal-sortie-idx').value = idx;
  document.getElementById('modal-sortie-nom').innerText = s.nom || 'Produit';
  document.getElementById('modal-sortie-qte').value = s.quantiteReelle ?? s.quantitePrevue ?? 0;
  document.getElementById('modal-sortie-val-ref').value = s.valeurRefBoutiqueUnitaire ?? 0;
  document.getElementById('modal-sortie-prix-rev').value = s.prixReventeUnitaire ?? '';
  document.getElementById('modal-sortie-comm').value = s.commentaireSortie || '';
  document.getElementById('modal-sortie-decoupe').classList.add('active');
}

export function sauvegarderSortieDecoupe() {
  const idx = parseInt(document.getElementById('modal-sortie-idx').value, 10);
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p || !p.sortiesDecoupe || !p.sortiesDecoupe[idx]) return;
  const s = p.sortiesDecoupe[idx];
  const qte = parseFloat(document.getElementById('modal-sortie-qte').value);
  const valRef = parseFloat(document.getElementById('modal-sortie-val-ref').value);
  const prixRev = parseFloat(document.getElementById('modal-sortie-prix-rev').value);
  if (Number.isFinite(qte) && qte >= 0) s.quantiteReelle = qte;
  if (Number.isFinite(valRef) && valRef >= 0) s.valeurRefBoutiqueUnitaire = valRef;
  s.prixReventeUnitaire = (Number.isFinite(prixRev) && prixRev >= 0) ? prixRev : null;
  s.commentaireSortie = document.getElementById('modal-sortie-comm').value.trim();
  sauvegarderDonnees();
  document.getElementById('modal-sortie-decoupe').classList.remove('active');
  rendreProductionProjet(p);
}

export function ouvrirModalBudgetPrix() {
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p) return;
  document.getElementById('modal-budget-qte').value = p.quantiteBaseReelle > 0 ? p.quantiteBaseReelle : (p.quantiteBasePrevue || 1);
  document.getElementById('modal-budget-prix-mat').value = p.prixUnitaireMatiereBase ?? 0;
  document.getElementById('modal-budget-prix-fixe').value = p.prixReventeUnitaireFixe ?? '';

  const sortiesContainer = document.getElementById('modal-budget-sorties-prix');
  const sorties = (p.sortiesDecoupe || []).map((s, idx) => ({ s, idx })).filter(({ s }) => s.actif !== false);
  sortiesContainer.innerHTML = sorties.length > 0 ? `
    <div style="font-weight:700; font-size:0.85rem; margin:10px 0 6px;">Prix de revente par produit (€)</div>
    ${sorties.map(({ s, idx }) => `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">
        <span style="font-size:0.84rem; flex:1;">${escapeHtml(s.nom)} (${escapeHtml(s.unite)})</span>
        <input type="number" step="0.01" id="budget-sortie-prix-${idx}" class="form-control" style="width:95px;" value="${s.prixReventeUnitaire ?? ''}" placeholder="Auto">
      </div>
    `).join('')}
  ` : '';

  document.getElementById('modal-budget-prix').classList.add('active');
}

export function sauvegarderBudgetPrix() {
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p) return;
  const qte = parseFloat(document.getElementById('modal-budget-qte').value);
  const prixMat = parseFloat(document.getElementById('modal-budget-prix-mat').value);
  const prixFixe = parseFloat(document.getElementById('modal-budget-prix-fixe').value);
  if (Number.isFinite(qte) && qte > 0) p.quantiteBaseReelle = qte;
  if (Number.isFinite(prixMat) && prixMat >= 0) p.prixUnitaireMatiereBase = prixMat;
  p.prixReventeUnitaireFixe = (Number.isFinite(prixFixe) && prixFixe > 0) ? prixFixe : null;

  (p.sortiesDecoupe || []).forEach((s, idx) => {
    const inp = document.getElementById(`budget-sortie-prix-${idx}`);
    if (inp) {
      const val = parseFloat(inp.value);
      s.prixReventeUnitaire = (Number.isFinite(val) && val > 0) ? val : null;
    }
  });

  sauvegarderDonnees();
  document.getElementById('modal-budget-prix').classList.remove('active');
  rendreBudgetProjet(p);
}
