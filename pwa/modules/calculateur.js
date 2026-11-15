// Calculateur économique et analytique (Courbe de perte de poids, croûtage, prédiction)
import { appState, getValeurParametre } from './state.js';

export const CalculateurCharcuterie = {
  estimerPrixUnitairePlanification: function(recette, quantiteBase, prixUnitaireMatiere, codesSortiesCochees, majorationPct = 10.0) {
    const qBase = Math.max(0.1, quantiteBase || 1.0);
    const coutMatiere = qBase * (prixUnitaireMatiere || 0);
    const coef = 1.0 + ((majorationPct || 10.0) / 100.0);

    const sortiesActives = (recette.sortiesDecoupe || []).filter(s => codesSortiesCochees.has(s.codeSortie));
    if (sortiesActives.length > 0) {
      let valeurRefTot = 0;
      sortiesActives.forEach(s => {
        valeurRefTot += (qBase * s.rendementParUniteBase) * s.valeurRefBoutiqueUnitaire;
      });
      valeurRefTot = Math.max(0.01, valeurRefTot);

      const cible = sortiesActives.find(s => s.codeSortie === 'magret') || sortiesActives[0];
      const qProduit = Math.max(0.1, qBase * cible.rendementParUniteBase);
      const refTotCible = qProduit * cible.valeurRefBoutiqueUnitaire;
      const partMatiere = coutMatiere * (refTotCible / valeurRefTot);

      const prixSelKg = getValeurParametre('PRIX_SEL_KG', 1.0);
      const prixEpicesKg = getValeurParametre('PRIX_EPICES_KG', 25.0);

      const fraisTot = (cible.codeSortie === 'magret')
        ? qProduit * (0.50 * prixSelKg + 0.015 * prixEpicesKg)
        : qProduit * (cible.fraisTransfoUnitaire || 0);

      const coutUnit = (partMatiere + fraisTot) / qProduit;
      return {
        nomProduitPrincipal: cible.nom,
        uniteProduitPrincipal: cible.unite,
        coutRevientUnitaireEstime: coutUnit,
        prixReventeConseilleUnitaire: coutUnit * coef
      };
    }

    let coutIngredients = 0;
    (recette.ingredients || []).forEach(ing => {
      let qTot = ing.quantite || 0;
      if (['PAR_PIECE', 'PAR_KG_MATIERE', 'POURCENT_POIDS', 'PAR_KG_MELEE'].includes(ing.modeCalcul)) {
        qTot = ing.quantite * qBase;
      }
      const coutIng = (ing.unite === 'g') ? (qTot / 1000.0) * (ing.prixKgOuUniteEstime || 0) : qTot * (ing.prixKgOuUniteEstime || 0);
      coutIngredients += coutIng;
    });

    const coutUnit = (coutMatiere + coutIngredients) / qBase;
    return {
      nomProduitPrincipal: recette.nom,
      uniteProduitPrincipal: recette.uniteBase || 'kg',
      coutRevientUnitaireEstime: coutUnit,
      prixReventeConseilleUnitaire: coutUnit * coef
    };
  },

  calculerBilanProjet: function(projet) {
    const qBase = projet.quantiteBaseReelle > 0 ? projet.quantiteBaseReelle : (projet.quantiteBasePrevue || 1.0);
    const coutMatierePremiere = qBase * (projet.prixUnitaireMatiereBase || 0);
    const margeCoef = 1.0 + ((projet.margeTravailPct || 10.0) / 100.0);

    const sortiesActives = (projet.sortiesDecoupe || []).filter(s => s.actif && (s.quantiteReelle > 0 || s.quantitePrevue > 0));

    const coursesProjet = (appState.courses || []).filter(c => c.projetId === projet.id || c.nomProjet === projet.nom);
    const commandesProjet = (appState.commandes || []).filter(c => c.projetId === projet.id || c.projetNom === projet.nom);

    const cmdTotal = commandesProjet.reduce((acc, c) => acc + (c.montantTotal || 0), 0);
    const cmdPaye = commandesProjet.filter(c => c.paye).reduce((acc, c) => acc + (c.montantTotal || 0), 0);

    if (sortiesActives.length === 0) {
      const totalLots = (projet.lots || []).reduce((acc, l) => acc + (l.quantiteReelle > 0 ? l.quantiteReelle : l.quantitePrevue), 0) || Math.max(1, qBase);
      const coutCoursesHorsViande = coursesProjet
        .filter(c => c.categorie !== 'VIANDE')
        .reduce((acc, c) => acc + (c.prixReelPaye > 0 ? c.prixReelPaye : (c.prixEstimeTotal || 0)), 0);

      const coutTotal = coutMatierePremiere + coutCoursesHorsViande;
      const coutUnit = coutTotal / totalLots;
      const prixUnit = projet.prixReventeUnitaireFixe > 0 ? projet.prixReventeUnitaireFixe : (coutUnit * margeCoef);
      const refGlobale = coutTotal * 1.6;

      const ligne = {
        codeSortie: 'principal',
        nom: projet.nomRecettePrincipale || projet.nom,
        unite: (projet.lots && projet.lots[0]) ? projet.lots[0].unite : (projet.unite || 'kg'),
        quantiteReelle: totalLots,
        valeurRefTotale: refGlobale,
        coutRevientTotal: coutTotal,
        coutRevientUnitaire: coutUnit,
        prixReventeConseilleUnitaire: prixUnit
      };

      return {
        coutMatierePremiereTotal: coutMatierePremiere,
        coutIngredientsEtFraisTotal: coutCoursesHorsViande,
        coutRevientGlobal: coutTotal,
        valeurRefBoutiqueGlobale: refGlobale,
        economieRealiseeVsBoutique: refGlobale - coutTotal,
        chiffreAffairesPotentielSiToutVendu: prixUnit * totalLots,
        margePotentielleTravail: (prixUnit * totalLots) - coutTotal,
        totalCommandesAmis: cmdTotal,
        totalPayeParAmis: cmdPaye,
        resteAPayerParAmis: Math.max(0, cmdTotal - cmdPaye),
        lignesProduits: [ligne],
        resumeGraisse: ''
      };
    }

    let valeurRefTotale = 0;
    sortiesActives.forEach(s => {
      const q = s.quantiteReelle > 0 ? s.quantiteReelle : s.quantitePrevue;
      valeurRefTotale += q * (s.valeurRefUnitaire || 0);
    });
    valeurRefTotale = Math.max(0.01, valeurRefTotale);

    let coutIngredientsGlobal = 0;
    let coutRevientGlobal = 0;
    let caPotentielGlobal = 0;

    const prixSelKg = getValeurParametre('PRIX_SEL_KG', 1.0);
    const prixEpicesKg = getValeurParametre('PRIX_EPICES_KG', 25.0);

    const lignes = sortiesActives.map(s => {
      const q = s.quantiteReelle > 0 ? s.quantiteReelle : s.quantitePrevue;
      const refTot = q * (s.valeurRefUnitaire || 0);
      const partRatio = refTot / valeurRefTotale;
      const partMatiere = coutMatierePremiere * partRatio;

      let fraisTotaux = 0;
      if (s.codeSortie === 'magret') {
        const selKg = q * 0.50;
        const epicesKg = q * 0.015;
        fraisTotaux = selKg * prixSelKg + epicesKg * prixEpicesKg;
      } else {
        fraisTotaux = q * (s.fraisTransfoUnitaire || 0);
      }

      const coutRevient = partMatiere + fraisTotaux;
      const coutUnit = q > 0 ? (coutRevient / q) : 0;
      let prixUnit = coutUnit * margeCoef;
      if (s.prixReventeUnitaire > 0) prixUnit = s.prixReventeUnitaire;
      else if (s.codeSortie === 'magret' && projet.prixReventeUnitaireFixe > 0) prixUnit = projet.prixReventeUnitaireFixe;

      coutIngredientsGlobal += fraisTotaux;
      coutRevientGlobal += coutRevient;
      caPotentielGlobal += prixUnit * q;

      return {
        codeSortie: s.codeSortie,
        nom: s.nom,
        unite: s.unite,
        quantiteReelle: q,
        valeurRefTotale: refTot,
        partMatierePremiere: partMatiere,
        fraisTransfoTotaux: fraisTotaux,
        coutRevientTotal: coutRevient,
        coutRevientUnitaire: coutUnit,
        prixReventeConseilleUnitaire: prixUnit,
        partPourcentageMatiere: partRatio * 100
      };
    });

    const graisseSortie = sortiesActives.find(s => s.codeSortie === 'graisse');
    const cuissesSortie = sortiesActives.find(s => s.codeSortie === 'cuisse');
    const rillettesSortie = sortiesActives.find(s => s.codeSortie === 'rillettes');

    let resumeGraisse = '';
    if (graisseSortie) {
      const gTot = graisseSortie.quantiteReelle > 0 ? graisseSortie.quantiteReelle : graisseSortie.quantitePrevue;
      const qCuisses = cuissesSortie ? (cuissesSortie.quantiteReelle > 0 ? cuissesSortie.quantiteReelle : cuissesSortie.quantitePrevue) : 0;
      const qRill = rillettesSortie ? (rillettesSortie.quantiteReelle > 0 ? rillettesSortie.quantiteReelle : rillettesSortie.quantitePrevue) : 0;
      const gConfit = qCuisses * 0.15;
      const gRill = qRill * 0.40;
      const surplus = Math.max(0, gTot - gConfit - gRill);
      resumeGraisse = `Graisse obtenue : ${gTot.toFixed(1)} ${graisseSortie.unite} (dont ~${gConfit.toFixed(1)} kg pour les cuisses confites, ~${gRill.toFixed(1)} kg pour les rillettes → ~${surplus.toFixed(1)} ${graisseSortie.unite} de surplus net en pot)`;
    }

    return {
      coutMatierePremiereTotal: coutMatierePremiere,
      coutIngredientsEtFraisTotal: coutIngredientsGlobal,
      coutRevientGlobal: coutRevientGlobal,
      valeurRefBoutiqueGlobale: valeurRefTotale,
      economieRealiseeVsBoutique: valeurRefTotale - coutRevientGlobal,
      chiffreAffairesPotentielSiToutVendu: caPotentielGlobal,
      margePotentielleTravail: caPotentielGlobal - coutRevientGlobal,
      totalCommandesAmis: cmdTotal,
      totalPayeParAmis: cmdPaye,
      resteAPayerParAmis: Math.max(0, cmdTotal - cmdPaye),
      lignesProduits: lignes,
      resumeGraisse: resumeGraisse
    };
  }
};

