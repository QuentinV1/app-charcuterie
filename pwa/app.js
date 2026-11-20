// L'Affinoir - Point d'entrée modulaire ES6 (PWA iPhone & Web)
import {
  appState, uiState, cloudState, chargerDonnees, initialiserDonneesDefaut, sauvegarderDonnees,
  getValeurParametre, verifierPersistanceStockage, exporterDonnees, importerDonnees, reinitialiserDonnees,
  activerSyncCloud, forcerSyncCloud, reinitialiserEtatCloud
} from './modules/state.js';
import {
  observerAuth, getFirebaseUser, connexionEmail, inscriptionEmail, connexionGoogle, deconnexionFirebase
} from './modules/firebase.js';
import {
  ajouterPhotosEtapePWA, ouvrirApercuPhotoEtape, supprimerPhotoEtapePWA
} from './modules/photos.js';
import {
  ouvrirModalPeseeLotProjet, calculerPeseeModal, confirmerEnregistrementPesee,
  supprimerPeseeHistorique, ouvrirModalAjouterLotProjet, confirmerAjoutLotProjet
} from './modules/pesees.js';
import {
  rendreJournalCave, ajouterReleveCave, supprimerReleveCave, setCaveMetrique
} from './modules/cave.js';
import {
  ouvrirModalEvaluationProjet, sauvegarderEvaluationModal
} from './modules/evaluation.js';
import {
  rendreProjets, masquerGuideDebutant, ouvrirDetailProjet, basculerSousOngletProjet, rendrePlanningProjet,
  decalerEtapePWA, demarrerEtapeMaintenantPWA, ouvrirModalHoraireEtape, confirmerHoraireEtape,
  basculerEtapeProjetActuel, basculerStatutProjetActuel, supprimerProjetActuel,
  rendreProductionProjet, enregistrerSortieReelle, ouvrirModalSortieDecoupe, sauvegarderSortieDecoupe,
  ouvrirModalModifierLot, sauvegarderLotModifie, ouvrirModalAmeliorerRecette, confirmerAmeliorerRecette,
  rendreBudgetProjet, basculerReventeProjetActuel, ouvrirModalBudgetPrix, sauvegarderBudgetPrix,
  ouvrirModalCommandePourProjetActuel
} from './modules/projets.js';
import {
  rendreRecettes, setFamilleFiltre, basculerAfficherMasquees, filtrerRecettes,
  ouvrirFicheRecette, basculerMasquageDepuisFiche, basculerMasquageRecetteDirect, planifierDepuisFiche,
  supprimerRecetteDirect, supprimerRecetteDepuisFiche, supprimerRecetteParId,
  ouvrirModalEditRecetteItem, sauvegarderEditRecetteItem, ouvrirModalAjouterVariantePourRecette,
  ouvrirModalPartageRecette, ajouterPartageEmailRecette, supprimerPartageEmailRecette,
  ouvrirModalCreerRecette, ajouterLigneIngredient, ajouterLigneVarianteCreer, ajouterLigneEtape, sauvegarderRecettePersonnalisee
} from './modules/recettes.js';
import {
  ouvrirModalPlanifier, definirDatePlanificationShortcut, selectionnerRecetteDropdown, rendreLignesLotsPlanification,
  modifierLotDraftPlanification, ajouterLigneLotPlanification, confirmerCustomLotPlanification, supprimerLigneLotPlanification,
  actualiserEstimationPlanification, modifierPrixReventePlanification, confirmerPlanification, togglePlanRecetteDropdown,
  ouvrirPlanRecetteDropdown, fermerPlanRecetteDropdown, filtrerCategorieDropdown,
  effacerRechercheRecettes, filtrerRecettesDropdown, selectionnerModeSalage
} from './modules/planification.js';
import {
  rendreCourses, setCoursesModeVue, basculerAchatCourse, basculerAchatGroupeCourses, nettoyerCoursesAchetees, ouvrirModalModifierCourse,
  sauvegarderCourseModifiee, supprimerCourseActuelle, ouvrirModalAjoutCourseManuel, confirmerAjoutCourseManuel
} from './modules/courses.js';
import {
  rendreRevente, basculerPaiementCommande, basculerLivraisonCommande, supprimerCommande,
  ouvrirModalNouvelleCommande, ouvrirModalModifierCommande, rendreLignesCommandeModal, ajouterLigneCommandeModal,
  modifierLigneCommandeModal, supprimerLigneCommandeModal, recalculerTotalCommandeModal, mettreAJourProduitsDepuisProjetModal,
  remplirSuggestionsClientsModal, sauvegarderCommandeModal, rendreClients,
  ouvrirModalClient, ouvrirModalModifierClient, sauvegarderClientModal, supprimerClient
} from './modules/revente.js';
import {
  basculerSousOngletParametres, rendreParametres, ouvrirModalModifierParam, sauvegarderParametreModal,
  initialiserSelectRecettesLotsParam, rendreLotsParametrage, ouvrirModalAjouterVariante,
  ouvrirModalModifierVariante, sauvegarderVarianteModal, supprimerVariante
} from './modules/parametres.js';

