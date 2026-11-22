// Gestion de l'historique des pesées, courbe SVG et diagnostic de croûtage
import { appState, uiState, sauvegarderDonnees, escapeHtml, escapeJsStr, svgIcon } from './state.js';
import { analyserCourbePesees } from './calculateur.js';

export function genererSvgCourbePesees(lot, perteCiblePct = 35, dateDebutProjet = null) {
  const analyse = analyserCourbePesees(lot, perteCiblePct, dateDebutProjet);
  const pInit = analyse.poidsInitial;
  if (!pInit || analyse.historique.length === 0) {
    return `<div style="text-align:center; padding:16px; color:var(--text-muted); font-size:0.8rem;">Enregistrez une première pesée pour tracer la courbe de déshydratation.</div>`;
  }

  const w = 320;
  const h = 145;
  const padL = 36;
  const padR = 14;
  const padT = 14;
  const padB = 24;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const toLocalDay = (d) => {
    if (!d) return new Date();
    const s = String(d);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, day] = s.split('-').map(Number);
      return new Date(y, m - 1, day);
    }
    const dt = new Date(s);
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  };

  const points = [{ label: 'J0', perte: 0, poids: pInit, date: dateDebutProjet || analyse.historique[0].date }];
  const t0 = toLocalDay(points[0].date).getTime();

  analyse.historique.forEach((pes) => {
    const j = Math.max(0, Math.round((toLocalDay(pes.date).getTime() - t0) / 86400000));
    const perte = Math.max(0, ((pInit - pes.poidsGrammes) / pInit) * 100);
    points.push({ label: `J${j}`, perte, poids: pes.poidsGrammes, date: pes.date });
  });

  const maxPerte = Math.max(perteCiblePct + 5, ...points.map(pt => pt.perte + 5), 40);
  const xStep = points.length > 1 ? plotW / (points.length - 1) : plotW;

  const toY = (pct) => padT + (pct / maxPerte) * plotH;
  const cibleY = toY(perteCiblePct);

  // Courbe idéale linéaire de 0% à perteCiblePct
  const idealLine = `<line x1="${padL}" y1="${toY(0)}" x2="${padL + plotW}" y2="${cibleY}" stroke="#2E7D32" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.7" />`;

  // Ligne cible horizontale
  const cibleLine = `<line x1="${padL}" y1="${cibleY}" x2="${padL + plotW}" y2="${cibleY}" stroke="#2E7D32" stroke-width="1" stroke-dasharray="2 2" opacity="0.5" />
    <text x="${padL + 4}" y="${cibleY - 4}" font-size="9" fill="#2E7D32" font-weight="600">Cible -${perteCiblePct}% (${analyse.poidsCibleG}g)</text>`;

  // Ligne réelle
  const polyPoints = points.map((pt, i) => `${padL + i * xStep},${toY(pt.perte).toFixed(1)}`).join(' ');
  const realLine = `<polyline fill="none" stroke="#C84B31" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${polyPoints}" />`;

  // Points et étiquettes
  const dots = points.map((pt, i) => {
    const cx = padL + i * xStep;
    const cy = toY(pt.perte);
    return `<circle cx="${cx}" cy="${cy}" r="3.5" fill="#C84B31" stroke="#fff" stroke-width="1.5" />
      <text x="${cx}" y="${h - 6}" font-size="9" text-anchor="middle" fill="var(--text-muted)">${pt.label}</text>`;
  }).join('');

  // Axe Y
  const yAxis = `
    <text x="${padL - 4}" y="${padT + 4}" font-size="9" text-anchor="end" fill="var(--text-muted)">0%</text>
    <text x="${padL - 4}" y="${cibleY + 3}" font-size="9" text-anchor="end" fill="#2E7D32">-${perteCiblePct}%</text>
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="var(--border-color)" stroke-width="1" />
    <line x1="${padL}" y1="${padT + plotH}" x2="${padL + plotW}" y2="${padT + plotH}" stroke="var(--border-color)" stroke-width="1" />
  `;

  return `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%; height:auto; display:block; background:var(--surface-subtle); border-radius:8px;">
      ${yAxis}
      ${cibleLine}
      ${idealLine}
      ${realLine}
      ${dots}
    </svg>
    <div style="display:flex; justify-content:space-between; font-size:0.72rem; color:var(--text-muted); margin-top:4px; padding:0 4px;">
      <span>${svgIcon('circle-danger', 11)} Réel : -${analyse.perteActuellePct}% (${analyse.dernierPoids}g)</span>
      <span>${svgIcon('circle-success', 11)} Idéal / Cible (-${perteCiblePct}%)</span>
    </div>
  `;
}

