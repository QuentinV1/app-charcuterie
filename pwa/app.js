// L'Affinoir - Point d'entrée modulaire ES6 (PWA iPhone & Web)
import {
  appState, uiState, chargerDonnees, initialiserDonneesDefaut, sauvegarderDonnees,
  getValeurParametre, verifierPersistanceStockage, exporterDonnees, importerDonnees, reinitialiserDonnees
} from './modules/state.js';
import {
  ajouterPhotosEtapePWA, ouvrirApercuPhotoEtape, supprimerPhotoEtapePWA
} from './modules/photos.js';
import {
  ouvrirModalPeseeLotProjet, calculerPeseeModal, confirmerEnregistrementPesee,
  supprimerPeseeHistorique, ouvrirModalAjouterLotProjet
} from './modules/pesees.js';
import {
  rendreJournalCave, ajouterReleveCave, supprimerReleveCave, setCaveMetrique
} from './modules/cave.js';
import {
  ouvrirModalEvaluationProjet, sauvegarderEvaluationModal
} from './modules/evaluation.js';
import {
  rendreProjets, ouvrirDetailProjet, basculerSousOngletProjet, rendrePlanningProjet,
  decalerEtapePWA, demarrerEtapeMaintenantPWA,
  basculerEtapeProjetActuel, basculerStatutProjetActuel, supprimerProjetActuel,
  rendreProductionProjet, enregistrerSortieReelle, rendreBudgetProjet,
  ouvrirModalCommandePourProjetActuel
} from './modules/projets.js';
import {
  rendreRecettes, setFamilleFiltre, basculerAfficherMasquees, filtrerRecettes,
  ouvrirFicheRecette, basculerMasquageDepuisFiche, planifierDepuisFiche,
  supprimerRecetteDirect, supprimerRecetteDepuisFiche, supprimerRecetteParId
} from './modules/recettes.js';
import {
  ouvrirModalPlanifier, selectionnerRecetteDropdown, rendreLignesLotsPlanification,
  modifierLotDraftPlanification, ajouterLigneLotPlanification, supprimerLigneLotPlanification,
  actualiserEstimationPlanification, confirmerPlanification, togglePlanRecetteDropdown,
  ouvrirPlanRecetteDropdown, fermerPlanRecetteDropdown, filtrerCategorieDropdown,
  effacerRechercheRecettes, filtrerRecettesDropdown
} from './modules/planification.js';
import {
  rendreCourses, basculerAchatCourse, nettoyerCoursesAchetees, ouvrirModalModifierCourse,
  sauvegarderCourseModifiee, supprimerCourseActuelle, ouvrirModalAjoutCourseManuel, confirmerAjoutCourseManuel
} from './modules/courses.js';
import {
  rendreRevente, basculerPaiementCommande, basculerLivraisonCommande, supprimerCommande,
  ouvrirModalNouvelleCommande, recalculerTotalCommandeModal, mettreAJourProduitsDepuisProjetModal,
  remplirSuggestionsClientsModal, sauvegarderCommandeModal, rendreClients,
  ouvrirModalClient, sauvegarderClientModal, supprimerClient
} from './modules/revente.js';
import {
  basculerSousOngletParametres, rendreParametres, ouvrirModalModifierParam, sauvegarderParametreModal,
  initialiserSelectRecettesLotsParam, rendreLotsParametrage, ouvrirModalAjouterVariante,
  ouvrirModalModifierVariante, sauvegarderVarianteModal, supprimerVariante
} from './modules/parametres.js';

