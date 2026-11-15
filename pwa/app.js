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
  effacerRechercheRecettes, filtrerRecettesDropdown, selectionnerModeSalage
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

// === SYSTÈME DE MISE À JOUR AUTOMATIQUE VIA GIT (PWA & APK) ===
const CURRENT_APP_VERSION = '1.1.0';
const GITHUB_REPO = 'QuentinV1/app-charcuterie';
const UPDATE_DISMISSED_KEY = 'laffinoir_update_dismissed';
const DEFAULT_APK_URL = `https://github.com/${GITHUB_REPO}/raw/main/LAffinoir.apk`;

let latestUpdateData = null;
let lastAutoCheckTime = 0;

function afficherToastMaj(message) {
  let toast = document.getElementById('laffinoir-update-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'laffinoir-update-toast';
    toast.style.cssText = 'position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:9999;background:#1C1917;color:#FFF;padding:10px 16px;border-radius:12px;font-size:0.84rem;font-weight:600;box-shadow:0 6px 20px rgba(0,0,0,0.22);max-width:90vw;text-align:center;transition:opacity 0.2s ease;';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => {
    toast.style.opacity = '0';
  }, 3200);
}

function compareVersions(v1, v2) {
  const clean1 = String(v1 || '').trim().replace(/^v/i, '').split('-')[0];
  const clean2 = String(v2 || '').trim().replace(/^v/i, '').split('-')[0];
  const parts1 = clean1.split('.').map(n => parseInt(n, 10) || 0);
  const parts2 = clean2.split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < len; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

function isTrustedGitUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    return u.protocol === 'https:' && (
      u.hostname === 'github.com' ||
      u.hostname === 'raw.githubusercontent.com' ||
      u.hostname === 'api.github.com'
    );
  } catch {
    return false;
  }
}

async function fetchLatestReleaseInfo() {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      cache: 'no-cache'
    });
    if (!res.ok) return null;
    const rel = await res.json();
    const version = rel.tag_name || rel.name;
    if (!version) return null;
    const apkAsset = Array.isArray(rel.assets)
      ? rel.assets.find(a => String(a.name || '').toLowerCase().endsWith('.apk'))
      : null;
    return {
      version: version.startsWith('v') ? version : `v${version}`,
      notes: (rel.body || '').trim() || 'Nouvelle version publiée sur GitHub Releases.',
      apkUrl: apkAsset?.browser_download_url || DEFAULT_APK_URL,
      standaloneUrl: `https://github.com/${GITHUB_REPO}/raw/main/pwa/laffinoir-standalone.html`,
      htmlUrl: rel.html_url || `https://github.com/${GITHUB_REPO}/releases`,
      source: 'release'
    };
  } catch {
    return null;
  }
}

async function fetchMainBranchInfo() {
  try {
    const res = await fetch(`https://raw.githubusercontent.com/${GITHUB_REPO}/main/version.json?t=${Date.now()}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.version) return null;

    let commitNotes = '';
    try {
      const commitRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits/main`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
        cache: 'no-cache'
      });
      if (commitRes.ok) {
        const commitData = await commitRes.json();
        commitNotes = (commitData?.commit?.message || '').trim();
      }
    } catch {}

    const parts = [String(data.notes || '').trim(), commitNotes].filter(Boolean);
    const notes = Array.from(new Set(parts)).join('\n\n') || 'Nouvelle mise à jour disponible sur Git (branche main).';

    return {
      version: `v${String(data.version).replace(/^v/i, '')}`,
      notes,
      apkUrl: data.apkUrl || DEFAULT_APK_URL,
      standaloneUrl: data.standaloneUrl || `https://github.com/${GITHUB_REPO}/raw/main/pwa/laffinoir-standalone.html`,
      htmlUrl: `https://github.com/${GITHUB_REPO}`,
      source: 'git-main'
    };
  } catch {
    return null;
  }
}

async function fetchLocalVersionInfo() {
  if (!window.location.protocol.startsWith('http')) return null;
  try {
    const res = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.version) return null;
    return {
      version: `v${String(data.version).replace(/^v/i, '')}`,
      notes: (data.notes || '').trim() || 'Nouvelle version déployée sur le serveur.',
      apkUrl: data.apkUrl || DEFAULT_APK_URL,
      standaloneUrl: data.standaloneUrl || `https://github.com/${GITHUB_REPO}/raw/main/pwa/laffinoir-standalone.html`,
      htmlUrl: `https://github.com/${GITHUB_REPO}`,
      source: 'local-host'
    };
  } catch {
    return null;
  }
}

