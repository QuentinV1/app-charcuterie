// État global, persistance localStorage, sécurité iOS & synchronisation Firestore
import { CATALOGUE_BASE, PARAMETRES_DEFAUT, INGREDIENTS_CATALOGUE_DEFAUT } from './catalog.js';
import { exporterToutesPhotosIDB, importerPhotosIDB, synchroniserPhotosCloud } from './photos.js';
import {
  estConnecteFirebase, getFirebaseUser, seedRecettesBaseSiVide, demarrerSyncFirestore, syncAllUserDataToFirestore
} from './firebase.js';

export const STORAGE_KEY = 'laffinoir_data_v2';
const LAST_UID_KEY = 'laffinoir_last_uid';

export const cloudState = {
  baseRecipes: [],
  userRecipes: [],
  sharedRecipes: [],
  initialSyncDone: false,
  syncedCols: {},
  syncStatus: 'idle', // 'idle' | 'syncing' | 'synced' | 'error'
  syncError: null,
  lastSyncedAt: null
};

export function reinitialiserEtatCloud() {
  cloudState.initialSyncDone = false;
  cloudState.syncedCols = {};
  cloudState.syncStatus = 'idle';
  cloudState.syncError = null;
  cloudState.lastSyncedAt = null;
}

let _suppressCloudSync = false;
let _syncTimer = null;

export let appState = {
  recettes: JSON.parse(JSON.stringify(CATALOGUE_BASE)),
  recettesSupprimees: [],
  parametres: JSON.parse(JSON.stringify(PARAMETRES_DEFAUT)),
  ingredientsCatalogue: JSON.parse(JSON.stringify(INGREDIENTS_CATALOGUE_DEFAUT)),
  projets: [],
  courses: [],
  commandes: [],
  clients: [],
  caveReleves: [],
  evaluations: [],
  lastBackupAt: null
};

export const uiState = {
  projetActuelId: null,
  filtreFamilleCourant: 'Toutes',
  afficherMasquees: false,
  dropdownRecetteSelectionneeId: 'VALORISATION_CANARD',
  dropdownFiltreCat: 'Toutes',
  storagePersisted: null
};

export function getValeurParametre(cle, defaut = 0) {
  if (!appState.parametres) return defaut;
  const p = appState.parametres.find(x => x.cle === cle);
  return p ? p.valeur : defaut;
}

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeJsStr(str) {
  if (str === null || str === undefined) return '';
  const js = String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
  return escapeHtml(js);
}

const SVG_ICONS = {
  'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  'award': '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
  'calendar': '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
  'camera': '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  'circle-danger': '<circle cx="12" cy="12" r="7" fill="#DC2626" stroke="#DC2626"/>',
  'circle-success': '<circle cx="12" cy="12" r="7" fill="#236B48" stroke="#236B48"/>',
  'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'cloud': '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  'droplet': '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  'eye': '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
  'file-text': '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/>',
  'flame': '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  'leaf': '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  'lightbulb': '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  'moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  'package': '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  'play': '<polygon points="6 3 20 12 6 21 6 3"/>',
  'salt': '<path d="M12 2v4"/><path d="M6.5 8h11l1.5 12H5L6.5 8z"/><path d="M9.5 13h.01"/><path d="M14.5 13h.01"/><path d="M12 16h.01"/>',
  'scale': '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  'share': '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
  'shopping-cart': '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  'smartphone': '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  'sparkles': '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
  'star': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  'star-filled': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#D97706" stroke="#D97706"/>',
  'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  'thermometer': '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
  'thumbs-up': '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/>',
  'trash': '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  'utensils': '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  'wine': '<path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/>'
};

