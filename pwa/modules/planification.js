import { appState, uiState, sauvegarderDonnees, getValeurParametre, escapeHtml, escapeJsStr } from './state.js';
import { CalculateurCharcuterie } from './calculateur.js';
import { rendreRappelEvaluationPlanification } from './evaluation.js';

export let lotsDraftPlanification = [];

export function modifierLotDraftPlanification(idx, champ, valeur) {
  const lot = lotsDraftPlanification[idx];
  if (!lot) return;
  if (champ === 'variante') {
    lot.variante = String(valeur ?? '');
  } else if (champ === 'quantite') {
    lot.quantite = parseFloat(valeur) || 0;
    actualiserEstimationPlanification();
  }
}

export function ouvrirModalPlanifier(recetteIdPreselectionnee = null) {
  const selectId = recetteIdPreselectionnee || uiState.dropdownRecetteSelectionneeId || (appState.recettes[0] ? appState.recettes[0].id : '');
  selectionnerRecetteDropdown(selectId);

  // Date actuelle
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('plan-date').value = now.toISOString().slice(0, 16);

  const prixActif = window.estOptionPrixActive();
  const tarifsRow = document.getElementById('plan-tarifs-row');
  if (tarifsRow) tarifsRow.style.display = prixActif ? 'flex' : 'none';
  const estBox = document.getElementById('plan-estimation-box');
  if (estBox) estBox.style.display = prixActif ? 'block' : 'none';

  document.getElementById('modal-planifier').classList.add('active');
}

export function selectionnerRecetteDropdown(recId) {
  const r = appState.recettes.find(x => x.id === recId || x.code === recId);
  if (!r) return;
  uiState.dropdownRecetteSelectionneeId = r.id || r.code;
  document.getElementById('plan-recette-select').value = uiState.dropdownRecetteSelectionneeId;
  document.getElementById('plan-selected-badge').innerText = r.famille || 'Artisanal';
  document.getElementById('plan-selected-nom').innerText = r.nom;
  document.getElementById('plan-unite').innerText = r.uniteBase || 'pièces';
  document.getElementById('plan-unite-prix').innerText = '€/' + (r.uniteBase || 'pièce');
  document.getElementById('plan-quantite').value = r.quantiteDefaut || 1;

  // Nom suggéré
  document.getElementById('plan-nom').value = `Session ${r.nom} ${new Date().toLocaleDateString('fr-FR', { month: 'short' })}`;
  rendreRappelEvaluationPlanification(r.id || r.code, r.nom);

  // Prix matière estimé
  let prixMatiere = 0;
  if (r.famille === 'Canard') prixMatiere = getValeurParametre('PRIX_CANARD', 18.0);
  else if (r.ingredients && r.ingredients[0]) prixMatiere = r.ingredients[0].prixKgOuUniteEstime || r.ingredients[0].prix || 10.0;
  document.getElementById('plan-prix-matiere').value = prixMatiere;

  // Sorties découpe checklist
  const sortiesSection = document.getElementById('plan-sorties-section');
  const checklist = document.getElementById('plan-sorties-checklist');
  if (r.sortiesDecoupe && r.sortiesDecoupe.length > 0) {
    sortiesSection.style.display = 'block';
    checklist.innerHTML = r.sortiesDecoupe.map((s, idx) => `
      <label class="sortie-checkbox-row">
        <div>
          <span style="font-weight:600; font-size:0.85rem;">${escapeHtml(s.nom)}</span>
          <div style="font-size:0.75rem; color:var(--text-muted);">${s.rendementParUniteBase} ${escapeHtml(s.unite)}/${escapeHtml(r.uniteBase || 'pièce')}${window.estOptionPrixActive() ? ` · Valeur boutique : ${s.valeurRefBoutiqueUnitaire} €` : ''}</div>
        </div>
        <input type="checkbox" id="plan-sortie-chk-${idx}" data-code="${escapeHtml(s.codeSortie)}" ${s.cocheParDefaut ? 'checked' : ''} onchange="actualiserEstimationPlanification()" style="width:20px; height:20px; accent-color:var(--primary); cursor:pointer;">
      </label>
    `).join('');
  } else {
    sortiesSection.style.display = 'none';
    checklist.innerHTML = '';
  }

  // Lots prédéfinis
  lotsDraftPlanification = [];
  if (r.variantes && r.variantes.length > 0) {
    const qBase = r.quantiteDefaut || 1;
    const qParLot = Math.max(1, Math.floor((qBase * (r.sortiesDecoupe && r.sortiesDecoupe[0] ? r.sortiesDecoupe[0].rendementParUniteBase : 1)) / r.variantes.length));
    r.variantes.forEach(v => {
      lotsDraftPlanification.push({
        variante: v.nom,
        quantite: qParLot,
        unite: (r.sortiesDecoupe && r.sortiesDecoupe[0]) ? r.sortiesDecoupe[0].unite : (r.uniteBase || 'pièce'),
        epicesGrammesParUnite: v.epicesGrammesParUnite || 15
      });
    });
  } else {
    lotsDraftPlanification.push({
      variante: 'Standard',
      quantite: r.quantiteDefaut || 1,
      unite: r.uniteBase || 'kg',
      epicesGrammesParUnite: 0
    });
  }

  rendreLignesLotsPlanification();
  actualiserEstimationPlanification();
  fermerPlanRecetteDropdown();
}