let isRestoringHistory = false;
let ignoreNextPopstate = false;

export function naviguerVers(vueId, options = {}) {
  const prevView = document.querySelector('.view.active')?.id?.replace('view-', '') || null;

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

  if (!options.fromPopstate && !isRestoringHistory && window.history?.pushState) {
    const state = {
      view: vueId,
      projetId: vueId === 'projet-detail' ? (uiState.projetActuelId || null) : null
    };
    if (options.replaceHistory) {
      window.history.replaceState(state, '', `#${vueId}`);
    } else if (vueId !== prevView || (vueId === 'projet-detail' && state.projetId !== window.history.state?.projetId)) {
      window.history.pushState(state, '', `#${vueId}`);
    }
  }
}

function initialiserNavigationRetour() {
  if (!window.history?.pushState) return;

  const observer = new MutationObserver(() => {
    const hasOpenModal = !!document.querySelector('.modal-overlay.active');
    if (hasOpenModal) {
      if (!window.history.state?.modal) {
        window.history.pushState(
          { ...(window.history.state || { view: 'projets' }), modal: true },
          '',
          window.location.hash || '#projets'
        );
      }
    } else if (window.history.state?.modal) {
      ignoreNextPopstate = true;
      window.history.back();
    }
  });

  document.querySelectorAll('.modal-overlay').forEach(modal => {
    observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
  });

  window.addEventListener('popstate', (e) => {
    if (ignoreNextPopstate) {
      ignoreNextPopstate = false;
      return;
    }

    if (document.querySelector('.modal-overlay.active')) {
      fermerModals();
      return;
    }

    const targetView = e.state?.view;
    if (targetView) {
      isRestoringHistory = true;
      try {
        if (targetView === 'projet-detail' && e.state.projetId && appState.projets?.some(p => p.id === e.state.projetId)) {
          ouvrirDetailProjet(e.state.projetId);
        } else {
          naviguerVers(targetView === 'projet-detail' ? 'projets' : targetView, { fromPopstate: true });
        }
      } finally {
        isRestoringHistory = false;
      }
    } else {
      const currentView = document.querySelector('.view.active')?.id?.replace('view-', '');
      if (currentView && currentView !== 'projets') {
        naviguerVers('projets', { replaceHistory: true });
      }
    }
  });
}

