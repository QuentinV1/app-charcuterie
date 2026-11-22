// Stockage photos étapes & affinage (IndexedDB cache local + Cloud Firestore sync)
import { appState, uiState, sauvegarderDonnees, escapeHtml, svgIcon } from './state.js';
import {
  estConnecteFirebase,
  savePhotoFirestore,
  getPhotoFirestore,
  deletePhotoFirestore,
  deleteProjectPhotosFirestore
} from './firebase.js';

const PHOTO_DB_NAME = 'laffinoir_photos_db';
const PHOTO_STORE_NAME = 'photos';
const MAX_CLOUD_DATAURL_LEN = 750000; // < 1 Mo limite document Firestore
let photoObjectUrlsCache = [];
let _photoSyncInProgress = false;

export function ouvrirPhotoDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB non supporté'));
      return;
    }
    const req = indexedDB.open(PHOTO_DB_NAME, 1);
    req.onupgradeneeded = (ev) => {
      const db = ev.target.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE_NAME)) {
        const store = db.createObjectStore(PHOTO_STORE_NAME, { keyPath: 'id' });
        store.createIndex('projetId', 'projetId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl) {
  const resp = await fetch(dataUrl);
  return await resp.blob();
}

function chargerImageDepuisSource(src) {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Image invalide'));
    i.src = src;
  });
}