export function rendreLignesLotsPlanification() {
  const container = document.getElementById('plan-lots-container');
  container.innerHTML = lotsDraftPlanification.map((lot, idx) => `
    <div class="lot-input-row">
      <input type="text" value="${escapeHtml(lot.variante)}" class="form-control" style="flex:2; font-size:0.82rem;" onchange="modifierLotDraftPlanification(${idx}, 'variante', this.value)">
      <input type="number" value="${lot.quantite}" min="0.5" step="0.5" class="form-control" style="flex:1; font-size:0.82rem;" oninput="modifierLotDraftPlanification(${idx}, 'quantite', this.value)">
      <span style="font-size:0.75rem; color:var(--text-muted); width:40px;">${escapeHtml(lot.unite)}</span>
      <button type="button" class="btn btn-secondary btn-sm" onclick="supprimerLigneLotPlanification(${idx})" style="padding:4px 8px;">✕</button>
    </div>
  `).join('');
}

export function ajouterLigneLotPlanification() {
  const r = appState.recettes.find(x => x.id === uiState.dropdownRecetteSelectionneeId || x.code === uiState.dropdownRecetteSelectionneeId);
  const unite = (r && r.sortiesDecoupe && r.sortiesDecoupe[0]) ? r.sortiesDecoupe[0].unite : (r ? r.uniteBase : 'pièce');
  lotsDraftPlanification.push({
    variante: 'Nouvelle variante',
    quantite: 1,
    unite: unite,
    epicesGrammesParUnite: 15
  });
  rendreLignesLotsPlanification();
  actualiserEstimationPlanification();
}

export function supprimerLigneLotPlanification(idx) {
  lotsDraftPlanification.splice(idx, 1);
  rendreLignesLotsPlanification();
  actualiserEstimationPlanification();
}

export function actualiserEstimationPlanification() {
  const r = appState.recettes.find(x => x.id === uiState.dropdownRecetteSelectionneeId || x.code === uiState.dropdownRecetteSelectionneeId);
  if (!r) return;

  const qBase = parseFloat(document.getElementById('plan-quantite').value) || 1.0;
  const prixMatiere = parseFloat(document.getElementById('plan-prix-matiere').value) || 0;
  const margePct = parseFloat(document.getElementById('plan-marge').value) || 10.0;

  const codesCoches = new Set();
  document.querySelectorAll('#plan-sorties-checklist input[type="checkbox"]').forEach(chk => {
    if (chk.checked) codesCoches.add(chk.getAttribute('data-code'));
  });

  const est = CalculateurCharcuterie.estimerPrixUnitairePlanification(r, qBase, prixMatiere, codesCoches, margePct);
  document.getElementById('plan-est-cout').innerHTML = `Coût de revient estimé : <strong>${est.coutRevientUnitaireEstime.toFixed(2)} € / ${est.uniteProduitPrincipal}</strong>`;
  document.getElementById('plan-est-prix').innerHTML = `Prix conseillé : <strong style="color:var(--primary);">${est.prixReventeConseilleUnitaire.toFixed(2)} € / ${est.uniteProduitPrincipal}</strong>`;
}

