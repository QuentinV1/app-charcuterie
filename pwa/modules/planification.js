import { appState, uiState, sauvegarderDonnees, getValeurParametre, escapeHtml, escapeJsStr } from './state.js';
import { CalculateurCharcuterie, poidsUnitaireKgRecette } from './calculateur.js';
import { rendreRappelEvaluationPlanification } from './evaluation.js';
import {
  MODE_SALAGE, modeSalageParDefaut, formaterDureeSalage,
  dureeSalageHeuresAdaptee, adapterEtapesPourModeSalage
} from './salage.js';

export let lotsDraftPlanification = [];
let modeSalageSelectionne = MODE_SALAGE.RECOUVREMENT_SEL;

export function selectionnerModeSalage(mode) {
  modeSalageSelectionne = mode === MODE_SALAGE.SOUS_VIDE ? MODE_SALAGE.SOUS_VIDE : MODE_SALAGE.RECOUVREMENT_SEL;
  actualiserAffichageModeSalage();
}

export function actualiserAffichageModeSalage() {
  const r = appState.recettes.find(x => x.id === uiState.dropdownRecetteSelectionneeId || x.code === uiState.dropdownRecetteSelectionneeId);
  if (!r) return;
  const qBase = parseFloat(document.getElementById('plan-quantite')?.value) || r.quantiteDefaut || 1;
  const dureeRecH = dureeSalageHeuresAdaptee(r, MODE_SALAGE.RECOUVREMENT_SEL, qBase);
  const dureeSvH = dureeSalageHeuresAdaptee(r, MODE_SALAGE.SOUS_VIDE, qBase);

  const elRec = document.getElementById('salage-duree-recouvrement');
  const elSv = document.getElementById('salage-duree-sousvide');
  const btnRec = document.getElementById('btn-salage-recouvrement');
  const btnSv = document.getElementById('btn-salage-sousvide');
  const elRes = document.getElementById('plan-salage-resume');

  if (elRec) elRec.innerText = `Gros sel · ${formaterDureeSalage(dureeRecH)}`;
  if (elSv) elSv.innerText = `3 % sel · ${formaterDureeSalage(dureeSvH)}`;

  if (btnRec && btnSv) {
    const isSv = modeSalageSelectionne === MODE_SALAGE.SOUS_VIDE;
    btnRec.style.border = isSv ? '1px solid var(--border)' : '1.5px solid var(--primary)';
    btnRec.style.background = isSv ? 'var(--surface-subtle)' : 'var(--primary-light)';
    btnRec.style.color = 'var(--text-main)';
    if (elRec) elRec.style.color = isSv ? 'var(--text-muted)' : 'var(--primary)';

    btnSv.style.border = isSv ? '1.5px solid var(--primary)' : '1px solid var(--border)';
    btnSv.style.background = isSv ? 'var(--primary-light)' : 'var(--surface-subtle)';
    btnSv.style.color = 'var(--text-main)';
    if (elSv) elSv.style.color = isSv ? 'var(--primary)' : 'var(--text-muted)';
  }
  if (elRes) {
    const dureeSelH = modeSalageSelectionne === MODE_SALAGE.SOUS_VIDE ? dureeSvH : dureeRecH;
    elRes.innerText = `⏱️ Mise au sel : ${formaterDureeSalage(dureeSelH)} · Étapes et liste de courses adaptées automatiquement.`;
  }
}

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
  const revToggleRow = document.getElementById('plan-revente-toggle-row');
  if (revToggleRow) revToggleRow.style.display = prixActif ? 'flex' : 'none';
  const chkRev = document.getElementById('plan-activer-revente');
  if (chkRev) chkRev.checked = prixActif && getValeurParametre('ACTIVER_REVENTE', 1) >= 0.5;
  const prixRevInp = document.getElementById('plan-prix-revente');
  if (prixRevInp) prixRevInp.dataset.manual = '';

  document.getElementById('modal-planifier').classList.add('active');
}