export function svgIcon(name, size = 15, extraClass = '') {
  const inner = SVG_ICONS[name];
  if (!inner) return '';
  const cls = extraClass ? `icon-inline ${extraClass}` : 'icon-inline';
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

export function migrerLotsPesees(projets) {
  if (!Array.isArray(projets)) return;
  projets.forEach(p => {
    if (!Array.isArray(p.lots)) return;
    p.lots.forEach(lot => {
      if (!Array.isArray(lot.historiquePesees)) {
        lot.historiquePesees = [];
        if (lot.poidsInitialGrammes > 0 && lot.poidsActuelGrammes > 0) {
          const perte = ((lot.poidsInitialGrammes - lot.poidsActuelGrammes) / lot.poidsInitialGrammes) * 100;
          lot.historiquePesees.push({
            id: 'pes_init_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            date: p.dateDebut || new Date().toISOString().slice(0, 10),
            poidsGrammes: lot.poidsActuelGrammes,
            pertePct: Number(perte.toFixed(1)),
            note: lot.commentaire || 'Pesée importée'
          });
        }
      }
    });
  });
}

export function chargerDonnees() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(appState, parsed);
      if (!Array.isArray(appState.recettesSupprimees)) appState.recettesSupprimees = [];
      if (!Array.isArray(appState.recettes)) appState.recettes = [];

      CATALOGUE_BASE.forEach(baseRec => {
        const recId = baseRec.id || baseRec.code;
        if (appState.recettesSupprimees.includes(recId)) return;
        const exist = appState.recettes.find(r => r.id === baseRec.id || r.code === baseRec.code);
        if (!exist) {
          appState.recettes.push(JSON.parse(JSON.stringify(baseRec)));
        } else {
          if (!exist.sortiesDecoupe) exist.sortiesDecoupe = baseRec.sortiesDecoupe;
          if (!exist.variantes) exist.variantes = baseRec.variantes;
        }
      });

      if (!Array.isArray(appState.parametres) || appState.parametres.length === 0) {
        appState.parametres = JSON.parse(JSON.stringify(PARAMETRES_DEFAUT));
      } else {
        PARAMETRES_DEFAUT.forEach(defP => {
          if (!appState.parametres.find(p => p.cle === defP.cle)) {
            appState.parametres.unshift(JSON.parse(JSON.stringify(defP)));
          }
        });
      }
      if (!Array.isArray(appState.projets)) appState.projets = [];
      if (!Array.isArray(appState.courses)) appState.courses = [];
      if (!Array.isArray(appState.commandes)) appState.commandes = [];
      if (!Array.isArray(appState.clients)) appState.clients = [];
      if (!Array.isArray(appState.caveReleves)) appState.caveReleves = [];
      if (!Array.isArray(appState.evaluations)) appState.evaluations = [];
      if (appState.lastBackupAt === undefined) appState.lastBackupAt = null;

      appState.projets = appState.projets.filter(p => p.id && !String(p.id).includes('demo') && !(p.nom || '').includes('(Exemple)'));
      appState.courses = appState.courses.filter(c => !c.projetId || !String(c.projetId).includes('demo'));
      migrerLotsPesees(appState.projets);
    } catch (e) {
      console.error('Erreur chargement localStorage:', e);
      initialiserDonneesDefaut();
    }
  } else {
    initialiserDonneesDefaut();
  }
}

export function initialiserDonneesDefaut() {
  appState = {
    recettes: JSON.parse(JSON.stringify(CATALOGUE_BASE)),
    recettesSupprimees: [],
    parametres: JSON.parse(JSON.stringify(PARAMETRES_DEFAUT)),
    ingredientsCatalogue: JSON.parse(JSON.stringify(INGREDIENTS_CATALOGUE_DEFAUT)),
    projets: [],
    courses: [],
    commandes: [],
    clients: [],
    caveReleves: [],
    evaluations: [],
    lastBackupAt: null
  };
  sauvegarderDonnees();
}

let _quotaAlertShown = false;
export function sauvegarderDonnees(skipCloud = false) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.error('Erreur sauvegarde localStorage:', e);
    if (!_quotaAlertShown && (e.name === 'QuotaExceededError' || e.code === 22)) {
      _quotaAlertShown = true;
      alert('Attention : espace de stockage local saturé. Exportez une sauvegarde JSON dans Réglages pour éviter toute perte de données.');
    }
  }
  if (typeof window.mettreAJourBadgeCourses === 'function') {
    window.mettreAJourBadgeCourses();
  }
  if (!skipCloud && !_suppressCloudSync && estConnecteFirebase() && cloudState.initialSyncDone) {
    clearTimeout(_syncTimer);
    cloudState.syncStatus = 'syncing';
    cloudState.syncError = null;
    _syncTimer = setTimeout(async () => {
      try {
        await syncAllUserDataToFirestore(appState);
        cloudState.syncStatus = 'synced';
        cloudState.lastSyncedAt = new Date().toISOString();
      } catch (err) {
        console.warn('Sync Firestore:', err);
        cloudState.syncStatus = 'error';
        cloudState.syncError = err?.message || 'Erreur de synchronisation Firestore';
      }
    }, 450);
  }
}