export function confirmerPlanification() {
  const r = appState.recettes.find(x => x.id === uiState.dropdownRecetteSelectionneeId || x.code === uiState.dropdownRecetteSelectionneeId);
  if (!r) return;

  const nom = (document.getElementById('plan-nom').value || '').trim() || `Session ${r.nom}`;
  const qBase = parseFloat(document.getElementById('plan-quantite').value) || 1.0;
  const dateDebutVal = document.getElementById('plan-date').value || new Date().toISOString();
  const dateDebutMillis = new Date(dateDebutVal).getTime();
  const prixMatiere = parseFloat(document.getElementById('plan-prix-matiere').value) || 0;
  const margePct = parseFloat(document.getElementById('plan-marge').value) || 10.0;

  const projId = 'proj_' + Date.now();

  // Sorties cochées
  const sortiesDecoupe = (r.sortiesDecoupe || []).map((s, idx) => {
    const chk = document.getElementById('plan-sortie-chk-' + idx);
    const actif = chk ? chk.checked : s.cocheParDefaut;
    const qPrevue = qBase * s.rendementParUniteBase;
    return {
      codeSortie: s.codeSortie,
      nom: s.nom,
      unite: s.unite,
      actif: actif,
      quantitePrevue: qPrevue,
      quantiteReelle: qPrevue,
      valeurRefUnitaire: s.valeurRefBoutiqueUnitaire,
      fraisTransfoUnitaire: s.fraisTransfoUnitaire,
      prixReventeUnitaire: 0
    };
  });

  // Lots
  const lots = lotsDraftPlanification.map(lot => {
    return {
      nomProduit: (sortiesDecoupe[0] && sortiesDecoupe[0].nom) ? sortiesDecoupe[0].nom : r.nom,
      variante: lot.variante,
      quantitePrevue: lot.quantite,
      quantiteReelle: lot.quantite,
      unite: lot.unite,
      epicesUtiliseesGrammes: lot.quantite * (lot.epicesGrammesParUnite || 15),
      poidsInitialGrammes: 0,
      poidsActuelGrammes: 0,
      noteSur5: 5,
      commentaire: ''
    };
  });

  // Étapes
  const etapes = (r.etapes || []).map(e => {
    let jour = 'Affinage';
    if (e.offsetDebutMinutes < 1000) jour = 'Jour 1';
    else if (e.offsetDebutMinutes < 3000) jour = 'Jour 2';

    return {
      ordre: e.ordre,
      jourLibelle: jour,
      titre: e.titre,
      instructions: e.instructions,
      astuce: e.astuce,
      debutPrevuMillis: dateDebutMillis + (e.offsetDebutMinutes || 0) * 60000,
      dureeMinutes: e.dureeMinutes,
      terminee: false
    };
  });

  // Génération automatique des courses
  const coursesGenerees = [];
  // 1. Matière première
  coursesGenerees.push({
    id: 'c_' + Math.random().toString(36).slice(2, 9),
    projetId: projId,
    nomProjet: nom,
    nom: `${r.nom} (Matière première)`,
    categorie: 'VIANDE',
    qte: qBase,
    unite: r.uniteBase || 'pièces',
    prix: qBase * prixMatiere,
    prixReelPaye: qBase * prixMatiere,
    achete: false
  });

  // 2. Ingrédients proportionnels
  (r.ingredients || []).forEach(ing => {
    let qTot = ing.quantite || 0;
    if (['PAR_PIECE', 'PAR_KG_MATIERE', 'POURCENT_POIDS', 'PAR_KG_MELEE'].includes(ing.modeCalcul)) {
      qTot = ing.quantite * qBase;
    }
    const qAffichee = (ing.unite === 'g' && qTot >= 1000) ? (qTot / 1000) : qTot;
    const uniteAffichee = (ing.unite === 'g' && qTot >= 1000) ? 'kg' : ing.unite;
    const prixEst = (ing.unite === 'g') ? (qTot / 1000) * (ing.prixKgOuUniteEstime || 1.5) : qTot * (ing.prixKgOuUniteEstime || 1.5);

    const nomBas = (ing.nomIngredient || ing.nom || '').toLowerCase();
    const cat = (nomBas.includes('sel') || nomBas.includes('sucre') || nomBas.includes('dextrose')) ? 'SEL_SUCRE' : (nomBas.includes('boyau') ? 'CONSOMMABLES' : 'EPICES');

    coursesGenerees.push({
      id: 'c_' + Math.random().toString(36).slice(2, 9),
      projetId: projId,
      nomProjet: nom,
      nom: ing.nomIngredient || ing.nom,
      categorie: cat,
      qte: parseFloat(qAffichee.toFixed(2)),
      unite: uniteAffichee,
      prix: parseFloat(prixEst.toFixed(2)),
      prixReelPaye: parseFloat(prixEst.toFixed(2)),
      achete: false
    });
  });

  // 3. Épices par lot
  lots.forEach(lot => {
    if (lot.epicesUtiliseesGrammes > 0 && lot.variante !== 'Standard') {
      coursesGenerees.push({
        id: 'c_' + Math.random().toString(36).slice(2, 9),
        projetId: projId,
        nomProjet: nom,
        nom: `Épices lot ${lot.variante} (${lot.quantitePrevue} ${lot.unite})`,
        categorie: 'EPICES',
        qte: lot.epicesUtiliseesGrammes,
        unite: 'g',
        prix: parseFloat(((lot.epicesUtiliseesGrammes / 1000) * getValeurParametre('PRIX_EPICES_KG', 25.0)).toFixed(2)),
        prixReelPaye: parseFloat(((lot.epicesUtiliseesGrammes / 1000) * getValeurParametre('PRIX_EPICES_KG', 25.0)).toFixed(2)),
        achete: false
      });
    }
  });

  // Nouveau projet
  const nouveauProjet = {
    id: projId,
    recettePrincipaleId: r.id || r.code,
    nomRecettePrincipale: r.nom,
    nom: nom,
    typeProjet: (r.sortiesDecoupe && r.sortiesDecoupe.length > 0) ? 'VALORISATION_CANARD' : 'RECETTE_SIMPLE',
    dateDebut: dateDebutVal,
    quantiteBasePrevue: qBase,
    quantiteBaseReelle: qBase,
    unite: r.uniteBase || 'pièces',
    prixUnitaireMatiereBase: prixMatiere,
    margeTravailPct: margePct,
    prixReventeUnitaireFixe: 0,
    statut: 'EN_COURS',
    perteCiblePct: r.perteCiblePct || r.perteCible || 35,
    sortiesDecoupe: sortiesDecoupe,
    lots: lots,
    etapes: etapes
  };

  appState.projets.unshift(nouveauProjet);
  appState.courses.push(...coursesGenerees);

  sauvegarderDonnees();
  window.fermerModals();
  window.ouvrirDetailProjet(projId);
}

