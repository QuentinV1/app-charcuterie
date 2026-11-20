// État global, persistance localStorage, sécurité iOS & synchronisation Firestore
import { CATALOGUE_BASE, PARAMETRES_DEFAUT, INGREDIENTS_CATALOGUE_DEFAUT } from './catalog.js';
import { exporterToutesPhotosIDB, importerPhotosIDB } from './photos.js';
import {
  estConnecteFirebase, seedRecettesBaseSiVide, demarrerSyncFirestore, syncAllUserDataToFirestore
} from './firebase.js';

export const STORAGE_KEY = 'laffinoir_data_v2';

export const cloudState = {
  baseRecipes: [],
  userRecipes: [],
  sharedRecipes: [],
  initialSyncDone: false
};

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
  if (!skipCloud && !_suppressCloudSync && estConnecteFirebase()) {
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(() => {
      syncAllUserDataToFirestore(appState).catch(err => console.warn('Sync Firestore:', err));
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
  await seedRecettesBaseSiVide();

  const collectionMap = {
    projects: 'projets',
    courses: 'courses',
    commandes: 'commandes',
    clients: 'clients',
    cave_releves: 'caveReleves',
    evaluations: 'evaluations'
  };

  let firstSnapshots = 0;
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
    onCollectionUpdate: (colName, list) => {
      const stateKey = collectionMap[colName];
      if (!stateKey) return;
      _suppressCloudSync = true;
      // Si l'utilisateur vient de se connecter et que Firestore est vide mais qu'il a des données locales, pousser le local
      if (!cloudState.initialSyncDone && list.length === 0 && (appState[stateKey] || []).length > 0) {
        _suppressCloudSync = false;
        sauvegarderDonnees(false);
        return;
      }
      appState[stateKey] = list;
      if (stateKey === 'projets') migrerLotsPesees(appState.projets);
      sauvegarderDonnees(true);
      _suppressCloudSync = false;
      firstSnapshots++;
      if (firstSnapshots >= 6) cloudState.initialSyncDone = true;
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
    }
  });
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