export function ouvrirModalPeseeLotProjet(idx) {
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p || !p.lots || !p.lots[idx]) return;
  const lot = p.lots[idx];
  const recId = p.recettePrincipaleId || p.recetteId;
  const recette = appState.recettes.find(r => r.id === recId || r.code === recId);
  const perteCible = recette && recette.perteCiblePct > 0 ? recette.perteCiblePct : 35;

  document.getElementById('modal-pesee-proj-id').value = p.id;
  document.getElementById('modal-pesee-lot-idx').value = idx;
  document.getElementById('modal-pesee-lot-nom').innerText = `${lot.nomProduit} (${lot.variante})`;
  document.getElementById('modal-pesee-cible').innerText = `-${perteCible}%`;
  document.getElementById('modal-pesee-initial').value = lot.poidsInitialGrammes || '';
  document.getElementById('modal-pesee-actuel').value = '';
  document.getElementById('modal-pesee-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('modal-pesee-comm').value = '';
  document.getElementById('modal-pesee-note').value = lot.noteSur5 || 5;

  calculerPeseeModal();
  rendreHistoriqueEtCourbeModal(lot, perteCible, p.dateDebut);
  document.getElementById('modal-pesee').classList.add('active');
}

export function rendreHistoriqueEtCourbeModal(lot, perteCible = 35, dateDebutProjet = null) {
  const chartContainer = document.getElementById('modal-pesee-chart');
  if (chartContainer) {
    chartContainer.innerHTML = genererSvgCourbePesees(lot, perteCible, dateDebutProjet);
  }

  const analyse = analyserCourbePesees(lot, perteCible, dateDebutProjet);
  const alerteBox = document.getElementById('modal-pesee-alerte');
  if (alerteBox) {
    let html = '';
    if (analyse.risqueCroutage) {
      html += `<div style="background:#FFEBEE; color:#C62828; padding:8px 10px; border-radius:6px; font-size:0.78rem; margin-bottom:8px; font-weight:600;">${svgIcon('alert-triangle', 14)} ${escapeHtml(analyse.alerteCroutageMsg)}</div>`;
    }
    if (analyse.dateEstimeeFin) {
      html += `<div style="background:#E8F5E9; color:#2E7D32; padding:8px 10px; border-radius:6px; font-size:0.78rem; margin-bottom:8px;">${svgIcon('calendar', 14)} Fin d'affinage estimée (-${perteCible}%) : <strong>${new Date(analyse.dateEstimeeFin).toLocaleDateString('fr-FR')}</strong> (rythme ~${analyse.vitessePctParJour}%/jour)</div>`;
    }
    alerteBox.innerHTML = html;
  }

  const histContainer = document.getElementById('modal-pesee-historique');
  if (histContainer) {
    const hist = [...(lot.historiquePesees || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (hist.length === 0) {
      histContainer.innerHTML = '<div style="font-size:0.78rem; color:var(--text-muted); padding:6px 0;">Aucune pesée enregistrée dans l\'historique.</div>';
    } else {
      histContainer.innerHTML = hist.map((pes, i) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px; border-bottom:1px solid var(--border-color); font-size:0.8rem;">
          <div>
            <strong>${new Date(pes.date).toLocaleDateString('fr-FR')}</strong> — ${pes.poidsGrammes}g
            <span style="color:var(--primary); font-weight:700;">(-${pes.pertePct}%)</span>
            ${pes.note ? `<div style="font-size:0.74rem; color:var(--text-muted);">${escapeHtml(pes.note)}</div>` : ''}
          </div>
          <button type="button" class="btn-icon" style="color:var(--danger); font-size:0.85rem;" onclick="supprimerPeseeHistorique('${escapeJsStr(pes.id)}')" title="Supprimer cette pesée">✕</button>
        </div>
      `).join('');
    }
  }
}

export function calculerPeseeModal() {
  const pInit = parseFloat(document.getElementById('modal-pesee-initial').value) || 0;
  const pAct = parseFloat(document.getElementById('modal-pesee-actuel').value) || 0;
  const res = document.getElementById('modal-pesee-resultat');
  if (pInit > 0 && pAct > 0) {
    const perte = (((pInit - pAct) / pInit) * 100).toFixed(1);
    const cibleText = document.getElementById('modal-pesee-cible')?.innerText || '-35%';
    const cible = Math.abs(parseFloat(cibleText)) || 35;
    const resteG = Math.max(0, Math.round(pAct - (pInit * (1 - cible / 100))));
    res.style.display = 'block';
    document.getElementById('modal-pesee-perte').innerText = `-${perte}% de perte de poids`;
    document.getElementById('modal-pesee-details').innerHTML = (resteG > 0)
      ? `Reste ~${resteG}g d'eau à perdre pour atteindre -${cible}%`
      : `${svgIcon('target', 14)} Perte cible atteinte ou dépassée !`;
  } else {
    res.style.display = 'none';
  }
}

export function confirmerEnregistrementPesee() {
  const projId = document.getElementById('modal-pesee-proj-id').value;
  const lotIdx = parseInt(document.getElementById('modal-pesee-lot-idx').value, 10);
  const p = appState.projets.find(x => x.id === projId);
  if (!p || !p.lots || !p.lots[lotIdx]) return;

  const lot = p.lots[lotIdx];
  const pInit = parseFloat(document.getElementById('modal-pesee-initial').value) || 0;
  const pAct = parseFloat(document.getElementById('modal-pesee-actuel').value) || 0;
  const dateStr = document.getElementById('modal-pesee-date').value || new Date().toISOString().slice(0, 10);
  const comm = document.getElementById('modal-pesee-comm').value.trim();
  const note = parseInt(document.getElementById('modal-pesee-note').value, 10) || 5;

  if (pInit <= 0 || pAct <= 0) {
    alert('Veuillez saisir un poids initial et un poids pesé valides.');
    return;
  }

  lot.poidsInitialGrammes = pInit;
  lot.poidsActuelGrammes = pAct;
  if (comm) lot.commentaire = comm;
  lot.noteSur5 = note;

  if (!Array.isArray(lot.historiquePesees)) lot.historiquePesees = [];
  const pertePct = Number((((pInit - pAct) / pInit) * 100).toFixed(1));
  lot.historiquePesees.push({
    id: 'pes_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    date: dateStr,
    poidsGrammes: pAct,
    pertePct,
    note: comm
  });

  sauvegarderDonnees();
  if (typeof window.fermerModals === 'function') window.fermerModals();
  if (document.getElementById('view-projet-detail').classList.contains('active')) {
    if (typeof window.basculerSousOngletProjet === 'function') window.basculerSousOngletProjet('production');
  } else if (typeof window.rendreProjets === 'function') {
    window.rendreProjets();
  }
}

export function supprimerPeseeHistorique(peseeId) {
  const projId = document.getElementById('modal-pesee-proj-id').value;
  const lotIdx = parseInt(document.getElementById('modal-pesee-lot-idx').value, 10);
  const p = appState.projets.find(x => x.id === projId);
  if (!p || !p.lots || !p.lots[lotIdx]) return;

  const lot = p.lots[lotIdx];
  lot.historiquePesees = (lot.historiquePesees || []).filter(x => x.id !== peseeId);
  if (lot.historiquePesees.length > 0) {
    const sorted = [...lot.historiquePesees].sort((a, b) => new Date(a.date) - new Date(b.date));
    const last = sorted[sorted.length - 1];
    lot.poidsActuelGrammes = last.poidsGrammes;
    const msg = last.note || last.commentaire || '';
    lot.commentaire = msg;
    lot.observations = msg;
  } else {
    lot.poidsActuelGrammes = 0;
    lot.commentaire = '';
    lot.observations = '';
  }
  sauvegarderDonnees();

  const recId = p.recettePrincipaleId || p.recetteId;
  const recette = appState.recettes.find(r => r.id === recId || r.code === recId);
  const perteCible = recette && recette.perteCiblePct > 0 ? recette.perteCiblePct : 35;
  rendreHistoriqueEtCourbeModal(lot, perteCible, p.dateDebut);
  if (typeof window.rendreProductionProjet === 'function') window.rendreProductionProjet(p);
}

export function ouvrirModalAjouterLotProjet() {
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p) return;

  const uniteDefaut = (p.lots && p.lots[0] && p.lots[0].unite) ? p.lots[0].unite : 'pièce';
  const inputVariante = document.getElementById('lot-projet-variante');
  const inputQte = document.getElementById('lot-projet-quantite');
  const inputUnite = document.getElementById('lot-projet-unite');
  const inputEpices = document.getElementById('lot-projet-epices');
  if (inputVariante) inputVariante.value = '';
  if (inputQte) inputQte.value = '2';
  if (inputUnite) inputUnite.value = uniteDefaut;
  if (inputEpices) inputEpices.value = '15';

  document.getElementById('modal-ajout-lot-projet')?.classList.add('active');
}

export function confirmerAjoutLotProjet() {
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p) return;

  const nom = (document.getElementById('lot-projet-variante')?.value || '').trim();
  if (!nom) {
    alert('Veuillez saisir un nom de lot.');
    return;
  }
  const qte = Math.max(0.1, parseFloat(document.getElementById('lot-projet-quantite')?.value) || 2);
  const unite = (document.getElementById('lot-projet-unite')?.value || '').trim() || 'pièce';
  const epices = Math.max(0, parseFloat(document.getElementById('lot-projet-epices')?.value) || 0);

  if (!p.lots) p.lots = [];
  p.lots.push({
    nomProduit: p.nomRecettePrincipale || 'Charcuterie',
    variante: nom,
    quantitePrevue: qte,
    quantiteReelle: qte,
    unite: unite,
    epicesUtiliseesGrammes: qte * epices,
    poidsInitialGrammes: 0,
    poidsActuelGrammes: 0,
    historiquePesees: [],
    commentaire: '',
    noteSur5: 0
  });
  sauvegarderDonnees();
  if (typeof window.fermerModals === 'function') window.fermerModals();
  if (typeof window.rendreProductionProjet === 'function') window.rendreProductionProjet(p);
}
