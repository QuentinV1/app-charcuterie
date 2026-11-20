// Intégration Firebase Auth & Cloud Firestore (quentin-apps-hub)
// - charcuterie_base_recipes : recettes de base globales (lisibles par tous, jamais écrasées par les modifs perso)
// - charcuterie_user_recipes : recettes perso & modifications de recettes de base, partageables par email (sharedWithEmails)
// - charcuterie_users/{uid}/... : projets, courses, commandes, clients, cave_releves, evaluations, settings/main (par personne)

import { CATALOGUE_BASE } from './catalog.js';

export const FIREBASE_CONFIG = {
  projectId: 'quentin-apps-hub',
  appId: '1:249016348389:web:59deb2bca6520d029cee0c',
  storageBucket: 'quentin-apps-hub.firebasestorage.app',
  apiKey: 'AIzaSyCuYM0tMpd1f1jDYz27OhCaPpcAWhI3i48',
  authDomain: 'quentin-apps-hub.firebaseapp.com',
  messagingSenderId: '249016348389'
};

let fb = null; // { app, auth, db, mods: { ... } }
let currentUser = null;
let unsubListeners = [];

export function getFirebaseUser() {
  return currentUser;
}

export function estConnecteFirebase() {
  return !!currentUser;
}

export async function initFirebase() {
  if (fb) return fb;
  if (window.location.protocol === 'file:') {
    return null;
  }
  try {
    const [appMod, authMod, fsMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js')
    ]);

    const app = appMod.initializeApp(FIREBASE_CONFIG);
    const auth = authMod.getAuth(app);
    const db = fsMod.initializeFirestore(app, {
      localCache: fsMod.persistentLocalCache({
        tabManager: fsMod.persistentMultipleTabManager()
      }),
      ignoreUndefinedProperties: true
    });

    fb = {
      app,
      auth,
      db,
      authMod,
      fsMod
    };
    return fb;
  } catch (err) {
    console.warn('Firebase SDK indisponible (mode hors-ligne local):', err);
    return null;
  }
}

export function observerAuth(onUserChanged) {
  initFirebase().then((instance) => {
    if (!instance) {
      onUserChanged(null);
      return;
    }
    instance.authMod.onAuthStateChanged(instance.auth, (user) => {
      currentUser = user || null;
      onUserChanged(currentUser);
    });
  });
}

export async function connexionEmail(email, password) {
  const instance = await initFirebase();
  if (!instance) throw new Error('Firebase indisponible hors-ligne.');
  const cred = await instance.authMod.signInWithEmailAndPassword(instance.auth, email.trim(), password);
  return cred.user;
}

export async function inscriptionEmail(email, password) {
  const instance = await initFirebase();
  if (!instance) throw new Error('Firebase indisponible hors-ligne.');
  const cred = await instance.authMod.createUserWithEmailAndPassword(instance.auth, email.trim(), password);
  if (cred.user && instance.authMod.sendEmailVerification) {
    instance.authMod.sendEmailVerification(cred.user).catch(() => {});
  }
  return cred.user;
}

export async function renvoyerEmailVerification() {
  const instance = await initFirebase();
  if (!instance || !instance.auth.currentUser) throw new Error('Aucun utilisateur connecté.');
  if (instance.auth.currentUser.emailVerified) return false;
  await instance.authMod.sendEmailVerification(instance.auth.currentUser);
  return true;
}

export async function rechargerUtilisateurFirebase() {
  const instance = await initFirebase();
  if (!instance || !instance.auth.currentUser) return null;
  await instance.auth.currentUser.reload();
  currentUser = instance.auth.currentUser;
  return currentUser;
}

export async function connexionGoogle() {
  const instance = await initFirebase();
  if (!instance) throw new Error('Firebase indisponible hors-ligne.');
  const provider = new instance.authMod.GoogleAuthProvider();
  const cred = await instance.authMod.signInWithPopup(instance.auth, provider);
  return cred.user;
}

export async function deconnexionFirebase() {
  arreterListenersFirestore();
  if (!fb) return;
  await fb.authMod.signOut(fb.auth);
  currentUser = null;
}

export function arreterListenersFirestore() {
  unsubListeners.forEach(unsub => {
    try { unsub(); } catch {}
  });
  unsubListeners = [];
}

function cleanForFirestore(obj) {
  return JSON.parse(JSON.stringify(obj, (k, v) => (v === undefined ? null : v)));
}

const BASE_RECIPE_FIELDS = [
  'ownerUid', 'nom', 'famille', 'id', 'code', 'typeRecette', 'type',
  'uniteBase', 'unite', 'quantiteDefaut', 'perteCiblePct', 'perteCible',
  'tempCoeurCible', 'conditionsConservation', 'pointsVigilance',
  'description', 'masquee', 'sortiesDecoupe', 'variantes',
  'ingredients', 'etapes', 'versionActuelle', 'historiqueVersions',
  'createdAt', 'updatedAt'
];