export function definirDatePlanificationShortcut(type) {
  const d = new Date();
  if (type === 'demain9h') {
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
  } else if (type === 'samedi9h') {
    const day = d.getDay(); // 0=dim, 6=sam
    const diff = (6 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    d.setHours(9, 0, 0, 0);
  }
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  const inp = document.getElementById('plan-date');
  if (inp) inp.value = d.toISOString().slice(0, 16);
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
  lastPlanQuantiteBase = r.quantiteDefaut || 1;
  modeSalageSelectionne = modeSalageParDefaut(r);
  lotsDraftPlanification = [];
  if (r.variantes && r.variantes.length > 0) {
    const qBase = lastPlanQuantiteBase;
    const totalUnites = qBase * (r.sortiesDecoupe && r.sortiesDecoupe[0] ? r.sortiesDecoupe[0].rendementParUniteBase : 1);
    const nVar = r.variantes.length;
    const baseParLot = Math.floor(totalUnites / nVar);
    let reste = Math.round(totalUnites - baseParLot * nVar);
    r.variantes.forEach(v => {
      const qLot = Math.max(0, baseParLot + (reste > 0 ? 1 : 0));
      if (reste > 0) reste--;
      lotsDraftPlanification.push({
        variante: v.nom,
        quantite: qLot || 1,
        baseQuantite: qLot || 1,
        unite: (r.sortiesDecoupe && r.sortiesDecoupe[0]) ? r.sortiesDecoupe[0].unite : (r.uniteBase || 'pièce'),
        epicesGrammesParUnite: v.epicesGrammesParUnite || 15,
        dureeSalageHeuresSpecifique: v.dureeSalageHeuresSpecifique ?? null
      });
    });
  } else {
    const qDef = r.quantiteDefaut || 1;
    lotsDraftPlanification.push({
      variante: 'Standard',
      quantite: qDef,
      baseQuantite: qDef,
      unite: r.uniteBase || 'kg',
      epicesGrammesParUnite: 0,
      dureeSalageHeuresSpecifique: null
    });
  }

  rendreLignesLotsPlanification();
  actualiserAffichageModeSalage();
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
  const modal = document.getElementById('modal-planif-custom-lot');
  if (!modal) return;
  document.getElementById('pcl-nom').value = '';
  document.getElementById('pcl-qte').value = '1';
  document.getElementById('pcl-epices').value = '15';
  document.getElementById('pcl-salage').value = '';
  document.getElementById('pcl-desc').value = '';
  document.getElementById('pcl-save-catalog').checked = false;
  modal.classList.add('active');
}

export function confirmerCustomLotPlanification() {
  const r = appState.recettes.find(x => x.id === uiState.dropdownRecetteSelectionneeId || x.code === uiState.dropdownRecetteSelectionneeId);
  const unite = (r && r.sortiesDecoupe && r.sortiesDecoupe[0]) ? r.sortiesDecoupe[0].unite : (r ? r.uniteBase : 'pièce');
  const nomLot = (document.getElementById('pcl-nom').value || '').trim() || 'Nouveau lot';
  const qteLot = Math.max(0.5, parseFloat(document.getElementById('pcl-qte').value) || 1);
  const epicesLotG = Math.max(0, parseFloat(document.getElementById('pcl-epices').value) || 0);
  const salageRaw = parseFloat(document.getElementById('pcl-salage').value);
  const salageLotH = (!Number.isNaN(salageRaw) && salageRaw > 0) ? salageRaw : null;
  const descLot = (document.getElementById('pcl-desc').value || '').trim();
  const saveCatalog = document.getElementById('pcl-save-catalog').checked;

  lotsDraftPlanification.push({
    variante: nomLot,
    quantite: qteLot,
    baseQuantite: qteLot,
    unite,
    epicesGrammesParUnite: epicesLotG,
    dureeSalageHeuresSpecifique: salageLotH
  });

  if (saveCatalog && r) {
    if (!Array.isArray(r.variantes)) r.variantes = [];
    r.variantes.push({
      nom: nomLot,
      descriptionEpices: descLot || `${epicesLotG}g / ${unite}`,
      epicesGrammesParUnite: epicesLotG,
      dureeSalageHeuresSpecifique: salageLotH,
      ajouteEtapeFumage: false
    });
    sauvegarderDonnees();
  }

  document.getElementById('modal-planif-custom-lot').classList.remove('active');
  rendreLignesLotsPlanification();
  actualiserEstimationPlanification();
}

let lastPlanQuantiteBase = 1;

export function supprimerLigneLotPlanification(idx) {
  lotsDraftPlanification.splice(idx, 1);
  rendreLignesLotsPlanification();
  actualiserEstimationPlanification();
}

export function actualiserEstimationPlanification() {
  const r = appState.recettes.find(x => x.id === uiState.dropdownRecetteSelectionneeId || x.code === uiState.dropdownRecetteSelectionneeId);
  if (!r) return;
  actualiserAffichageModeSalage();

  const rawQBase = document.getElementById('plan-quantite').value.trim();
  const parsedQBase = parseFloat(rawQBase);
  const qBase = (!Number.isNaN(parsedQBase) && parsedQBase > 0) ? parsedQBase : (lastPlanQuantiteBase || 1.0);
  if (rawQBase !== '' && !Number.isNaN(parsedQBase) && parsedQBase > 0 && lastPlanQuantiteBase > 0 && lotsDraftPlanification.length > 0) {
    const ratio = parsedQBase / lastPlanQuantiteBase;
    lotsDraftPlanification.forEach(lot => {
      const baseQ = lot.baseQuantite ?? lot.quantite;
      const scaled = baseQ * ratio;
      lot.quantite = (lot.unite === 'kg' || lot.unite === 'L')
        ? Math.round(scaled * 100) / 100
        : Math.max(1, Math.round(scaled));
    });
    rendreLignesLotsPlanification();
  }
  const prixMatiere = parseFloat(document.getElementById('plan-prix-matiere').value) || 0;
  const margeParsed = parseFloat(document.getElementById('plan-marge').value);
  const margePct = Number.isNaN(margeParsed) ? 10.0 : margeParsed;

  const codesCoches = new Set();
  document.querySelectorAll('#plan-sorties-checklist input[type="checkbox"]').forEach(chk => {
    if (chk.checked) codesCoches.add(chk.getAttribute('data-code'));
  });

  const est = CalculateurCharcuterie.estimerPrixUnitairePlanification(r, qBase, prixMatiere, codesCoches, margePct, modeSalageSelectionne);
  document.getElementById('plan-est-cout').innerHTML = `Coût de revient estimé : <strong>${est.coutRevientUnitaireEstime.toFixed(2)} € / ${escapeHtml(est.uniteProduitPrincipal)}</strong>`;
  document.getElementById('plan-est-prix').innerHTML = `Prix conseillé : <strong style="color:var(--primary);">${est.prixReventeConseilleUnitaire.toFixed(2)} € / ${escapeHtml(est.uniteProduitPrincipal)}</strong>`;

  const prixRevInp = document.getElementById('plan-prix-revente');
  if (prixRevInp && !prixRevInp.dataset.manual) {
    prixRevInp.value = est.prixReventeConseilleUnitaire.toFixed(2);
  }
}

export function modifierPrixReventePlanification() {
  const r = appState.recettes.find(x => x.id === uiState.dropdownRecetteSelectionneeId || x.code === uiState.dropdownRecetteSelectionneeId);
  const prixRevInp = document.getElementById('plan-prix-revente');
  const margeInp = document.getElementById('plan-marge');
  if (!r || !prixRevInp || !margeInp) return;
  prixRevInp.dataset.manual = '1';

  const qBase = parseFloat(document.getElementById('plan-quantite').value) || 1.0;
  const prixMatiere = parseFloat(document.getElementById('plan-prix-matiere').value) || 0;
  const codesCoches = new Set();
  document.querySelectorAll('#plan-sorties-checklist input[type="checkbox"]').forEach(chk => {
    if (chk.checked) codesCoches.add(chk.getAttribute('data-code'));
  });
  const est = CalculateurCharcuterie.estimerPrixUnitairePlanification(r, qBase, prixMatiere, codesCoches, 0, modeSalageSelectionne);
  const coutUnit = est.coutRevientUnitaireEstime;
  const prixSaisi = parseFloat(prixRevInp.value);
  if (coutUnit > 0 && Number.isFinite(prixSaisi) && prixSaisi >= 0) {
    const newMarge = ((prixSaisi / coutUnit) - 1) * 100;
    margeInp.value = Math.round(newMarge * 10) / 10;
  }
  document.getElementById('plan-est-prix').innerHTML = `Prix conseillé : <strong style="color:var(--primary);">${(Number.isFinite(prixSaisi) ? prixSaisi : 0).toFixed(2)} € / ${escapeHtml(est.uniteProduitPrincipal)}</strong>`;
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
    const dureeSalH = dureeSalageHeuresAdaptee(r, modeSalageSelectionne, qBase, lot.dureeSalageHeuresSpecifique ?? null);
    return {
      nomProduit: (sortiesDecoupe[0] && sortiesDecoupe[0].nom) ? sortiesDecoupe[0].nom : r.nom,
      variante: lot.variante,
      quantitePrevue: lot.quantite,
      quantiteReelle: lot.quantite,
      unite: lot.unite,
      epicesUtiliseesGrammes: lot.quantite * (lot.epicesGrammesParUnite || 15),
      dureeSalageHeures: dureeSalH,
      poidsInitialGrammes: 0,
      poidsActuelGrammes: 0,
      noteSur5: 5,
      commentaire: ''
    };
  });

  // Étapes filtrées par variante et adaptées au mode de salage
  const nomsVariantesPresentes = lots.filter(l => l.quantitePrevue > 0).map(l => (l.variante || '').toLowerCase());
  const etapesFiltrees = (r.etapes || []).slice().sort((a, b) => (a.ordre || 0) - (b.ordre || 0)).filter(e => {
    const vc = (e.varianteCible || '').trim().toLowerCase();
    return !vc || nomsVariantesPresentes.some(n => n.includes(vc));
  });
  const etapesAdaptees = adapterEtapesPourModeSalage(r, etapesFiltrees, modeSalageSelectionne, qBase);

  const etapes = etapesAdaptees.map((e, idx) => {
    const jourNum = Math.floor((e.offsetDebutMinutes || 0) / 1440) + 1;
    const jour = jourNum <= 3 ? `Jour ${jourNum}` : `J+${jourNum - 1}`;

    return {
      ordre: idx + 1,
      jourLibelle: jour,
      titre: e.titre,
      instructions: e.instructions,
      astuce: e.astuce,
      debutPrevuMillis: dateDebutMillis + (e.offsetDebutMinutes || 0) * 60000,
      dureeMinutes: e.dureeMinutes,
      varianteCible: e.varianteCible || '',
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

  // 2. Ingrédients proportionnels (adaptés au mode de salage)
  const nativeMode = modeSalageParDefaut(r);
  const estSwitchSousVide = modeSalageSelectionne === MODE_SALAGE.SOUS_VIDE && nativeMode === MODE_SALAGE.RECOUVREMENT_SEL;
  const estSwitchRecouvrement = modeSalageSelectionne === MODE_SALAGE.RECOUVREMENT_SEL && nativeMode === MODE_SALAGE.SOUS_VIDE;
  let selSousVideAjoute = false;
  let grosSelAjoute = false;
  const prixSelKg = getValeurParametre('PRIX_SEL_KG', 1.0);
  const poidsKgParUnite = poidsUnitaireKgRecette(r);
  const aEpicesParLot = lots.some(lot => lot.epicesUtiliseesGrammes > 0 && lot.variante !== 'Standard');
  const estEpiceGenerique = (nomIng) => /([ée]pice|poivre|paprika|piment|herbe|geni[èe]vre|laurier|thym|romarin|muscade|coriandre|girofle)/.test(nomIng);

  (r.ingredients || []).forEach(ing => {
    const nomLow = (ing.nomIngredient || ing.nom || '').toLowerCase();
    if (estSwitchSousVide && nomLow.includes('gros sel')) {
      if (!selSousVideAjoute) {
        selSousVideAjoute = true;
        const qSelG = (r.uniteBase === 'pièce' ? 15 : 30) * qBase;
        const pSel = parseFloat(((qSelG / 1000) * 1.5).toFixed(2));
        coursesGenerees.push({
          id: 'c_' + Math.random().toString(36).slice(2, 9),
          projetId: projId,
          nomProjet: nom,
          nom: 'Sel fin non iodé / nitrité (3 % sous-vide)',
          categorie: 'SEL_SUCRE',
          qte: parseFloat((qSelG >= 1000 ? qSelG / 1000 : qSelG).toFixed(2)),
          unite: qSelG >= 1000 ? 'kg' : 'g',
          prix: pSel,
          prixReelPaye: pSel,
          achete: false
        });
        const qSucreG = (r.uniteBase === 'pièce' ? 5 : 10) * qBase;
        const pSucre = parseFloat(((qSucreG / 1000) * 2.0).toFixed(2));
        coursesGenerees.push({
          id: 'c_' + Math.random().toString(36).slice(2, 9),
          projetId: projId,
          nomProjet: nom,
          nom: 'Sucre / Cassonade (1 % sous-vide)',
          categorie: 'SEL_SUCRE',
          qte: parseFloat((qSucreG >= 1000 ? qSucreG / 1000 : qSucreG).toFixed(2)),
          unite: qSucreG >= 1000 ? 'kg' : 'g',
          prix: pSucre,
          prixReelPaye: pSucre,
          achete: false
        });
      }
      return;
    }
    if (estSwitchRecouvrement && nomLow.includes('sel') && ing.modeCalcul === 'POURCENT_POIDS') {
      if (!grosSelAjoute) {
        grosSelAjoute = true;
        const qGrosSelKg = ((r.uniteBase === 'pièce' ? 500 : 1000) * qBase) / 1000;
        const pGrosSel = parseFloat((qGrosSelKg * prixSelKg).toFixed(2));
        coursesGenerees.push({
          id: 'c_' + Math.random().toString(36).slice(2, 9),
          projetId: projId,
          nomProjet: nom,
          nom: 'Gros sel non iodé (recouvrement)',
          categorie: 'SEL_SUCRE',
          qte: parseFloat(qGrosSelKg.toFixed(2)),
          unite: 'kg',
          prix: pGrosSel,
          prixReelPaye: pGrosSel,
          achete: false
        });
      }
      return;
    }

    const nomBas = (ing.nomIngredient || ing.nom || '').toLowerCase();
    const cat = (nomBas.includes('sel') || nomBas.includes('sucre') || nomBas.includes('dextrose')) ? 'SEL_SUCRE' : (nomBas.includes('boyau') ? 'CONSOMMABLES' : 'EPICES');
    if (aEpicesParLot && cat === 'EPICES' && estEpiceGenerique(nomBas)) {
      return;
    }

    let qTot = ing.quantite || 0;
    let uniteIng = ing.unite;
    if (ing.modeCalcul === 'POURCENT_POIDS') {
      const facteurPct = ing.unite === '%' ? 10.0 : 1.0;
      qTot = ing.quantite * facteurPct * qBase * poidsKgParUnite;
      if (ing.unite === '%') uniteIng = 'g';
    } else if (['PAR_PIECE', 'PAR_KG_MATIERE', 'PAR_KG_MELEE'].includes(ing.modeCalcul)) {
      qTot = ing.quantite * qBase;
    }
    const qAffichee = (uniteIng === 'g' && qTot >= 1000) ? (qTot / 1000) : qTot;
    const uniteAffichee = (uniteIng === 'g' && qTot >= 1000) ? 'kg' : uniteIng;
    const prixUnitEst = ing.prixKgOuUniteEstime ?? 1.5;
    const prixEst = (uniteIng === 'g') ? (qTot / 1000) * prixUnitEst : qTot * prixUnitEst;

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

  if (modeSalageSelectionne === MODE_SALAGE.SOUS_VIDE) {
    const nbSachets = r.uniteBase === 'pièce' ? qBase : Math.max(1, Math.ceil(qBase));
    const pSachets = parseFloat((nbSachets * 0.25).toFixed(2));
    coursesGenerees.push({
      id: 'c_' + Math.random().toString(36).slice(2, 9),
      projetId: projId,
      nomProjet: nom,
      nom: 'Sachets sous vide',
      categorie: 'CONSOMMABLES',
      qte: nbSachets,
      unite: 'pièce',
      prix: pSachets,
      prixReelPaye: pSachets,
      achete: false
    });
  }

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
  const activerRevente = document.getElementById('plan-activer-revente')?.checked ?? true;
  const prixRevInp = document.getElementById('plan-prix-revente');
  const prixRevFixe = (prixRevInp && prixRevInp.dataset.manual && parseFloat(prixRevInp.value) > 0) ? parseFloat(prixRevInp.value) : null;

  const nouveauProjet = {
    id: projId,
    activerRevente,
    prixReventeUnitaireFixe: prixRevFixe,
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
    modeSalage: modeSalageSelectionne,
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
