import { submitFeedbackFirestore } from './firebase.js';

const STORAGE_KEY = 'app_charcuterie_feedbacks_v1';
const APP_ID = 'app-charcuterie';
const APP_NAME = "L'Affinoir";

let currentType = 'evolution';

function loadLocalFeedbacks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalFeedbacks(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 30)));
  } catch {
    // Ignore storage quota errors
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderFeedbackHistory() {
  const listEl = document.getElementById('feedback-history-list');
  const wrapEl = document.getElementById('feedback-history-wrap');
  if (!listEl || !wrapEl) return;

  const items = loadLocalFeedbacks();
  if (items.length === 0) {
    wrapEl.style.display = 'none';
    listEl.innerHTML = '';
    return;
  }

  wrapEl.style.display = 'block';
  listEl.innerHTML = items
    .slice(0, 8)
    .map((item) => {
      const isBug = item.type === 'bug';
      const dateStr = new Date(item.createdAt).toLocaleDateString('fr-FR');
      return `
        <div style="padding:8px 10px;border-radius:8px;border:1px solid var(--border);background:var(--bg);font-size:0.8rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-weight:700;font-size:0.74rem;color:${isBug ? '#ef4444' : 'var(--accent)'};">
              ${isBug ? 'Bug' : 'Évolution'}
            </span>
            <span style="font-size:0.72rem;color:var(--text-muted);">
              ${item.synced ? 'Envoyé' : 'Local'} · ${escapeHtml(dateStr)}
            </span>
          </div>
          <div style="white-space:pre-wrap;word-break:break-word;">${escapeHtml(item.comment)}</div>
        </div>
      `;
    })
    .join('');
}

async function flushPendingFeedbacks() {
  const items = loadLocalFeedbacks();
  const pending = items.filter((item) => !item.synced);
  if (pending.length === 0) return;

  let changed = false;
  for (const item of pending) {
    try {
      const ok = await submitFeedbackFirestore({
        appId: APP_ID,
        appName: APP_NAME,
        type: item.type,
        comment: item.comment,
        context: item.context || '',
      });
      if (ok) {
        item.synced = true;
        changed = true;
      }
    } catch {
      // Retry later
    }
  }
  if (changed) {
    saveLocalFeedbacks(items);
    renderFeedbackHistory();
  }
}

export function setFeedbackType(type) {
  currentType = type === 'bug' ? 'bug' : 'evolution';
  const btnEvol = document.getElementById('btn-fb-type-evol');
  const btnBug = document.getElementById('btn-fb-type-bug');
  const textarea = document.getElementById('feedback-comment-input');
  if (btnEvol) {
    btnEvol.style.borderColor = currentType === 'evolution' ? 'var(--accent)' : 'var(--border)';
    btnEvol.style.background = currentType === 'evolution' ? 'rgba(139, 92, 246, 0.12)' : 'transparent';
    btnEvol.style.color = currentType === 'evolution' ? 'var(--accent)' : 'var(--text)';
  }
  if (btnBug) {
    btnBug.style.borderColor = currentType === 'bug' ? '#ef4444' : 'var(--border)';
    btnBug.style.background = currentType === 'bug' ? 'rgba(239, 68, 68, 0.12)' : 'transparent';
    btnBug.style.color = currentType === 'bug' ? '#ef4444' : 'var(--text)';
  }
  if (textarea) {
    textarea.placeholder =
      currentType === 'evolution'
        ? "Décrivez l'amélioration ou la nouvelle fonctionnalité souhaitée..."
        : 'Décrivez le problème rencontré et comment le reproduire...';
  }
}

export function ouvrirModalFeedback() {
  const modal = document.getElementById('modal-feedback');
  if (!modal) return;
  const errEl = document.getElementById('feedback-error-msg');
  const okEl = document.getElementById('feedback-success-msg');
  if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
  if (okEl) { okEl.style.display = 'none'; okEl.textContent = ''; }
  setFeedbackType(currentType);
  renderFeedbackHistory();
  modal.classList.add('open');
  flushPendingFeedbacks();
}

export function fermerModalFeedback() {
  const modal = document.getElementById('modal-feedback');
  if (modal) modal.classList.remove('open');
}

export async function envoyerFeedbackPWA(event) {
  if (event) event.preventDefault();
  const textarea = document.getElementById('feedback-comment-input');
  const errEl = document.getElementById('feedback-error-msg');
  const okEl = document.getElementById('feedback-success-msg');
  const submitBtn = document.getElementById('btn-feedback-submit');
  if (!textarea) return;

  const trimmed = textarea.value.trim();
  if (!trimmed) {
    if (errEl) { errEl.textContent = 'Veuillez saisir un commentaire.'; errEl.style.display = 'block'; }
    return;
  }

  if (errEl) errEl.style.display = 'none';
  if (okEl) okEl.style.display = 'none';
  if (submitBtn) submitBtn.disabled = true;

  let synced = false;
  try {
    synced = await submitFeedbackFirestore({
      appId: APP_ID,
      appName: APP_NAME,
      type: currentType,
      comment: trimmed,
      context: window.location.hash || '',
    });
  } catch {
    synced = false;
  }

  const nextItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: currentType,
    comment: trimmed,
    createdAt: new Date().toISOString(),
    synced,
    context: window.location.hash || '',
  };
  const nextHistory = [nextItem, ...loadLocalFeedbacks()].slice(0, 30);
  saveLocalFeedbacks(nextHistory);
  renderFeedbackHistory();
  textarea.value = '';
  const counterEl = document.getElementById('feedback-char-count');
  if (counterEl) counterEl.textContent = '0 / 2000';
  if (submitBtn) submitBtn.disabled = false;
  if (okEl) {
    okEl.textContent = synced
      ? 'Feedback envoyé avec succès !'
      : 'Feedback enregistré localement. Il sera envoyé dès la connexion au Cloud.';
    okEl.style.display = 'block';
  }
}

window.ouvrirModalFeedback = ouvrirModalFeedback;
window.fermerModalFeedback = fermerModalFeedback;
window.setFeedbackType = setFeedbackType;
window.envoyerFeedbackPWA = envoyerFeedbackPWA;
window.updateFeedbackCharCount = function () {
  const textarea = document.getElementById('feedback-comment-input');
  const counterEl = document.getElementById('feedback-char-count');
  if (textarea && counterEl) {
    counterEl.textContent = `${textarea.value.length} / 2000`;
  }
};