/**
 * Analyse la courbe d'évolution du poids d'un lot :
 * - perte actuelle & reste en grammes
 * - détection de croûtage (>15% la 1re semaine)
 * - estimation de la date d'atteinte de la perte cible
 */
export function analyserCourbePesees(lot, perteCiblePct = 35, dateDebutProjet = null) {
  const pInit = lot.poidsInitialGrammes || 0;
  const historique = Array.isArray(lot.historiquePesees)
    ? [...lot.historiquePesees].sort((a, b) => new Date(a.date) - new Date(b.date))
    : [];

  const dernierPoids = historique.length > 0
    ? historique[historique.length - 1].poidsGrammes
    : (lot.poidsActuelGrammes || pInit);

  const poidsCibleG = pInit > 0 ? Math.round(pInit * (1 - perteCiblePct / 100)) : 0;
  const perteActuellePct = pInit > 0 && dernierPoids > 0 ? (((pInit - dernierPoids) / pInit) * 100) : 0;
  const resteG = pInit > 0 && dernierPoids > 0 ? Math.max(0, Math.round(dernierPoids - poidsCibleG)) : 0;

  let risqueCroutage = false;
  let alerteCroutageMsg = '';
  let vitessePctParJour = 0;
  let dateEstimeeFin = null;

  if (pInit > 0 && historique.length > 0) {
    const refDateStr = dateDebutProjet || historique[0].date;
    const t0 = new Date(refDateStr).getTime();

    // Vérifier croûtage : perte > 15% dans les 7 premiers jours
    for (const pes of historique) {
      const jours = Math.max(0, (new Date(pes.date).getTime() - t0) / 86400000);
      const perte = ((pInit - pes.poidsGrammes) / pInit) * 100;
      if (jours <= 7 && perte > 15) {
        risqueCroutage = true;
        alerteCroutageMsg = `⚠️ Risque de croûtage : -${perte.toFixed(1)}% en ${Math.max(1, Math.round(jours))} j (>15% en 1re semaine). Augmentez l'HR% (75-80%) ou passez sous vide 3-5 jours pour rééquilibrer.`;
        break;
      }
    }

    // Calcul vitesse et estimation date fin
    const dernierePesee = historique[historique.length - 1];
    const tLast = new Date(dernierePesee.date).getTime();
    const joursTotaux = Math.max(1, (tLast - t0) / 86400000);
    if (perteActuellePct > 0.5 && joursTotaux >= 1) {
      vitessePctParJour = perteActuellePct / joursTotaux;
      if (perteActuellePct < perteCiblePct && vitessePctParJour > 0) {
        const joursRestants = Math.ceil((perteCiblePct - perteActuellePct) / vitessePctParJour);
        const estDate = new Date(tLast + joursRestants * 86400000);
        dateEstimeeFin = estDate.toISOString().slice(0, 10);
      }
    }
  }

  return {
    poidsInitial: pInit,
    dernierPoids,
    poidsCibleG,
    perteCiblePct,
    perteActuellePct: Number(perteActuellePct.toFixed(1)),
    resteG,
    historique,
    risqueCroutage,
    alerteCroutageMsg,
    vitessePctParJour: Number(vitessePctParJour.toFixed(2)),
    dateEstimeeFin
  };
}