export function reconstruireCatalogueFusionne() {
  const userByBaseId = new Map();
  (cloudState.userRecipes || []).forEach(u => {
    if (u.baseRecipeId) userByBaseId.set(u.baseRecipeId, u);
  });

  const supprimees = new Set(appState.recettesSupprimees || []);
  const result = [];

  (cloudState.baseRecipes || []).forEach(baseRec => {
    const baseId = baseRec.id || baseRec.code;
    if (userByBaseId.has(baseId)) return; // La version modifiée par l'utilisateur prévaut
    if (supprimees.has(baseId)) return;
    result.push({ ...baseRec, _source: 'base' });
  });

  (cloudState.userRecipes || []).forEach(uRec => {
    result.push({ ...uRec, _source: 'user' });
  });

  (cloudState.sharedRecipes || []).forEach(sRec => {
    result.push({ ...sRec, _source: 'shared' });
  });

  if (result.length > 0 || cloudState.baseRecipes.length > 0) {
    appState.recettes = result;
    sauvegarderDonnees(true);
    if (typeof window.rafraichirVueActive === 'function') {
      window.rafraichirVueActive();
    }
  }
}

export async function activerSyncCloud() {
  if (!estConnecteFirebase()) return;
  reinitialiserEtatCloud();
  cloudState.syncStatus = 'syncing';
  try {
    await seedRecettesBaseSiVide();
  } catch (err) {
    console.warn('Seed recettes base:', err);
  }

  const user = getFirebaseUser();
  const currentUid = user ? user.uid : null;
  const previousUid = localStorage.getItem(LAST_UID_KEY);
  const isNewDeviceLogin = !!(currentUid && previousUid !== currentUid);
  let needsPushAfterInit = false;

  const collectionMap = {
    projects: 'projets',
    courses: 'courses',
    commandes: 'commandes',
    clients: 'clients',
    cave_releves: 'caveReleves',
    evaluations: 'evaluations'
  };

  demarrerSyncFirestore({
    onBaseRecipes: (list) => {
      cloudState.baseRecipes = list;
      reconstruireCatalogueFusionne();
    },
    onUserRecipes: (list) => {
      cloudState.userRecipes = list;
      reconstruireCatalogueFusionne();
    },
    onSharedRecipes: (list) => {
      cloudState.sharedRecipes = list;
      reconstruireCatalogueFusionne();
    },
    onCollectionUpdate: (colName, list, fromCache = false) => {
      const stateKey = collectionMap[colName];
      if (!stateKey) return;

      // Ne jamais traiter un cache local vide comme un serveur vide
      if (fromCache && list.length === 0) {
        return;
      }

      const isFirstServerForCol = !fromCache && !cloudState.syncedCols[colName];
      const localItems = appState[stateKey] || [];

      if (isFirstServerForCol) {
        cloudState.syncedCols[colName] = true;

        if (list.length === 0 && localItems.length > 0) {
          // Serveur réellement vide et données locales présentes : pousser vers le cloud après init complète
          needsPushAfterInit = true;
        } else if (list.length > 0 && localItems.length > 0 && isNewDeviceLogin) {
          // Première connexion sur cet appareil : fusionner serveur + éléments locaux absents du serveur
          const serverIds = new Set(list.map(i => String(i.id)));
          const localOnly = localItems.filter(i => i && i.id && !serverIds.has(String(i.id)));
          const merged = [...list, ...localOnly];
          _suppressCloudSync = true;
          appState[stateKey] = merged;
          if (stateKey === 'projets') migrerLotsPesees(appState.projets);
          sauvegarderDonnees(true);
          _suppressCloudSync = false;
          if (localOnly.length > 0) {
            needsPushAfterInit = true;
          }
        } else {
          _suppressCloudSync = true;
          appState[stateKey] = list;
          if (stateKey === 'projets') migrerLotsPesees(appState.projets);
          sauvegarderDonnees(true);
          _suppressCloudSync = false;
        }

        if (Object.keys(cloudState.syncedCols).length >= 6) {
          cloudState.initialSyncDone = true;
          cloudState.syncStatus = 'synced';
          cloudState.lastSyncedAt = new Date().toISOString();
          if (currentUid) localStorage.setItem(LAST_UID_KEY, currentUid);
          if (needsPushAfterInit) {
            needsPushAfterInit = false;
            sauvegarderDonnees(false);
          }
          synchroniserPhotosCloud();
        }
      } else {
        _suppressCloudSync = true;
        appState[stateKey] = list;
        if (stateKey === 'projets') migrerLotsPesees(appState.projets);
        sauvegarderDonnees(true);
        _suppressCloudSync = false;
      }

      if (typeof window.rafraichirVueActive === 'function') {
        window.rafraichirVueActive();
      }
    },
    onSettingsUpdate: (data) => {
      _suppressCloudSync = true;
      if (Array.isArray(data.parametres) && data.parametres.length > 0) {
        appState.parametres = data.parametres;
      }
      if (Array.isArray(data.recettesSupprimees)) {
        appState.recettesSupprimees = data.recettesSupprimees;
      }
      if (data.lastBackupAt !== undefined) {
        appState.lastBackupAt = data.lastBackupAt;
      }
      sauvegarderDonnees(true);
      _suppressCloudSync = false;
      reconstruireCatalogueFusionne();
    },
    onSyncError: (err) => {
      cloudState.syncStatus = 'error';
      if (err?.code === 'permission-denied') {
        cloudState.syncError = 'Accès Firestore refusé (vérifiez que votre e-mail est bien vérifié et autorisé).';
      } else {
        cloudState.syncError = err?.message || 'Erreur de synchronisation Firestore';
      }
    }
  });
}