export async function verifierMisesAJourGit(isManual = false) {
  if (isManual) {
    afficherToastMaj('Vérification des mises à jour sur Git…');
  } else {
    lastAutoCheckTime = Date.now();
  }

  try {
    const [releaseInfo, mainInfo, localInfo] = await Promise.all([
      fetchLatestReleaseInfo(),
      fetchMainBranchInfo(),
      fetchLocalVersionInfo()
    ]);

    // Si l'hébergeur sert déjà une version plus récente que le bundle en mémoire, actualiser automatiquement pour tout le monde
    if (!isManual && localInfo && compareVersions(localInfo.version, CURRENT_APP_VERSION) > 0) {
      const triedVer = sessionStorage.getItem('laffinoir_auto_refresh_ver');
      if (triedVer !== localInfo.version) {
        sessionStorage.setItem('laffinoir_auto_refresh_ver', localInfo.version);
        await actualiserPwaDepuisGit();
        return;
      }
    }

    const candidates = [localInfo, mainInfo, releaseInfo].filter(Boolean);
    if (candidates.length === 0) {
      if (isManual) afficherToastMaj('Impossible de contacter Git (vérifiez votre connexion)');
      return;
    }

    candidates.sort((a, b) => compareVersions(b.version, a.version));
    const bestUpdate = candidates[0];

    if (compareVersions(bestUpdate.version, CURRENT_APP_VERSION) > 0) {
      if (!isManual) {
        const dismissed = localStorage.getItem(UPDATE_DISMISSED_KEY);
        if (dismissed) {
          try {
            const parsed = JSON.parse(dismissed);
            if (parsed.version === bestUpdate.version && (Date.now() - parsed.time < 24 * 3600 * 1000)) {
              return;
            }
          } catch {}
        }
      }

      latestUpdateData = bestUpdate;
      afficherModalMiseAJourGit(bestUpdate);
    } else if (isManual) {
      afficherToastMaj(`Application à jour (v${CURRENT_APP_VERSION})`);
    }
  } catch (err) {
    console.warn('Échec vérification mise à jour Git:', err);
    if (isManual) afficherToastMaj('Erreur lors de la vérification sur Git');
  }
}

function afficherModalMiseAJourGit(updateInfo) {
  const modal = document.getElementById('modal-update-git');
  if (!modal) return;

  const badge = document.getElementById('update-git-badge');
  const notes = document.getElementById('update-git-notes');
  const refreshBtn = document.getElementById('btn-update-pwa-refresh');

  if (badge) {
    badge.textContent = `Version ${updateInfo.version} disponible (actuelle : v${CURRENT_APP_VERSION})`;
  }
  if (notes) {
    notes.textContent = updateInfo.notes || 'Améliorations générales et corrections de bugs.';
  }
  if (refreshBtn) {
    refreshBtn.style.display = window.location.protocol.startsWith('http') ? 'inline-flex' : 'none';
  }

  modal.classList.add('active');
}

export function fermerModalMiseAJourGit() {
  document.getElementById('modal-update-git')?.classList.remove('active');
}

export function ignorerMiseAJourGit() {
  if (latestUpdateData?.version) {
    localStorage.setItem(UPDATE_DISMISSED_KEY, JSON.stringify({
      version: latestUpdateData.version,
      time: Date.now()
    }));
  }
  fermerModalMiseAJourGit();
}

export async function actualiserPwaDepuisGit() {
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(async (r) => {
        await r.update();
        if (r.waiting) r.waiting.postMessage('SKIP_WAITING');
      }));
    }
  } catch (e) {
    console.warn('Erreur lors du rafraîchissement PWA:', e);
  }
  window.location.reload();
}

export function telechargerApkDepuisGit() {
  let targetUrl = DEFAULT_APK_URL;
  if (window.location.protocol === 'file:' && latestUpdateData?.standaloneUrl) {
    targetUrl = latestUpdateData.standaloneUrl;
  } else if (latestUpdateData?.apkUrl) {
    targetUrl = latestUpdateData.apkUrl;
  }

  if (!isTrustedGitUrl(targetUrl)) {
    targetUrl = DEFAULT_APK_URL;
  }
  window.open(targetUrl, '_blank', 'noopener,noreferrer');
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
  // Mises à jour Git
  verifierMisesAJourGit,
  actualiserPwaDepuisGit,
  telechargerApkDepuisGit,
  ignorerMiseAJourGit,
  fermerModalMiseAJourGit,
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
  selectionnerModeSalage,
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
  const versionText = `v${CURRENT_APP_VERSION}`;
  const headerBadge = document.getElementById('header-version-badge');
  if (headerBadge) headerBadge.textContent = versionText;
  const paramsBadge = document.getElementById('params-version-badge');
  if (paramsBadge) paramsBadge.textContent = versionText;

  chargerDonnees();
  initialiserTheme();
  verifierPersistanceStockage();
  naviguerVers('projets');

  if (window.location.protocol.startsWith('http') && 'serviceWorker' in navigator) {
    let isRefreshing = false;
    const hadController = !!navigator.serviceWorker.controller;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!isRefreshing && hadController) {
        isRefreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        console.log("L'Affinoir PWA - Service Worker actif.");
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage('SKIP_WAITING');
            }
          });
        });

        reg.update();
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update();
            if (Date.now() - lastAutoCheckTime > 60 * 1000) {
              verifierMisesAJourGit(false);
            }
          }
        });
      })
      .catch(err => console.log('Erreur Service Worker:', err));
  }

  // Vérification automatique des mises à jour sur Git au lancement
  setTimeout(() => verifierMisesAJourGit(false), 2000);
});