function pickRecipeFields(obj, extraFields = []) {
  const allowed = new Set([...BASE_RECIPE_FIELDS, ...extraFields]);
  const out = {};
  for (const key of Object.keys(obj || {})) {
    if (allowed.has(key) && obj[key] !== undefined) {
      out[key] = obj[key];
    }
  }
  return cleanForFirestore(out);
}

// Seed initial des recettes de base si la collection globale est vide
export async function seedRecettesBaseSiVide() {
  if (!fb || !currentUser) return;
  const { collection, getDocs, doc, setDoc, query, limit } = fb.fsMod;
  const snap = await getDocs(query(collection(fb.db, 'charcuterie_base_recipes'), limit(1)));
  if (!snap.empty) return;

  const nowIso = new Date().toISOString();
  for (const r of CATALOGUE_BASE) {
    const id = r.id || r.code;
    await setDoc(doc(fb.db, 'charcuterie_base_recipes', id), pickRecipeFields({
      ...r,
      id,
      ownerUid: currentUser.uid,
      createdAt: nowIso,
      updatedAt: nowIso
    }));
  }
}

// Écoute temps réel de toutes les collections de l'utilisateur + recettes de base + recettes partagées
export function demarrerSyncFirestore({
  onBaseRecipes,
  onUserRecipes,
  onSharedRecipes,
  onCollectionUpdate,
  onSettingsUpdate,
  onSyncError
}) {
  arreterListenersFirestore();
  if (!fb || !currentUser) return;

  const { collection, doc, onSnapshot, query, where } = fb.fsMod;
  const uid = currentUser.uid;
  const email = (currentUser.email || '').toLowerCase();
  const handleErr = (label, err) => {
    console.warn(`Sync ${label}:`, err);
    if (typeof onSyncError === 'function') onSyncError(err, label);
  };

  // 1. Recettes de base globales
  unsubListeners.push(
    onSnapshot(collection(fb.db, 'charcuterie_base_recipes'), (snap) => {
      const list = snap.docs.map(d => ({ ...d.data(), id: d.id, _source: 'base' }));
      onBaseRecipes(list);
    }, (err) => handleErr('base_recipes', err))
  );

  // 2. Recettes perso & modifiées de l'utilisateur
  unsubListeners.push(
    onSnapshot(query(collection(fb.db, 'charcuterie_user_recipes'), where('ownerUid', '==', uid)), (snap) => {
      const list = snap.docs.map(d => ({ ...d.data(), id: d.id, _source: 'user' }));
      onUserRecipes(list);
    }, (err) => handleErr('user_recipes', err))
  );

  // 3. Recettes partagées avec l'utilisateur par email
  if (email) {
    unsubListeners.push(
      onSnapshot(query(collection(fb.db, 'charcuterie_user_recipes'), where('sharedWithEmails', 'array-contains', email)), (snap) => {
        const list = snap.docs
          .map(d => ({ ...d.data(), id: d.id, _source: 'shared' }))
          .filter(r => r.ownerUid !== uid);
        onSharedRecipes(list);
      }, (err) => handleErr('shared_recipes', err))
    );
  }

  // 4. Collections privées par personne
  const userCollections = ['projects', 'courses', 'commandes', 'clients', 'cave_releves', 'evaluations'];
  userCollections.forEach(colName => {
    unsubListeners.push(
      onSnapshot(collection(fb.db, 'charcuterie_users', uid, colName), (snap) => {
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        onCollectionUpdate(colName, list, snap.metadata.fromCache);
      }, (err) => handleErr(colName, err))
    );
  });

  // 5. Paramètres & préférences utilisateur
  unsubListeners.push(
    onSnapshot(doc(fb.db, 'charcuterie_users', uid, 'settings', 'main'), (snap) => {
      if (snap.exists()) {
        onSettingsUpdate(snap.data());
      }
    }, (err) => handleErr('settings', err))
  );
}