export async function forcerSyncCloud() {
  if (!estConnecteFirebase()) throw new Error('Non connecté au Cloud.');
  cloudState.syncStatus = 'syncing';
  cloudState.syncError = null;
  try {
    await syncAllUserDataToFirestore(appState);
    await synchroniserPhotosCloud();
    cloudState.syncStatus = 'synced';
    cloudState.lastSyncedAt = new Date().toISOString();
    const user = getFirebaseUser();
    if (user?.uid) localStorage.setItem(LAST_UID_KEY, user.uid);
    return true;
  } catch (err) {
    cloudState.syncStatus = 'error';
    cloudState.syncError = err?.message || 'Erreur de synchronisation Firestore';
    throw err;
  }
}

/**
 * Sécurité du stockage iOS / Safari & alerte de sauvegarde préventive.
 */
export async function verifierPersistanceStockage() {
  let persisted = false;
  let supported = false;
  if (navigator.storage && navigator.storage.persist) {
    supported = true;
    try {
      const already = await navigator.storage.persisted();
      persisted = already || (await navigator.storage.persist());
    } catch (e) {
      console.warn('navigator.storage.persist erreur:', e);
    }
  }
  uiState.storagePersisted = persisted;

  const now = Date.now();
  const lastBackup = appState.lastBackupAt ? new Date(appState.lastBackupAt).getTime() : 0;
  const daysSinceBackup = lastBackup ? Math.floor((now - lastBackup) / (1000 * 60 * 60 * 24)) : null;

  return { supported, persisted, daysSinceBackup };
}