// Dropdown personnalisé dans Planifier
export function togglePlanRecetteDropdown() {
  const panel = document.getElementById('plan-dropdown-panel');
  const isOpen = panel.style.display === 'block';
  if (isOpen) fermerPlanRecetteDropdown();
  else ouvrirPlanRecetteDropdown();
}

export function ouvrirPlanRecetteDropdown() {
  const panel = document.getElementById('plan-dropdown-panel');
  panel.style.display = 'block';
  document.getElementById('plan-dropdown-chevron').style.transform = 'rotate(180deg)';
  filtrerRecettesDropdown();
}

export function fermerPlanRecetteDropdown() {
  const panel = document.getElementById('plan-dropdown-panel');
  if (panel) panel.style.display = 'none';
  const chev = document.getElementById('plan-dropdown-chevron');
  if (chev) chev.style.transform = 'rotate(0deg)';
}

export function filtrerCategorieDropdown(cat, btn) {
  uiState.dropdownFiltreCat = cat;
  document.querySelectorAll('.dropdown-category-chips .chip-sm').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  filtrerRecettesDropdown();
}

export function effacerRechercheRecettes() {
  document.getElementById('plan-dropdown-search').value = '';
  filtrerRecettesDropdown();
}

export function filtrerRecettesDropdown() {
  const container = document.getElementById('plan-dropdown-list');
  const query = (document.getElementById('plan-dropdown-search').value || '').trim().toLowerCase();

  let list = appState.recettes.filter(r => !r.masquee);
  if (uiState.dropdownFiltreCat !== 'Toutes') {
    list = list.filter(r => r.famille === uiState.dropdownFiltreCat);
  }
  if (query) {
    list = list.filter(r => r.nom.toLowerCase().includes(query));
  }

  container.innerHTML = list.map(r => `
    <div class="dropdown-option ${r.id === uiState.dropdownRecetteSelectionneeId ? 'selected' : ''}" onclick="selectionnerRecetteDropdown('${escapeJsStr(r.id || r.code)}')">
      <div>
        <div style="font-weight:600; font-size:0.88rem;">${escapeHtml(r.nom)}</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(r.famille)} · ${(r.etapes||[]).length} étapes</div>
      </div>
      <span class="badge badge-mini">${escapeHtml(r.uniteBase || 'pièce')}</span>
    </div>
  `).join('');
}