export function naviguerVers(vueId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const vue = document.getElementById('view-' + vueId);
  if (vue) vue.classList.add('active');

  const navId = (vueId === 'projet-detail') ? 'nav-projets'
    : (vueId === 'clients') ? 'nav-revente'
    : 'nav-' + vueId;
  const nav = document.getElementById(navId);
  if (nav) nav.classList.add('active');

  appliquerOptionRevente();

  if (vueId === 'projets') rendreProjets();
  else if (vueId === 'recettes') rendreRecettes();
  else if (vueId === 'courses') rendreCourses();
  else if (vueId === 'cave') rendreJournalCave();
  else if (vueId === 'revente') rendreRevente();
  else if (vueId === 'clients') rendreClients();
  else if (vueId === 'parametres') rendreParametres();

  mettreAJourBadgeCourses();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function initialiserTheme() {
  const saved = localStorage.getItem('laffinoir-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved ? (saved === 'dark') : prefersDark;
  appliquerTheme(isDark);
}

export function basculerTheme() {
  const isDark = document.body.classList.contains('dark-theme');
  localStorage.setItem('laffinoir-theme', !isDark ? 'dark' : 'light');
  appliquerTheme(!isDark);
}

export function appliquerTheme(isDark) {
  document.body.classList.toggle('dark-theme', isDark);
  const btn = document.getElementById('btn-theme-toggle');
  if (btn) {
    btn.innerText = isDark ? '☀️ Clair' : '🌙 Cave';
  }
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', isDark ? '#1A1614' : '#C84B31');
}

export function mettreAJourBadgeCourses() {
  const badge = document.getElementById('nav-badge-courses');
  if (!badge) return;
  const nbRestant = (appState.courses || []).filter(c => !c.achete).length;
  if (nbRestant > 0) {
    badge.innerText = nbRestant;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

export function estOptionPrixActive() {
  return getValeurParametre('ACTIVER_PRIX', 1) >= 0.5;
}

export function toggleModulePrix(actif) {
  let param = (appState.parametres || []).find(p => p.cle === 'ACTIVER_PRIX');
  if (!param) {
    appState.parametres.unshift({
      cle: 'ACTIVER_PRIX',
      libelle: 'Activer la gestion des prix et coûts',
      categorie: 'GENERAL',
      valeur: actif ? 1 : 0,
      unite: 'option',
      description: 'Afficher ou masquer tout ce qui concerne les prix, coûts et budgets'
    });
  } else {
    param.valeur = actif ? 1 : 0;
  }
  sauvegarderDonnees();
  appliquerOptionRevente();
}

export function toggleModuleRevente(actif) {
  let param = (appState.parametres || []).find(p => p.cle === 'ACTIVER_REVENTE');
  if (!param) {
    appState.parametres.unshift({ cle: 'ACTIVER_REVENTE', libelle: 'Activer l\'option Revente', categorie: 'GENERAL', valeur: actif ? 1 : 0, unite: 'option' });
  } else {
    param.valeur = actif ? 1 : 0;
  }
  sauvegarderDonnees();
  appliquerOptionRevente();
}

export function appliquerOptionRevente() {
  const prixActif = estOptionPrixActive();
  const reventeActive = prixActif && getValeurParametre('ACTIVER_REVENTE', 1) >= 0.5;

  const navRev = document.getElementById('nav-revente');
  if (navRev) navRev.style.display = reventeActive ? 'flex' : 'none';

  const cbPrix = document.getElementById('toggle-prix');
  if (cbPrix) cbPrix.checked = prixActif;

  const lblRev = document.getElementById('label-option-revente');
  if (lblRev) lblRev.style.display = prixActif ? 'flex' : 'none';

  const cardTarifs = document.getElementById('card-params-tarifs');
  if (cardTarifs) cardTarifs.style.display = prixActif ? 'block' : 'none';

  const cb = document.getElementById('toggle-revente');
  if (cb) cb.checked = reventeActive;

  if (!reventeActive && document.getElementById('view-revente').classList.contains('active')) {
    naviguerVers('projets');
  }
}

export function fermerModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

// Exposer sur window pour les handlers inline du HTML (onclick, oninput, onchange)
Object.assign(window, {
  naviguerVers,
  basculerTheme,
  toggleModulePrix,
  toggleModuleRevente,
  estOptionPrixActive,
  appliquerOptionRevente,
  mettreAJourBadgeCourses,
  fermerModals,
  exporterDonnees,
  importerDonnees,
  reinitialiserDonnees,
  // Photos
  ajouterPhotosEtapePWA: (idx, files) => ajouterPhotosEtapePWA(idx, files, rendrePlanningProjet),
  ouvrirApercuPhotoEtape,
  supprimerPhotoEtapePWA,
  // Pesées
  ouvrirModalPeseeLotProjet,
  calculerPeseeModal,
  confirmerEnregistrementPesee,
  supprimerPeseeHistorique,
  ouvrirModalAjouterLotProjet,
  // Cave
  rendreJournalCave,
  ajouterReleveCave,
  supprimerReleveCave,
  setCaveMetrique,
  // Évaluation
  ouvrirModalEvaluationProjet,
  sauvegarderEvaluationModal,
  // Projets
  rendreProjets,
  ouvrirDetailProjet,
  basculerSousOngletProjet,
  rendrePlanningProjet,
  decalerEtapePWA,
  demarrerEtapeMaintenantPWA,
  basculerEtapeProjetActuel,
  basculerStatutProjetActuel,
  supprimerProjetActuel,
  rendreProductionProjet,
  enregistrerSortieReelle,
  rendreBudgetProjet,
  ouvrirModalCommandePourProjetActuel,
  // Recettes
  rendreRecettes,
  setFamilleFiltre,
  basculerAfficherMasquees,
  filtrerRecettes,
  ouvrirFicheRecette,
  basculerMasquageDepuisFiche,
  planifierDepuisFiche,
  supprimerRecetteDirect,
  supprimerRecetteDepuisFiche,
  supprimerRecetteParId,
  // Planification
  ouvrirModalPlanifier,
  selectionnerRecetteDropdown,
  rendreLignesLotsPlanification,
  modifierLotDraftPlanification,
  ajouterLigneLotPlanification,
  supprimerLigneLotPlanification,
  actualiserEstimationPlanification,
  confirmerPlanification,
  togglePlanRecetteDropdown,
  ouvrirPlanRecetteDropdown,
  fermerPlanRecetteDropdown,
  filtrerCategorieDropdown,
  effacerRechercheRecettes,
  filtrerRecettesDropdown,
  // Courses
  rendreCourses,
  basculerAchatCourse,
  nettoyerCoursesAchetees,
  ouvrirModalModifierCourse,
  sauvegarderCourseModifiee,
  supprimerCourseActuelle,
  ouvrirModalAjoutCourseManuel,
  confirmerAjoutCourseManuel,
  // Revente & Clients
  rendreRevente,
  basculerPaiementCommande,
  basculerLivraisonCommande,
  supprimerCommande,
  ouvrirModalNouvelleCommande,
  recalculerTotalCommandeModal,
  mettreAJourProduitsDepuisProjetModal,
  remplirSuggestionsClientsModal,
  sauvegarderCommandeModal,
  rendreClients,
  ouvrirModalClient,
  sauvegarderClientModal,
  supprimerClient,
  // Paramètres
  basculerSousOngletParametres,
  rendreParametres,
  ouvrirModalModifierParam,
  sauvegarderParametreModal,
  initialiserSelectRecettesLotsParam,
  rendreLotsParametrage,
  ouvrirModalAjouterVariante,
  ouvrirModalModifierVariante,
  sauvegarderVarianteModal,
  supprimerVariante
});

document.addEventListener('DOMContentLoaded', () => {
  chargerDonnees();
  initialiserTheme();
  verifierPersistanceStockage();
  naviguerVers('projets');

  if ('serviceWorker' in navigator) {
    let isRefreshing = false;
    const hadController = !!navigator.serviceWorker.controller;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!isRefreshing && hadController) {
        isRefreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log("L'Affinoir PWA - Service Worker actif.");
        reg.update();
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update();
          }
        });
      })
      .catch(err => console.log('Erreur Service Worker:', err));
  }
});