export function initialiserTheme() {
  const saved = localStorage.getItem('laffinoir-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved ? (saved === 'dark') : prefersDark;
  appliquerTheme(isDark);
}

export function basculerTheme() {
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('laffinoir-theme', !isDark ? 'dark' : 'light');
  appliquerTheme(!isDark);
}

const SVG_SUN = '<svg class="btn-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
const SVG_MOON = '<svg class="btn-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
const SVG_CLOUD = '<svg class="btn-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>';
const SVG_USER = '<svg class="btn-svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

export function appliquerTheme(isDark) {
  document.body.classList.toggle('dark-mode', isDark);
  document.body.classList.toggle('light-mode', !isDark);
  const btn = document.getElementById('btn-theme-toggle');
  if (btn) {
    const iconSvg = isDark ? SVG_SUN : SVG_MOON;
    const text = isDark ? 'Clair' : 'Cave';
    btn.innerHTML = `${iconSvg}<span class="btn-text">${text}</span>`;
    btn.title = isDark ? 'Passer en mode clair' : 'Passer en mode Cave';
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

// === SYSTÈME DE MISE À JOUR AUTOMATIQUE VIA GIT (PWA) ===
const CURRENT_APP_VERSION = '1.3.0';
const GITHUB_REPO = 'QuentinV1/app-charcuterie';
const UPDATE_DISMISSED_KEY = 'laffinoir_update_dismissed';
const DEFAULT_STANDALONE_URL = `https://github.com/${GITHUB_REPO}/raw/main/pwa/laffinoir-standalone.html`;

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
    return {
      version: version.startsWith('v') ? version : `v${version}`,
      notes: (rel.body || '').trim() || 'Nouvelle version publiée sur GitHub Releases.',
      standaloneUrl: DEFAULT_STANDALONE_URL,
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
      standaloneUrl: data.standaloneUrl || DEFAULT_STANDALONE_URL,
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
      standaloneUrl: data.standaloneUrl || DEFAULT_STANDALONE_URL,
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

export function telechargerStandaloneDepuisGit() {
  let targetUrl = latestUpdateData?.standaloneUrl || DEFAULT_STANDALONE_URL;
  if (!isTrustedGitUrl(targetUrl)) {
    targetUrl = DEFAULT_STANDALONE_URL;
  }
  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}

export function rafraichirVueActive() {
  const active = document.querySelector('.view.active');
  if (!active) return;
  const id = active.id.replace('view-', '');
  if (id === 'projets') rendreProjets();
  else if (id === 'projet-detail') {
    const p = appState.projets.find(x => x.id === uiState.projetActuelId);
    if (p) {
      const activeTab = document.querySelector('#view-projet-detail .sub-tab.active');
      if (activeTab?.id === 'tab-btn-production') rendreProductionProjet(p);
      else if (activeTab?.id === 'tab-btn-budget') rendreBudgetProjet(p);
      else rendrePlanningProjet(p);
    }
  }
  else if (id === 'recettes') rendreRecettes();
  else if (id === 'courses') rendreCourses();
  else if (id === 'cave') rendreJournalCave();
  else if (id === 'revente') rendreRevente();
  else if (id === 'clients') rendreClients();
  else if (id === 'parametres') rendreParametres();
  mettreAJourBadgeCourses();
}

export function ouvrirModalAuth() {
  const errEl = document.getElementById('auth-error-msg');
  if (errEl) errEl.style.display = 'none';
  const syncErrEl = document.getElementById('auth-sync-error-msg');
  if (syncErrEl) syncErrEl.style.display = 'none';

  const user = getFirebaseUser();
  const loggedOutPanel = document.getElementById('auth-logged-out-panel');
  const loggedInPanel = document.getElementById('auth-logged-in-panel');

  if (user && loggedOutPanel && loggedInPanel) {
    loggedOutPanel.style.display = 'none';
    loggedInPanel.style.display = 'block';
    const emailEl = document.getElementById('auth-connected-email');
    if (emailEl) emailEl.textContent = user.email || user.displayName || user.uid;
    majStatutSyncModal();
  } else if (loggedOutPanel && loggedInPanel) {
    loggedOutPanel.style.display = 'block';
    loggedInPanel.style.display = 'none';
  }

  document.getElementById('modal-auth')?.classList.add('active');
}

function majStatutSyncModal() {
  const statusEl = document.getElementById('auth-sync-status');
  const syncErrEl = document.getElementById('auth-sync-error-msg');
  if (!statusEl) return;

  if (cloudState.syncStatus === 'syncing') {
    statusEl.textContent = 'Synchronisation en cours…';
    statusEl.style.color = 'var(--accent)';
  } else if (cloudState.syncStatus === 'error') {
    statusEl.textContent = 'Erreur de synchronisation';
    statusEl.style.color = 'var(--danger)';
    if (syncErrEl && cloudState.syncError) {
      syncErrEl.textContent = cloudState.syncError;
      syncErrEl.style.display = 'block';
    }
  } else if (cloudState.initialSyncDone || cloudState.syncStatus === 'synced') {
    const nbProj = (appState.projets || []).length;
    statusEl.textContent = `Synchronisé (${nbProj} session${nbProj > 1 ? 's' : ''} en cours)`;
    statusEl.style.color = 'var(--secondary)';
  } else {
    statusEl.textContent = 'Connexion au Cloud…';
    statusEl.style.color = 'var(--text-muted)';
  }
}

export async function synchroniserMaintenant() {
  const btn = document.getElementById('btn-force-sync');
  const syncErrEl = document.getElementById('auth-sync-error-msg');
  if (syncErrEl) syncErrEl.style.display = 'none';
  if (btn) btn.disabled = true;
  majStatutSyncModal();
  try {
    await forcerSyncCloud();
    majStatutSyncModal();
  } catch (e) {
    majStatutSyncModal();
    if (syncErrEl) {
      syncErrEl.textContent = e?.message || 'Impossible de synchroniser.';
      syncErrEl.style.display = 'block';
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

export async function soumettreAuthEmail(isRegister) {
  const email = document.getElementById('auth-email')?.value || '';
  const pwd = document.getElementById('auth-password')?.value || '';
  const errEl = document.getElementById('auth-error-msg');
  if (errEl) errEl.style.display = 'none';
  try {
    if (isRegister) await inscriptionEmail(email, pwd);
    else await connexionEmail(email, pwd);
    fermerModals();
  } catch (e) {
    if (errEl) {
      errEl.textContent = e.message || 'Erreur de connexion.';
      errEl.style.display = 'block';
    }
  }
}

export async function soumettreAuthGoogle() {
  const errEl = document.getElementById('auth-error-msg');
  if (errEl) errEl.style.display = 'none';
  try {
    await connexionGoogle();
    fermerModals();
  } catch (e) {
    if (errEl) {
      errEl.textContent = e.message || 'Erreur de connexion Google.';
      errEl.style.display = 'block';
    }
  }
}

export async function deconnexionCloud() {
  if (!confirm('Se déconnecter du compte Cloud ?')) return;
  await deconnexionFirebase();
  reinitialiserEtatCloud();
  fermerModals();
  rafraichirVueActive();
}

// Exposer sur window pour les handlers inline du HTML (onclick, oninput, onchange)
Object.assign(window, {
  rafraichirVueActive,
  ouvrirModalAuth,
  synchroniserMaintenant,
  soumettreAuthEmail,
  soumettreAuthGoogle,
  deconnexionCloud,
  ouvrirModalPartageRecette,
  ajouterPartageEmailRecette,
  supprimerPartageEmailRecette,
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
  telechargerStandaloneDepuisGit,
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
  confirmerAjoutLotProjet,
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
  masquerGuideDebutant,
  ouvrirDetailProjet,
  basculerSousOngletProjet,
  rendrePlanningProjet,
  decalerEtapePWA,
  demarrerEtapeMaintenantPWA,
  ouvrirModalHoraireEtape,
  confirmerHoraireEtape,
  basculerEtapeProjetActuel,
  basculerStatutProjetActuel,
  supprimerProjetActuel,
  rendreProductionProjet,
  enregistrerSortieReelle,
  ouvrirModalSortieDecoupe,
  sauvegarderSortieDecoupe,
  ouvrirModalModifierLot,
  sauvegarderLotModifie,
  ouvrirModalAmeliorerRecette,
  confirmerAmeliorerRecette,
  rendreBudgetProjet,
  basculerReventeProjetActuel,
  ouvrirModalBudgetPrix,
  sauvegarderBudgetPrix,
  ouvrirModalCommandePourProjetActuel,
  // Recettes
  rendreRecettes,
  setFamilleFiltre,
  basculerAfficherMasquees,
  filtrerRecettes,
  ouvrirFicheRecette,
  basculerMasquageDepuisFiche,
  basculerMasquageRecetteDirect,
  planifierDepuisFiche,
  supprimerRecetteDirect,
  supprimerRecetteDepuisFiche,
  supprimerRecetteParId,
  ouvrirModalEditRecetteItem,
  sauvegarderEditRecetteItem,
  ouvrirModalAjouterVariantePourRecette,
  ouvrirModalCreerRecette,
  ajouterLigneIngredient,
  ajouterLigneVarianteCreer,
  ajouterLigneEtape,
  sauvegarderRecettePersonnalisee,
  // Planification
  ouvrirModalPlanifier,
  definirDatePlanificationShortcut,
  selectionnerRecetteDropdown,
  rendreLignesLotsPlanification,
  modifierLotDraftPlanification,
  ajouterLigneLotPlanification,
  confirmerCustomLotPlanification,
  supprimerLigneLotPlanification,
  actualiserEstimationPlanification,
  modifierPrixReventePlanification,
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
  setCoursesModeVue,
  basculerAchatCourse,
  basculerAchatGroupeCourses,
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
  ouvrirModalModifierCommande,
  rendreLignesCommandeModal,
  ajouterLigneCommandeModal,
  modifierLigneCommandeModal,
  supprimerLigneCommandeModal,
  recalculerTotalCommandeModal,
  mettreAJourProduitsDepuisProjetModal,
  remplirSuggestionsClientsModal,
  sauvegarderCommandeModal,
  rendreClients,
  ouvrirModalClient,
  ouvrirModalModifierClient,
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
  initialiserNavigationRetour();
  naviguerVers('projets', { replaceHistory: true });

  observerAuth(async (user) => {
    const btnAuth = document.getElementById('btn-auth-header');
    if (btnAuth) {
      if (user) {
        const label = (user.email || user.displayName || 'Cloud').split('@')[0];
        btnAuth.innerHTML = SVG_USER;
        const textSpan = document.createElement('span');
        textSpan.className = 'btn-text';
        textSpan.textContent = label;
        btnAuth.appendChild(textSpan);
        btnAuth.classList.add('is-authenticated');
        btnAuth.title = `Connecté : ${user.email || user.uid}`;
      } else {
        btnAuth.innerHTML = `${SVG_CLOUD}<span class="btn-text">Connexion</span>`;
        btnAuth.classList.remove('is-authenticated');
        btnAuth.title = 'Se connecter au Cloud';
      }
    }
    if (user) {
      await activerSyncCloud();
    }
    rafraichirVueActive();
  });

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
