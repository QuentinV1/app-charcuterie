// Journal de Cave : relevés Température & Hygrométrie + graphique comparatif année par année
import { appState, sauvegarderDonnees, escapeHtml, escapeJsStr } from './state.js';

const MOIS_COURTS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const COULEURS_ANNEES = ['#C84B31', '#1565C0', '#2E7D32', '#8E24AA', '#EF6C00', '#00838F'];

let caveMetriqueGraph = 'both'; // 'temp', 'hygro', 'both'

export function setCaveMetrique(m) {
  caveMetriqueGraph = m;
  rendreJournalCave();
}

export function ajouterReleveCave() {
  const tempEl = document.getElementById('cave-input-temp');
  const hygroEl = document.getElementById('cave-input-hygro');
  const dateEl = document.getElementById('cave-input-date');
  const noteEl = document.getElementById('cave-input-note');

  const temp = parseFloat(tempEl.value);
  const hygro = parseFloat(hygroEl.value);
  const dateVal = dateEl.value || new Date().toISOString().slice(0, 10);
  const note = (noteEl.value || '').trim();

  if (isNaN(temp) || isNaN(hygro) || hygro < 0 || hygro > 100) {
    alert('Veuillez saisir une température (°C) et une hygrométrie (0-100%) valides.');
    return;
  }

  if (!Array.isArray(appState.caveReleves)) appState.caveReleves = [];
  appState.caveReleves.push({
    id: 'cave_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    date: dateVal,
    temperature: Number(temp.toFixed(1)),
    hygrometrie: Number(hygro.toFixed(1)),
    note
  });

  sauvegarderDonnees();
  tempEl.value = '';
  hygroEl.value = '';
  noteEl.value = '';
  rendreJournalCave();
}

export function supprimerReleveCave(id) {
  if (!confirm('Supprimer ce relevé de cave ?')) return;
  appState.caveReleves = (appState.caveReleves || []).filter(r => r.id !== id);
  sauvegarderDonnees();
  rendreJournalCave();
}

