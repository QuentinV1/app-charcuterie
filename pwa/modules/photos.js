// Stockage photos étapes & affinage (IndexedDB + compression Canvas)
import { appState, uiState, sauvegarderDonnees } from './state.js';

const PHOTO_DB_NAME = 'laffinoir_photos_db';
const PHOTO_STORE_NAME = 'photos';
let photoObjectUrlsCache = [];

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

export async function compresserImagePWA(file, maxDim = 1400, quality = 0.80) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Image invalide'));
    i.src = dataUrl;
  });
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
      const dataUrl = await new Promise((res) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.readAsDataURL(r.blob);
      });
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
      const resp = await fetch(item.dataUrl);
      const blob = await resp.blob();
      await sauvegarderPhotoIDB({
        id: item.id,
        projetId: item.projetId,
        etapeIdx: item.etapeIdx,
        blob,
        size: item.size || blob.size,
        createdAt: item.createdAt || Date.now()
      });
    } catch (e) {
      console.warn('Import photo IDB:', e);
    }
  }
}

export async function ajouterPhotosEtapePWA(etapeIdx, fileList, onAfterRender) {
  if (!fileList || fileList.length === 0) return;
  const p = appState.projets.find(x => x.id === uiState.projetActuelId);
  if (!p || !p.etapes || !p.etapes[etapeIdx]) return;
  const et = p.etapes[etapeIdx];
  if (!Array.isArray(et.photoIds)) et.photoIds = [];

  for (const file of Array.from(fileList)) {
    try {
      const blob = await compresserImagePWA(file, 1400, 0.80);
      if (!blob) continue;
      const photoId = 'ph_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      await sauvegarderPhotoIDB({
        id: photoId,
        projetId: p.id,
        etapeIdx: etapeIdx,
        blob: blob,
        size: blob.size,
        createdAt: Date.now()
      });
      et.photoIds.push(photoId);
    } catch (e) {
      console.error('Erreur ajout photo:', e);
    }
  }
  sauvegarderDonnees();
  if (typeof onAfterRender === 'function') onAfterRender(p);
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

    for (const photoId of et.photoIds) {
      try {
        const rec = await lirePhotoIDB(photoId);
        if (!rec || !rec.blob) continue;
        const url = URL.createObjectURL(rec.blob);
        photoObjectUrlsCache.push(url);
        const img = document.createElement('img');
        img.src = url;
        img.className = 'etape-photo-thumb';
        img.alt = 'Photo étape';
        img.onclick = () => ouvrirApercuPhotoEtape(photoId, idx);
        strip.appendChild(img);
      } catch (e) {
        console.warn('Lecture photo IDB:', e);
      }
    }
  }
}

export async function ouvrirApercuPhotoEtape(photoId, etapeIdx) {
  const rec = await lirePhotoIDB(photoId);
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
  document.getElementById('modal-photo-meta').textContent = `${dateStr} · ${tailleKo} Ko`;

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
  if (typeof window.fermerModals === 'function') window.fermerModals();
  if (p && typeof window.rendrePlanningProjet === 'function') window.rendrePlanningProjet(p);
}