// Sauvegarde d'une recette perso / modifiée (fork automatique si c'était une recette de base)
export async function saveUserRecipeFirestore(recette) {
  if (!fb || !currentUser) return null;
  const { doc, setDoc } = fb.fsMod;
  const uid = currentUser.uid;

  // Si c'est une recette de base globale, on crée un fork personnel sans toucher à charcuterie_base_recipes
  let targetId = recette.id || recette.code;
  let baseRecipeId = recette.baseRecipeId || null;
  if (recette._source === 'base' || (!recette.ownerUid && !String(targetId).includes('__'))) {
    baseRecipeId = targetId;
    targetId = `${targetId}__${uid}`;
  }

  const nowIso = new Date().toISOString();
  const payload = pickRecipeFields({
    ...recette,
    id: targetId,
    baseRecipeId,
    ownerUid: uid,
    sharedWithEmails: Array.isArray(recette.sharedWithEmails) ? recette.sharedWithEmails : [],
    createdAt: recette.createdAt || nowIso,
    updatedAt: nowIso
  }, ['sharedWithEmails', 'baseRecipeId']);

  await setDoc(doc(fb.db, 'charcuterie_user_recipes', targetId), payload);
  return { ...payload, _source: 'user' };
}

export async function updateRecipeSharingFirestore(recipeId, sharedWithEmails) {
  if (!fb || !currentUser) return;
  const { doc, updateDoc } = fb.fsMod;
  const cleanEmails = Array.from(new Set(
    (sharedWithEmails || []).map(e => String(e).trim().toLowerCase()).filter(Boolean)
  )).slice(0, 20);
  await updateDoc(doc(fb.db, 'charcuterie_user_recipes', recipeId), {
    sharedWithEmails: cleanEmails,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteUserRecipeFirestore(recipeId) {
  if (!fb || !currentUser) return;
  const { doc, deleteDoc } = fb.fsMod;
  await deleteDoc(doc(fb.db, 'charcuterie_user_recipes', recipeId));
}

export async function saveBaseRecipeFirestore(recette) {
  if (!fb || !currentUser) return;
  const { doc, setDoc } = fb.fsMod;
  const id = recette.id || recette.code;
  const nowIso = new Date().toISOString();
  const payload = pickRecipeFields({
    ...recette,
    id,
    ownerUid: recette.ownerUid || currentUser.uid,
    createdAt: recette.createdAt || nowIso,
    updatedAt: nowIso
  });
  await setDoc(doc(fb.db, 'charcuterie_base_recipes', id), payload);
}

export async function deleteBaseRecipeFirestore(recipeId) {
  if (!fb || !currentUser) return;
  const { doc, deleteDoc } = fb.fsMod;
  await deleteDoc(doc(fb.db, 'charcuterie_base_recipes', recipeId));
}

// Synchronisation complète des données privées de l'utilisateur vers Firestore
export async function syncUserCollectionDoc(colName, item) {
  if (!fb || !currentUser || !item || !item.id) return;
  const { doc, setDoc } = fb.fsMod;
  const normalized = { ...item, id: String(item.id) };
  await setDoc(
    doc(fb.db, 'charcuterie_users', currentUser.uid, colName, String(item.id)),
    cleanForFirestore(normalized)
  );
}

export async function deleteUserCollectionDoc(colName, docId) {
  if (!fb || !currentUser || !docId) return;
  const { doc, deleteDoc } = fb.fsMod;
  await deleteDoc(doc(fb.db, 'charcuterie_users', currentUser.uid, colName, String(docId)));
}

export async function syncAllUserDataToFirestore(appState) {
  if (!fb || !currentUser) return;
  const { collection, doc, writeBatch, getDocs } = fb.fsMod;
  const uid = currentUser.uid;

  const mapping = [
    ['projects', appState.projets || []],
    ['courses', appState.courses || []],
    ['commandes', appState.commandes || []],
    ['clients', appState.clients || []],
    ['cave_releves', appState.caveReleves || []],
    ['evaluations', appState.evaluations || []]
  ];

  for (const [colName, items] of mapping) {
    const colRef = collection(fb.db, 'charcuterie_users', uid, colName);
    const existingSnap = await getDocs(colRef);
    const currentIds = new Set(items.filter(i => i && i.id).map(i => String(i.id)));

    const batch = writeBatch(fb.db);
    existingSnap.docs.forEach(d => {
      if (!currentIds.has(d.id)) {
        batch.delete(d.ref);
      }
    });
    items.forEach(item => {
      if (item && item.id) {
        const normalized = { ...item, id: String(item.id) };
        batch.set(doc(colRef, String(item.id)), cleanForFirestore(normalized));
      }
    });
    await batch.commit();
  }

  await setDocSettingsFirestore(appState);
}

export async function setDocSettingsFirestore(appState) {
  if (!fb || !currentUser) return;
  const { doc, setDoc } = fb.fsMod;
  await setDoc(doc(fb.db, 'charcuterie_users', currentUser.uid, 'settings', 'main'), cleanForFirestore({
    parametres: appState.parametres || [],
    recettesSupprimees: appState.recettesSupprimees || [],
    lastBackupAt: appState.lastBackupAt || null,
    updatedAt: new Date().toISOString()
  }));
}