function construireSvgAnnuel(releves, type) {
  // type = 'temp' | 'hygro'
  const isTemp = type === 'temp';
  const minVal = isTemp ? 0 : 30;
  const maxVal = isTemp ? 30 : 100;
  const idealMin = isTemp ? 10 : 70;
  const idealMax = isTemp ? 14 : 80;
  const unite = isTemp ? '°C' : '%';

  const w = 340;
  const h = 165;
  const padL = 34;
  const padR = 12;
  const padT = 16;
  const padB = 26;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const toX = (mIdx) => padL + (mIdx / 11) * plotW;
  const toY = (val) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return padT + plotH - ((clamped - minVal) / (maxVal - minVal)) * plotH;
  };

  // Regrouper par année puis par mois (0..11)
  const parAnnee = {};
  releves.forEach(r => {
    const d = new Date(r.date);
    if (isNaN(d.getTime())) return;
    const yr = d.getFullYear();
    const m = d.getMonth();
    if (!parAnnee[yr]) parAnnee[yr] = Array.from({ length: 12 }, () => []);
    parAnnee[yr][m].push(isTemp ? r.temperature : r.hygrometrie);
  });

  const annees = Object.keys(parAnnee).sort();

  // Zone idéale verte
  const yIdealTop = toY(idealMax);
  const yIdealBot = toY(idealMin);
  const zoneIdeale = `
    <rect x="${padL}" y="${yIdealTop}" width="${plotW}" height="${Math.max(2, yIdealBot - yIdealTop)}" fill="#2E7D32" opacity="0.14" />
    <line x1="${padL}" y1="${yIdealTop}" x2="${padL + plotW}" y2="${yIdealTop}" stroke="#2E7D32" stroke-width="0.8" stroke-dasharray="3 3" opacity="0.6" />
    <line x1="${padL}" y1="${yIdealBot}" x2="${padL + plotW}" y2="${yIdealBot}" stroke="#2E7D32" stroke-width="0.8" stroke-dasharray="3 3" opacity="0.6" />
    <text x="${padL + 4}" y="${yIdealTop + 10}" font-size="8.5" fill="#2E7D32" font-weight="600">Idéal ${idealMin}-${idealMax}${unite}</text>
  `;

  // Axes et graduations
  const ticks = isTemp ? [0, 10, 14, 20, 30] : [40, 60, 70, 80, 100];
  const yTicksHtml = ticks.map(t => {
    const y = toY(t);
    return `<line x1="${padL}" y1="${y}" x2="${padL + plotW}" y2="${y}" stroke="var(--border-color)" stroke-width="0.6" opacity="0.5" />
      <text x="${padL - 4}" y="${y + 3}" font-size="8.5" text-anchor="end" fill="var(--text-muted)">${t}${unite}</text>`;
  }).join('');

  const xLabelsHtml = MOIS_COURTS.map((m, idx) => {
    return `<text x="${toX(idx)}" y="${h - 6}" font-size="8.5" text-anchor="middle" fill="var(--text-muted)">${m}</text>`;
  }).join('');

  // Courbes par année
  let courbesHtml = '';
  const legendItems = [];

  annees.forEach((yr, idxAn) => {
    const col = COULEURS_ANNEES[idxAn % COULEURS_ANNEES.length];
    legendItems.push(`<span style="display:inline-flex; align-items:center; gap:4px; font-size:0.75rem; font-weight:700; color:${col};">● ${yr}</span>`);

    const pts = [];
    for (let m = 0; m < 12; m++) {
      const vals = parAnnee[yr][m];
      if (vals.length > 0) {
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        pts.push({ m, avg, x: toX(m), y: toY(avg) });
      }
    }

    if (pts.length > 1) {
      const poly = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
      courbesHtml += `<polyline fill="none" stroke="${col}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" points="${poly}" />`;
    }
    pts.forEach(p => {
      courbesHtml += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="${col}" stroke="#fff" stroke-width="1.2">
        <title>${MOIS_COURTS[p.m]} ${yr} : ${p.avg.toFixed(1)}${unite}</title>
      </circle>`;
    });
  });

  return `
    <div style="margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span style="font-size:0.82rem; font-weight:700;">${isTemp ? '🌡️ Température moyenne mensuelle (°C)' : '💧 Hygrométrie moyenne mensuelle (%)'}</span>
        <div style="display:flex; gap:8px;">${legendItems.join('')}</div>
      </div>
      <svg viewBox="0 0 ${w} ${h}" style="width:100%; height:auto; display:block; background:var(--surface-subtle); border-radius:8px;">
        ${yTicksHtml}
        ${zoneIdeale}
        ${xLabelsHtml}
        ${courbesHtml}
      </svg>
    </div>
  `;
}

function calculerMeilleursMois(releves) {
  const parMois = Array.from({ length: 12 }, () => ({ temps: [], hygros: [] }));
  releves.forEach(r => {
    const d = new Date(r.date);
    if (isNaN(d.getTime())) return;
    const m = d.getMonth();
    parMois[m].temps.push(r.temperature);
    parMois[m].hygros.push(r.hygrometrie);
  });

  const optimaux = [];
  const corrects = [];
  parMois.forEach((data, mIdx) => {
    if (data.temps.length === 0) return;
    const avgT = data.temps.reduce((a, b) => a + b, 0) / data.temps.length;
    const avgH = data.hygros.reduce((a, b) => a + b, 0) / data.hygros.length;
    if (avgT >= 10 && avgT <= 14 && avgH >= 70 && avgH <= 80) {
      optimaux.push(`${MOIS_COURTS[mIdx]} (${avgT.toFixed(1)}°C, ${avgH.toFixed(0)}%)`);
    } else if (avgT >= 7 && avgT <= 16 && avgH >= 65 && avgH <= 85) {
      corrects.push(`${MOIS_COURTS[mIdx]} (${avgT.toFixed(1)}°C, ${avgH.toFixed(0)}%)`);
    }
  });
  return { optimaux, corrects };
}

export function rendreJournalCave() {
  const container = document.getElementById('cave-container');
  if (!container) return;

  const releves = [...(appState.caveReleves || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  const dernier = releves[0] || null;

  const dateInput = document.getElementById('cave-input-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }

  let statusHtml = '';
  if (dernier) {
    const tempOk = dernier.temperature >= 10 && dernier.temperature <= 14;
    const hygroOk = dernier.hygrometrie >= 70 && dernier.hygrometrie <= 80;
    const badgeColor = (tempOk && hygroOk) ? '#2E7D32' : (dernier.temperature > 17 || dernier.hygrometrie < 60 || dernier.hygrometrie > 88 ? '#C62828' : '#EF6C00');
    const badgeTxt = (tempOk && hygroOk) ? '✅ Conditions idéales' : (!tempOk && !hygroOk ? '⚠️ T° et HR hors zone cible' : (!tempOk ? '⚠️ Température hors cible (10-14°C)' : '⚠️ Hygrométrie hors cible (70-80%)'));

    statusHtml = `
      <div class="card" style="border-left:4px solid ${badgeColor}; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Dernier relevé (${new Date(dernier.date).toLocaleDateString('fr-FR')})</div>
            <div style="font-size:1.25rem; font-weight:800; margin-top:2px;">
              🌡️ ${dernier.temperature}°C &nbsp;·&nbsp; 💧 ${dernier.hygrometrie}%
            </div>
          </div>
          <span style="font-size:0.75rem; font-weight:700; color:${badgeColor}; background:var(--surface-subtle); padding:4px 8px; border-radius:6px;">${badgeTxt}</span>
        </div>
      </div>
    `;
  }

  let graphHtml = '';
  if (releves.length > 0) {
    const meilleurs = calculerMeilleursMois(releves);
    let syntheseHtml = '';
    if (meilleurs.optimaux.length > 0) {
      syntheseHtml = `<div style="background:#E8F5E9; color:#2E7D32; padding:8px 10px; border-radius:6px; font-size:0.78rem; margin-bottom:10px;">
        🏆 <strong>Périodes optimales observées :</strong> ${escapeHtml(meilleurs.optimaux.join(', '))}
      </div>`;
    } else if (meilleurs.corrects.length > 0) {
      syntheseHtml = `<div style="background:#FFF8E1; color:#EF6C00; padding:8px 10px; border-radius:6px; font-size:0.78rem; margin-bottom:10px;">
        👍 <strong>Périodes favorables :</strong> ${escapeHtml(meilleurs.corrects.join(', '))}
      </div>`;
    }

    graphHtml = `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
          <div style="font-weight:700; font-size:0.95rem;">Évolution annuelle (comparatif par année)</div>
          <div style="display:flex; gap:4px;">
            <button class="chip-sm ${caveMetriqueGraph === 'both' ? 'active' : ''}" onclick="setCaveMetrique('both')">Les deux</button>
            <button class="chip-sm ${caveMetriqueGraph === 'temp' ? 'active' : ''}" onclick="setCaveMetrique('temp')">T°</button>
            <button class="chip-sm ${caveMetriqueGraph === 'hygro' ? 'active' : ''}" onclick="setCaveMetrique('hygro')">HR%</button>
          </div>
        </div>
        ${syntheseHtml}
        ${(caveMetriqueGraph === 'both' || caveMetriqueGraph === 'temp') ? construireSvgAnnuel(releves, 'temp') : ''}
        ${(caveMetriqueGraph === 'both' || caveMetriqueGraph === 'hygro') ? construireSvgAnnuel(releves, 'hygro') : ''}
      </div>
    `;
  } else {
    graphHtml = `
      <div class="card" style="text-align:center; padding:24px; color:var(--text-muted);">
        <div style="font-size:1.8rem; margin-bottom:8px;">🌡️</div>
        <div style="font-weight:600; margin-bottom:4px;">Aucun relevé de cave pour le moment</div>
        <div style="font-size:0.82rem;">Ajoutez votre premier relevé ci-dessus pour suivre l'évolution saisonnière de votre cave année par année.</div>
      </div>
    `;
  }

  let listeHtml = '';
  if (releves.length > 0) {
    listeHtml = `
      <div class="card">
        <div style="font-weight:700; font-size:0.95rem; margin-bottom:8px;">Historique des relevés (${releves.length})</div>
        ${releves.map(r => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border-color);">
            <div>
              <div style="font-weight:700; font-size:0.88rem;">
                ${new Date(r.date).toLocaleDateString('fr-FR')} — 🌡️ ${r.temperature}°C · 💧 ${r.hygrometrie}%
              </div>
              ${r.note ? `<div style="font-size:0.78rem; color:var(--text-muted);">${escapeHtml(r.note)}</div>` : ''}
            </div>
            <button class="btn-icon" style="color:var(--danger);" onclick="supprimerReleveCave('${escapeJsStr(r.id)}')" title="Supprimer">✕</button>
          </div>
        `).join('')}
      </div>
    `;
  }

  container.innerHTML = statusHtml + graphHtml + listeHtml;
}