async function compresserImageDepuisDataUrl(srcDataUrl, maxDim, quality) {
  const img = await chargerImageDepuisSource(srcDataUrl);
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  if (w > maxDim || h > maxDim) {
    const ratio = maxDim / Math.max(w, h);
    w = Math.max(1, Math.round(w * ratio));
    h = Math.max(1, Math.round(h * ratio));
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

export async function compresserImagePWA(file, maxDim = 1280, quality = 0.78) {
  const srcDataUrl = await blobToDataUrl(file);
  return await compresserImageDepuisDataUrl(srcDataUrl, maxDim, quality);
}

async function compresserPourCloud(fileOrBlob) {
  const srcDataUrl = await blobToDataUrl(fileOrBlob);
  const paliers = [
    [1280, 0.78],
    [960, 0.68],
    [760, 0.56]
  ];
  let blob = null;
  let dataUrl = '';
  for (const [dim, q] of paliers) {
    blob = await compresserImageDepuisDataUrl(srcDataUrl, dim, q);
    if (!blob) continue;
    dataUrl = await blobToDataUrl(blob);
    if (dataUrl.length <= MAX_CLOUD_DATAURL_LEN) {
      break;
    }
  }
  return { blob, dataUrl, size: blob ? blob.size : 0 };
}

export async function sauvegarderPhotoIDB(record) {
  const db = await ouvrirPhotoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE_NAME, 'readwrite');
    tx.objectStore(PHOTO_STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function lirePhotoIDB(photoId) {
  const db = await ouvrirPhotoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE_NAME, 'readonly');
    const req = tx.objectStore(PHOTO_STORE_NAME).get(photoId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function supprimerPhotoIDB(photoId) {
  const db = await ouvrirPhotoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE_NAME, 'readwrite');
    tx.objectStore(PHOTO_STORE_NAME).delete(photoId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function supprimerPhotosProjetIDB(projetId) {
  try {
    const db = await ouvrirPhotoDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE_NAME, 'readwrite');
      const index = tx.objectStore(PHOTO_STORE_NAME).index('projetId');
      const req = index.openCursor(IDBKeyRange.only(projetId));
      req.onsuccess = (ev) => {
        const cursor = ev.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('Nettoyage photos IndexedDB:', e);
  }
  if (estConnecteFirebase()) {
    deleteProjectPhotosFirestore(projetId).catch((e) =>
      console.warn('Nettoyage photos Firestore:', e)
    );
  }
}

async function pousserPhotoVersCloud(record) {
  if (!estConnecteFirebase() || !record || !record.id) return false;
  try {
    let dataUrl = record.dataUrl;
    let blob = record.blob;
    let size = record.size;
    if (!dataUrl && blob) {
      dataUrl = await blobToDataUrl(blob);
    }
    if (!dataUrl) return false;
    if (dataUrl.length > MAX_CLOUD_DATAURL_LEN && blob) {
      const recompressed = await compresserPourCloud(blob);
      blob = recompressed.blob;
      dataUrl = recompressed.dataUrl;
      size = recompressed.size;
    }
    const ok = await savePhotoFirestore({
      id: record.id,
      projetId: record.projetId,
      etapeIdx: record.etapeIdx,
      dataUrl,
      size: size || (blob ? blob.size : dataUrl.length),
      createdAt: record.createdAt || Date.now()
    });
    if (ok) {
      await sauvegarderPhotoIDB({
        ...record,
        blob,
        size: size || (blob ? blob.size : record.size),
        synced: true
      });
    }
    return ok;
  } catch (e) {
    console.warn('Upload photo Firestore échoué (restera en file locale):', e);
    return false;
  }
}

export async function synchroniserPhotosCloud() {
  if (_photoSyncInProgress || !estConnecteFirebase()) return { uploaded: 0 };
  _photoSyncInProgress = true;
  let uploaded = 0;
  try {
    const db = await ouvrirPhotoDB();
    const records = await new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE_NAME, 'readonly');
      const req = tx.objectStore(PHOTO_STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    for (const rec of records) {
      if (rec && !rec.synced) {
        const ok = await pousserPhotoVersCloud(rec);
        if (ok) uploaded++;
      }
    }
  } catch (e) {
    console.warn('Synchronisation photos cloud:', e);
  } finally {
    _photoSyncInProgress = false;
  }
  return { uploaded };
}

async function obtenirPhotoAvecFallbackCloud(photoId) {
  let rec = null;
  try {
    rec = await lirePhotoIDB(photoId);
  } catch (e) {
    console.warn('Lecture photo IDB:', e);
  }
  if (rec && rec.blob) {
    if (!rec.synced && estConnecteFirebase()) {
      pousserPhotoVersCloud(rec);
    }
    return rec;
  }
  if (estConnecteFirebase()) {
    try {
      const cloudDoc = await getPhotoFirestore(photoId);
      if (cloudDoc && cloudDoc.dataUrl) {
        const blob = await dataUrlToBlob(cloudDoc.dataUrl);
        const cached = {
          id: cloudDoc.id || photoId,
          projetId: cloudDoc.projetId || '',
          etapeIdx: typeof cloudDoc.etapeIdx === 'number' ? cloudDoc.etapeIdx : 0,
          blob,
          size: cloudDoc.size || blob.size,
          createdAt: cloudDoc.createdAt || Date.now(),
          synced: true
        };
        await sauvegarderPhotoIDB(cached).catch(() => {});
        return cached;
      }
    } catch (e) {
      console.warn('Récupération photo Firestore:', e);
    }
  }
  return null;
}

export async function exporterToutesPhotosIDB() {
  try {
    const db = await ouvrirPhotoDB();
    const records = await new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE_NAME, 'readonly');
      const req = tx.objectStore(PHOTO_STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    const out = [];
    for (const r of records) {
      if (!r.blob) continue;
      const dataUrl = await blobToDataUrl(r.blob);
      out.push({
        id: r.id,
        projetId: r.projetId,
        etapeIdx: r.etapeIdx,
        size: r.size || r.blob.size,
        createdAt: r.createdAt || Date.now(),
        dataUrl
      });
    }
    return out;
  } catch (e) {
    console.warn('Export photos IndexedDB:', e);
    return [];
  }
}

export async function importerPhotosIDB(photosArray) {
  if (!Array.isArray(photosArray) || photosArray.length === 0) return;
  for (const item of photosArray) {
    if (!item || !item.id || !item.dataUrl) continue;
    try {
      const blob = await dataUrlToBlob(item.dataUrl);
      await sauvegarderPhotoIDB({
        id: item.id,
        projetId: item.projetId,
        etapeIdx: item.etapeIdx,
        blob,
        size: item.size || blob.size,
        createdAt: item.createdAt || Date.now(),
        synced: false
      });
    } catch (e) {
      console.warn('Import photo IDB:', e);
    }
  }
  if (estConnecteFirebase()) {
    synchroniserPhotosCloud();
  }
}

export async function ajouterPhotosEtapePWA(etapeIdx, fileList, onAfterRender) {
  if (!fileList || fileList.length === 0) return;
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p || !p.etapes || !p.etapes[etapeIdx]) return;
  const et = p.etapes[etapeIdx];
  if (!Array.isArray(et.photoIds)) et.photoIds = [];

  const newRecords = [];
  for (const file of Array.from(fileList)) {
    try {
      const { blob, dataUrl, size } = await compresserPourCloud(file);
      if (!blob || !dataUrl) continue;
      const photoId = 'ph_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      const rec = {
        id: photoId,
        projetId: p.id,
        etapeIdx: etapeIdx,
        blob,
        size,
        createdAt: Date.now(),
        synced: false
      };
      await sauvegarderPhotoIDB(rec);
      et.photoIds.push(photoId);
      newRecords.push({ ...rec, dataUrl });
    } catch (e) {
      console.error('Erreur ajout photo:', e);
    }
  }
  sauvegarderDonnees();
  if (typeof onAfterRender === 'function') onAfterRender(p);

  if (estConnecteFirebase() && newRecords.length > 0) {
    for (const rec of newRecords) {
      await pousserPhotoVersCloud(rec);
    }
  }
}

export async function chargerMiniaturesEtapesPWA(p) {
  photoObjectUrlsCache.forEach(u => URL.revokeObjectURL(u));
  photoObjectUrlsCache = [];
  if (!p || !Array.isArray(p.etapes)) return;

  for (let idx = 0; idx < p.etapes.length; idx++) {
    const et = p.etapes[idx];
    if (!Array.isArray(et.photoIds) || et.photoIds.length === 0) continue;
    const strip = document.getElementById('etape-photos-' + idx);
    if (!strip) continue;
    strip.innerHTML = '';

    for (const photoId of et.photoIds) {
      try {
        const rec = await obtenirPhotoAvecFallbackCloud(photoId);
        if (!rec || !rec.blob) {
          const miss = document.createElement('button');
          miss.type = 'button';
          miss.className = 'etape-photo-missing';
          miss.innerHTML = `${svgIcon('camera', 13)} Indisponible ×`;
          miss.title = 'Photo introuvable (cliquer pour retirer la référence)';
          miss.onclick = () => {
            if (confirm('Cette photo est introuvable localement et dans le cloud. Retirer cette référence ?')) {
              supprimerPhotoEtapePWA(photoId, idx);
            }
          };
          strip.appendChild(miss);
          continue;
        }
        const url = URL.createObjectURL(rec.blob);
        photoObjectUrlsCache.push(url);
        const img = document.createElement('img');
        img.src = url;
        img.className = 'etape-photo-thumb';
        img.alt = 'Photo étape';
        img.onclick = () => ouvrirApercuPhotoEtape(photoId, idx);
        strip.appendChild(img);
      } catch (e) {
        console.warn('Chargement photo étape:', e);
      }
    }
  }
}

export async function ouvrirApercuPhotoEtape(photoId, etapeIdx) {
  const rec = await obtenirPhotoAvecFallbackCloud(photoId);
  if (!rec || !rec.blob) return;
  const url = URL.createObjectURL(rec.blob);
  const imgEl = document.getElementById('modal-photo-img');
  imgEl.onload = () => URL.revokeObjectURL(url);
  imgEl.src = url;

  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  const et = p && p.etapes ? p.etapes[etapeIdx] : null;
  document.getElementById('modal-photo-titre').textContent = et ? et.titre : "Photo d'étape";

  const tailleKo = Math.max(1, Math.round((rec.size || rec.blob.size) / 1024));
  const dateStr = rec.createdAt ? new Date(rec.createdAt).toLocaleString('fr-FR') : '';
  const syncBadge = rec.synced ? `${svgIcon('cloud', 13)} Sauvegardée` : `${svgIcon('smartphone', 13)} Locale`;
  document.getElementById('modal-photo-meta').innerHTML = `${escapeHtml(dateStr)} · ${tailleKo} Ko · ${syncBadge}`;

  const delBtn = document.getElementById('modal-photo-delete-btn');
  delBtn.onclick = () => supprimerPhotoEtapePWA(photoId, etapeIdx);

  document.getElementById('modal-photo-etape').classList.add('active');
}

export async function supprimerPhotoEtapePWA(photoId, etapeIdx) {
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (p && p.etapes && p.etapes[etapeIdx] && Array.isArray(p.etapes[etapeIdx].photoIds)) {
    p.etapes[etapeIdx].photoIds = p.etapes[etapeIdx].photoIds.filter(id => id !== photoId);
    sauvegarderDonnees();
  }
  await supprimerPhotoIDB(photoId);
  if (estConnecteFirebase()) {
    deletePhotoFirestore(photoId).catch((e) =>
      console.warn('Suppression photo Firestore:', e)
    );
  }
  if (typeof window.fermerModals === 'function') window.fermerModals();
  if (p && typeof window.rendrePlanningProjet === 'function') window.rendrePlanningProjet(p);
}