export async function exporterDonnees() {
  const photos = await exporterToutesPhotosIDB();
  appState.lastBackupAt = new Date().toISOString();
  sauvegarderDonnees();

  const payload = {
    schemaVersion: 2,
    exportedAt: appState.lastBackupAt,
    source: 'L_AFFINOIR_PWA',
    ...appState,
    photos
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `laffinoir_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function millisToIsoDate(ms, fullIso = false) {
  if (!ms) return '';
  const d = new Date(Number(ms));
  if (Number.isNaN(d.getTime())) return '';
  return fullIso ? d.toISOString() : d.toISOString().slice(0, 10);
}

function normaliserBackupAndroid(data) {
  const out = {};

  // 1. Paramètres (fusionnés sur les paramètres existants pour préserver les défauts PWA)
  if (Array.isArray(data.parametres)) {
    const mapParams = new Map((appState.parametres || []).map(p => [p.cle, { ...p }]));
    data.parametres.forEach(p => {
      if (p && p.cle) mapParams.set(p.cle, { ...(mapParams.get(p.cle) || {}), ...p });
    });
    out.parametres = Array.from(mapParams.values());
  }

  // 2. Recettes (aplatissement { recette, ingredients, etapes, variantes, sortiesDecoupe })
  const recetteIdMap = {};
  const mapRecettes = new Map((appState.recettes || []).map(r => [r.code || r.id, { ...r }]));
  if (Array.isArray(data.recettes)) {
    data.recettes.forEach((item, idx) => {
      if (!item) return;
      const rec = item.recette ? item.recette : item;
      if (!rec.nom) return;
      const code = rec.code || String(rec.id || `REC_IMP_${idx}`);
      const existante = Array.from(mapRecettes.values()).find(
        x => (code && (x.code === code || x.id === code)) ||
             (x.nom && x.nom.trim().toLowerCase() === rec.nom.trim().toLowerCase())
      );
      const idFinal = existante ? (existante.id || existante.code) : code;
      if (rec.id !== undefined && rec.id !== null) recetteIdMap[String(rec.id)] = idFinal;
      if (rec.code) recetteIdMap[rec.code] = idFinal;

      const flatRec = {
        ...(existante || {}),
        ...rec,
        id: idFinal,
        code: existante?.code || code,
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : (rec.ingredients || existante?.ingredients || []),
        etapes: Array.isArray(item.etapes) ? item.etapes : (rec.etapes || existante?.etapes || []),
        variantes: Array.isArray(item.variantes) ? item.variantes : (rec.variantes || existante?.variantes || []),
        sortiesDecoupe: Array.isArray(item.sortiesDecoupe) ? item.sortiesDecoupe : (rec.sortiesDecoupe || existante?.sortiesDecoupe || [])
      };
      mapRecettes.set(flatRec.code || flatRec.id, flatRec);
    });
    out.recettes = Array.from(mapRecettes.values());
  }

  // 3. Projets (+ lots + historiquePesees + etapes + sortiesDecoupe)
  const projIdMap = {};
  if (Array.isArray(data.projets)) {
    out.projets = data.projets.map((pb, idx) => {
      const rawP = pb && pb.projet ? pb.projet : (pb || {});
      const oldProjId = rawP.id !== undefined && rawP.id !== null ? String(rawP.id) : '';
      const newProjId = oldProjId || `proj_imp_${Date.now()}_${idx}`;
      if (oldProjId) projIdMap[oldProjId] = newProjId;

      const peseesParLot = {};
      (pb.pesees || []).forEach((ps, pIdx) => {
        const lid = String(ps.lotId ?? '');
        if (!peseesParLot[lid]) peseesParLot[lid] = [];
        peseesParLot[lid].push({
          id: ps.id !== undefined ? String(ps.id) : `pes_imp_${idx}_${pIdx}`,
          date: ps.date || millisToIsoDate(ps.dateMillis) || new Date().toISOString().slice(0, 10),
          poidsGrammes: Number(ps.poidsGrammes) || 0,
          note: ps.note || ''
        });
      });

      const lots = (pb.lots || []).map((l, lIdx) => {
        const lid = String(l.id ?? '');
        const pInit = Number(l.poidsInitialGrammes) || 0;
        const hist = (Array.isArray(l.historiquePesees)
          ? l.historiquePesees
          : (peseesParLot[lid] || [])
        ).map(ps => {
          const poids = Number(ps.poidsGrammes) || 0;
          const pertePct = ps.pertePct !== undefined
            ? ps.pertePct
            : (pInit > 0 ? Math.max(0, Number((((pInit - poids) / pInit) * 100).toFixed(1))) : 0);
          return { ...ps, pertePct };
        });
        return {
          ...l,
          id: lid || `lot_imp_${idx}_${lIdx}`,
          historiquePesees: hist
        };
      });

      const etapes = (pb.etapes || []).map(e => ({
        ...e,
        datePrevue: e.datePrevue || millisToIsoDate(e.datePrevueMillis)
      }));

      const mappedRecetteId =
        recetteIdMap[String(rawP.recettePrincipaleId ?? '')] ||
        rawP.recetteId ||
        String(rawP.recettePrincipaleId ?? '');

      return {
        ...rawP,
        id: newProjId,
        recettePrincipaleId: mappedRecetteId,
        dateDebut: rawP.dateDebut || millisToIsoDate(rawP.dateDebutMillis, true) || new Date().toISOString(),
        sortiesDecoupe: Array.isArray(pb.sortiesDecoupe) ? pb.sortiesDecoupe : (rawP.sortiesDecoupe || []),
        lots,
        etapes
      };
    });
  }

  // 4. Courses, Commandes, Clients, Journal de cave, Évaluations
  if (Array.isArray(data.courses)) {
    out.courses = data.courses.map((c, idx) => ({
      ...c,
      id: c.id !== undefined ? String(c.id) : `crs_imp_${idx}`,
      projetId: c.projetId != null ? (projIdMap[String(c.projetId)] ?? String(c.projetId)) : null,
      nom: c.nom || c.nomIngredient || '',
      qte: c.qte ?? c.quantiteRequise ?? 0,
      unite: c.unite || 'g',
      categorie: c.categorie || 'DIVERS',
      prix: c.prix ?? c.prixEstimeTotal ?? 0,
      achete: Boolean(c.achete)
    }));
  }

  if (Array.isArray(data.commandes)) {
    out.commandes = data.commandes.map((cmd, idx) => ({
      ...cmd,
      id: cmd.id !== undefined ? String(cmd.id) : `cmd_imp_${idx}`,
      projetId: cmd.projetId != null ? (projIdMap[String(cmd.projetId)] ?? String(cmd.projetId)) : null,
      nomAcheteur: cmd.nomAcheteur || cmd.client || '',
      client: cmd.client || cmd.nomAcheteur || ''
    }));
  }

  if (Array.isArray(data.clients)) {
    out.clients = data.clients.map((cl, idx) => ({
      ...cl,
      id: cl.id !== undefined ? String(cl.id) : `cli_imp_${idx}`
    }));
  }

  if (Array.isArray(data.caveReleves)) {
    out.caveReleves = data.caveReleves.map((r, idx) => ({
      ...r,
      id: r.id !== undefined ? String(r.id) : `cave_imp_${idx}`,
      date: r.date || millisToIsoDate(r.dateMillis)
    }));
  }

  if (Array.isArray(data.evaluations)) {
    out.evaluations = data.evaluations.map((ev, idx) => ({
      ...ev,
      id: ev.id !== undefined ? String(ev.id) : `eval_imp_${idx}`,
      projetId: ev.projetId != null ? (projIdMap[String(ev.projetId)] ?? String(ev.projetId)) : '',
      recetteId: ev.recetteId != null ? (recetteIdMap[String(ev.recetteId)] ?? String(ev.recetteId)) : '',
      date: ev.date || millisToIsoDate(ev.dateMillis)
    }));
  }

  return out;
}

export function importerDonnees(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data && (Array.isArray(data.recettes) || Array.isArray(data.projets))) {
        const photos = Array.isArray(data.photos) ? data.photos : [];
        const estPayloadAndroid =
          data.source === 'L_AFFINOIR_ANDROID' ||
          (Array.isArray(data.projets) && data.projets.some(p => p && p.projet)) ||
          (Array.isArray(data.recettes) && data.recettes.some(r => r && r.recette));

        const cleanData = estPayloadAndroid ? normaliserBackupAndroid(data) : { ...data };
        if (!estPayloadAndroid) {
          delete cleanData.photos;
          delete cleanData.schemaVersion;
          delete cleanData.exportedAt;
          delete cleanData.source;
        }

        Object.assign(appState, cleanData);
        if (!Array.isArray(appState.recettes)) appState.recettes = JSON.parse(JSON.stringify(CATALOGUE_BASE));
        if (!Array.isArray(appState.recettesSupprimees)) appState.recettesSupprimees = [];
        if (!Array.isArray(appState.parametres)) appState.parametres = JSON.parse(JSON.stringify(PARAMETRES_DEFAUT));
        if (!Array.isArray(appState.caveReleves)) appState.caveReleves = [];
        if (!Array.isArray(appState.evaluations)) appState.evaluations = [];
        if (!Array.isArray(appState.clients)) appState.clients = [];
        if (!Array.isArray(appState.courses)) appState.courses = [];
        if (!Array.isArray(appState.commandes)) appState.commandes = [];
        if (!Array.isArray(appState.projets)) appState.projets = [];
        migrerLotsPesees(appState.projets);
        sauvegarderDonnees();
        if (photos.length > 0) {
          await importerPhotosIDB(photos);
        }
        alert('Données restaurées avec succès !');
        location.reload();
      } else {
        alert('Format de sauvegarde invalide.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la lecture du fichier JSON.');
    }
  };
  reader.readAsText(file);
}

export function reinitialiserDonnees() {
  if (!confirm('Voulez-vous réinitialiser le catalogue avec les 22 recettes par défaut et vider les sessions/courses ?')) return;
  initialiserDonneesDefaut();
  alert('Catalogue réinitialisé.');
  location.reload();
}
