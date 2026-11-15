// Gestion des projets / sessions (liste, planning, production & lots, budget & évaluation)
import { appState, uiState, sauvegarderDonnees, escapeHtml, escapeJsStr } from './state.js';
import { CalculateurCharcuterie, analyserCourbePesees } from './calculateur.js';
import { supprimerPhotosProjetIDB, chargerMiniaturesEtapesPWA } from './photos.js';
import { rendreCarteEvaluationProjet } from './evaluation.js';

export function rendreProjets() {
  const container = document.getElementById('projets-list');
  const summary = document.getElementById('projets-summary');
  if (!container || !summary) return;

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

  container.innerHTML = appState.projets.map(p => {
    const etapes = p.etapes || [];
    const terminees = etapes.filter(e => e.terminee || e.fait).length;
    const pct = etapes.length > 0 ? Math.round((terminees / etapes.length) * 100) : 0;
    const estTermine = p.statut === 'TERMINE';
    const dateFormatted = p.dateDebut ? new Date(p.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

    return `
      <div class="card" style="cursor:pointer;" onclick="ouvrirDetailProjet('${escapeJsStr(p.id)}')">
        <div class="card-header">
          <div>
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
              <span class="badge badge-mini">${escapeHtml(p.nomRecettePrincipale || 'Artisanal')}</span>
              <span class="badge ${estTermine ? 'badge-muted' : 'badge-green'}">${estTermine ? 'Terminé' : 'En cours'}</span>
            </div>
            <div style="font-weight: 800; font-size: 1.05rem;">${escapeHtml(p.nom)}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top:2px;">
              Démarré le ${dateFormatted} · ${p.quantiteBasePrevue || p.quantite || 1} ${escapeHtml(p.unite || 'pièces')}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:800; color:var(--primary); font-size:1.1rem;">${pct}%</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${terminees}/${etapes.length} étapes</div>
          </div>
        </div>

        <div style="width: 100%; height: 6px; background: var(--surface-subtle); border-radius: 3px; overflow: hidden; margin-top: 8px;">
          <div style="width: ${pct}%; height: 100%; background: ${estTermine ? 'var(--secondary)' : 'var(--primary)'}; border-radius: 3px; transition: width 0.3s ease;"></div>
        </div>
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

export function rendrePlanningProjet(p) {
  const container = document.getElementById('proj-etapes-list');
  const etapes = p.etapes || [];

  if (etapes.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted); padding:16px;">Aucune étape planifiée.</div>';
    return;
  }

  container.innerHTML = etapes.map((et, idx) => {
    const isDone = et.terminee || et.fait;
    const dateEtape = et.debutPrevuMillis ? new Date(et.debutPrevuMillis) : (p.dateDebut ? new Date(new Date(p.dateDebut).getTime() + (et.offsetDebutMinutes || 0) * 60000) : null);
    const dateStr = dateEtape ? dateEtape.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
    const dureeH = et.dureeMinutes ? (et.dureeMinutes >= 60 ? (et.dureeMinutes / 60).toFixed(0) + 'h' : et.dureeMinutes + 'min') : '';

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
            </div>
            ${!isDone ? `
              <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
                <button type="button" class="btn btn-secondary btn-sm" style="padding:4px 8px; font-size:0.75rem;" onclick="decalerEtapePWA(${idx}, -60)">-1h</button>
                <button type="button" class="btn btn-secondary btn-sm" style="padding:4px 8px; font-size:0.75rem;" onclick="decalerEtapePWA(${idx}, -15)">-15m</button>
                <button type="button" class="btn btn-secondary btn-sm" style="padding:4px 8px; font-size:0.75rem;" onclick="decalerEtapePWA(${idx}, 15)">+15m</button>
                <button type="button" class="btn btn-secondary btn-sm" style="padding:4px 8px; font-size:0.75rem;" onclick="decalerEtapePWA(${idx}, 60)">+1h</button>
                <button type="button" class="btn btn-secondary btn-sm" style="padding:4px 8px; font-size:0.75rem;" onclick="decalerEtapePWA(${idx}, 1440)">+1j</button>
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
  p.etapes.forEach((s, i) => {
    const concerne = (baseOrdre != null && s.ordre != null) ? (s.ordre >= baseOrdre) : (i >= etapeIdx);
    if (concerne) {
      s.debutPrevuMillis = getEtapeDebutMillisPWA(p, s) + deltaMinutes * 60000;
      if (Number.isFinite(Number(s.offsetDebutMinutes))) {
        s.offsetDebutMinutes = Math.round(Number(s.offsetDebutMinutes) + deltaMinutes);
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
  supprimerPhotosProjetIDB(idASupprimer);
  sauvegarderDonnees();
  window.naviguerVers('projets');
}

export function rendreProductionProjet(p) {
  const sortiesContainer = document.getElementById('proj-sorties-container');
  const lotsContainer = document.getElementById('proj-lots-list');

  const sorties = p.sortiesDecoupe || [];
  if (sorties.length > 0) {
    sortiesContainer.innerHTML = `
      <div class="card">
        <div style="font-weight:700; margin-bottom:6px;">Sorties de découpe obtenues</div>
        <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:10px;">Ajustez les quantités réelles obtenues (ex: litres de graisse, magrets) :</p>
        <table class="bilan-table">
          <thead><tr><th>Produit</th><th>Prévu</th><th>Réel</th><th>Unité</th><th></th></tr></thead>
          <tbody>
            ${sorties.map((s, idx) => `
              <tr>
                <td style="font-weight:600;">${escapeHtml(s.nom)}</td>
                <td>${s.quantitePrevue || 0}</td>
                <td><input type="number" id="sortie-qte-${idx}" value="${s.quantiteReelle || s.quantitePrevue || 0}" step="0.5" style="width:70px; padding:4px 6px; border:1px solid var(--border); border-radius:4px;"></td>
                <td>${escapeHtml(s.unite)}</td>
                <td><button class="btn btn-secondary btn-sm" onclick="enregistrerSortieReelle(${idx})">OK</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
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

  const recette = appState.recettes.find(r => r.id === p.recetteId || r.code === p.recetteId);
  const cible = (recette && recette.perteCiblePct > 0) ? recette.perteCiblePct : (p.perteCiblePct || p.perteCible || 35);

  lotsContainer.innerHTML = lots.map((lot, idx) => {
    const analyse = analyserCourbePesees(lot, cible, p.dateDebut);
    const pInit = analyse.poidsInitial;
    const pAct = analyse.dernierPoids;
    const pertePct = analyse.perteActuellePct;
    const note = lot.noteSur5 || 5;
    const nbPesees = (lot.historiquePesees || []).length;

    return `
      <div class="card" style="margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <span class="badge badge-primary">${escapeHtml(lot.variante || 'Lot standard')}</span>
            <div style="font-weight:800; font-size:0.95rem; margin-top:3px;">${escapeHtml(lot.nomProduit || p.nomRecettePrincipale || 'Charcuterie')}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Quantité : ${lot.quantiteReelle || lot.quantitePrevue || 1} ${escapeHtml(lot.unite || 'pièces')} · ${nbPesees} pesée(s)</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:800; font-size:1.1rem; color:${pertePct >= cible ? 'var(--secondary)' : 'var(--primary)'};">-${pertePct}%</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Cible : -${cible}%</div>
          </div>
        </div>

        <div style="display:flex; gap:12px; margin-top:8px; font-size:0.8rem; background:var(--surface-subtle); padding:8px 10px; border-radius:var(--radius-sm);">
          <div>Départ : <strong>${pInit ? pInit + ' g' : '--'}</strong></div>
          <div>Actuel : <strong>${pAct ? pAct + ' g' : '--'}</strong></div>
          <div>Note : <strong>${'★'.repeat(note)}</strong></div>
        </div>

        ${analyse.risqueCroutage ? `<div style="font-size:0.75rem; color:#C62828; background:#FFEBEE; padding:6px 8px; border-radius:6px; margin-top:6px; font-weight:600;">${escapeHtml(analyse.alerteCroutageMsg)}</div>` : ''}
        ${analyse.dateEstimeeFin ? `<div style="font-size:0.75rem; color:#2E7D32; margin-top:6px;">📅 Fin d'affinage estimée : <strong>${new Date(analyse.dateEstimeeFin).toLocaleDateString('fr-FR')}</strong></div>` : ''}
        ${lot.commentaire ? `<div style="font-size:0.78rem; color:var(--text-muted); margin-top:6px; font-style:italic;">« ${escapeHtml(lot.commentaire)} »</div>` : ''}

        <button class="btn btn-secondary btn-sm" style="width:100%; margin-top:10px;" onclick="ouvrirModalPeseeLotProjet(${idx})">
          📈 Pesées & Courbe de séchage (${nbPesees})
        </button>
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

  container.innerHTML = `
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
      <div style="font-weight:700; margin-bottom:8px;">Détail par produit valorisé</div>
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
              <td style="color:var(--primary); font-weight:700;">${l.prixReventeConseilleUnitaire.toFixed(2)} €</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${rendreCarteEvaluationProjet(p)}

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
  `;
}

export function ouvrirModalCommandePourProjetActuel() {
  window.ouvrirModalNouvelleCommande(uiState.projetActuelId);
}
