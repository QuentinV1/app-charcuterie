import { appState, sauvegarderDonnees, escapeHtml, escapeJsStr, svgIcon } from './state.js';

let coursesModeVue = 'groupee';

export function setCoursesModeVue(mode) {
  coursesModeVue = mode === 'session' ? 'session' : 'groupee';
  const chipG = document.getElementById('chip-courses-groupee');
  const chipS = document.getElementById('chip-courses-session');
  if (chipG) chipG.classList.toggle('active', coursesModeVue === 'groupee');
  if (chipS) chipS.classList.toggle('active', coursesModeVue === 'session');
  rendreCourses();
}

function normaliserUnitePourFusion(qte, unite) {
  const u = (unite || '').trim().toLowerCase();
  const q = Number(qte) || 0;
  if (u === 'kg') return { qteBase: q * 1000, fam: 'masse', uniteOrig: unite };
  if (u === 'g') return { qteBase: q, fam: 'masse', uniteOrig: unite };
  if (u === 'l') return { qteBase: q * 1000, fam: 'volume', uniteOrig: unite };
  if (u === 'cl') return { qteBase: q * 10, fam: 'volume', uniteOrig: unite };
  if (u === 'ml') return { qteBase: q, fam: 'volume', uniteOrig: unite };
  return { qteBase: q, fam: `raw:${u}`, uniteOrig: unite };
}

function formaterQuantiteFusionnee(qteBase, fam, uniteOrig) {
  if (fam === 'masse') {
    if (qteBase >= 1000) return { qte: parseFloat((qteBase / 1000).toFixed(2)), unite: 'kg' };
    return { qte: parseFloat(qteBase.toFixed(1)), unite: 'g' };
  }
  if (fam === 'volume') {
    if (qteBase >= 1000) return { qte: parseFloat((qteBase / 1000).toFixed(2)), unite: 'L' };
    return { qte: parseFloat(qteBase.toFixed(1)), unite: 'ml' };
  }
  return { qte: parseFloat(qteBase.toFixed(2)), unite: uniteOrig || '' };
}

const LIBELLES_CATEGORIES = {
  VIANDE: `${svgIcon('utensils', 14)} Viandes & Matière première`,
  SEL_SUCRE: `${svgIcon('salt', 14)} Sel & Sucre`,
  EPICES: `${svgIcon('leaf', 14)} Épices & Aromates`,
  CONSOMMABLES: `${svgIcon('package', 14)} Consommables`,
  AUTRE: `${svgIcon('shopping-cart', 14)} Autres`
};

export function rendreCourses() {
  const container = document.getElementById('courses-container');
  const totalDesc = document.getElementById('courses-total-desc');
  const chipG = document.getElementById('chip-courses-groupee');
  const chipS = document.getElementById('chip-courses-session');
  if (chipG) chipG.classList.toggle('active', coursesModeVue === 'groupee');
  if (chipS) chipS.classList.toggle('active', coursesModeVue === 'session');

  const courses = appState.courses || [];
  const nbRestants = courses.filter(c => !c.achete).length;
  const coutTotalEstime = courses.reduce((acc, c) => acc + (c.prixReelPaye || c.prix || 0), 0);
  const prixActif = window.estOptionPrixActive();

  totalDesc.innerText = prixActif
    ? `${courses.length} article${courses.length > 1 ? 's' : ''} (${nbRestants} restant${nbRestants > 1 ? 's' : ''}) · Total : ${coutTotalEstime.toFixed(2)} €`
    : `${courses.length} article${courses.length > 1 ? 's' : ''} (${nbRestants} restant${nbRestants > 1 ? 's' : ''})`;

  if (courses.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 16px; color: var(--text-muted);">
        <div style="margin-bottom: 12px; color: var(--primary);">${svgIcon('shopping-cart', 44)}</div>
        <div style="font-weight: 700; font-size: 1.1rem; color: var(--text);">Votre panier est vide</div>
        <p style="font-size: 0.85rem; max-width: 320px; margin: 8px auto 16px;">Les ingrédients sont générés automatiquement lors de la planification d'une session.</p>
        <button class="btn btn-primary btn-sm" onclick="ouvrirModalAjoutCourseManuel()">+ Ajouter un article</button>
      </div>
    `;
    return;
  }

  if (coursesModeVue === 'groupee') {
    // Fusionner les ingrédients identiques (nom + famille d'unité) entre sessions
    const fusionMap = new Map();
    courses.forEach(c => {
      const nomNorm = (c.nom || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const { qteBase, fam, uniteOrig } = normaliserUnitePourFusion(c.qte, c.unite);
      const key = `${nomNorm}||${fam}`;
      const projNom = c.nomProjet || c.projetNom || 'Articles libres';
      if (!fusionMap.has(key)) {
        fusionMap.set(key, {
          nom: c.nom,
          categorie: c.categorie || 'AUTRE',
          fam,
          uniteOrig,
          qteBaseTotal: 0,
          prixTotal: 0,
          ids: [],
          sessions: new Set(),
          tousAchetes: true
        });
      }
      const grp = fusionMap.get(key);
      grp.qteBaseTotal += qteBase;
      grp.prixTotal += (c.prixReelPaye ?? c.prix ?? 0);
      grp.ids.push(c.id);
      grp.sessions.add(projNom);
      if (!c.achete) grp.tousAchetes = false;
    });

    const parCategorie = {};
    fusionMap.forEach(grp => {
      const cat = grp.categorie || 'AUTRE';
      if (!parCategorie[cat]) parCategorie[cat] = [];
      parCategorie[cat].push(grp);
    });

    const ordreCats = ['VIANDE', 'SEL_SUCRE', 'EPICES', 'CONSOMMABLES', 'AUTRE'];
    const catsTriees = Object.keys(parCategorie).sort((a, b) => {
      const ia = ordreCats.indexOf(a);
      const ib = ordreCats.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    const budgetRestant = courses.filter(c => !c.achete).reduce((acc, c) => acc + (c.prixReelPaye || c.prix || 0), 0);
    const budgetCardHtml = prixActif ? `
      <div class="card" style="background:var(--primary-light); border-color:var(--primary); display:flex; justify-content:space-between; align-items:center; padding:12px 14px; margin-bottom:14px;">
        <div>
          <div style="font-size:0.75rem; font-weight:700; color:var(--primary-dark); text-transform:uppercase;">Budget restant estimé</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${nbRestants} article${nbRestants > 1 ? 's' : ''} à acheter</div>
        </div>
        <div style="font-size:1.25rem; font-weight:800; color:var(--primary);">${budgetRestant.toFixed(2)} €</div>
      </div>
    ` : '';

    container.innerHTML = budgetCardHtml + catsTriees.map(cat => {
      const items = parCategorie[cat];
      const restantsCat = items.filter(i => !i.tousAchetes).length;
      const sTotal = items.reduce((acc, i) => acc + i.prixTotal, 0);
      const catTitre = LIBELLES_CATEGORIES[cat] || cat;

      return `
        <div class="card" style="padding:14px; margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; border-bottom:1px solid var(--border-light); padding-bottom:8px; margin-bottom:10px;">
            <div style="font-weight:800; font-size:0.95rem; color:var(--primary);">${escapeHtml(catTitre)}</div>
            <div style="font-size:0.78rem; font-weight:700; color:var(--text-muted); white-space:nowrap;">${restantsCat}/${items.length} restant${prixActif ? ` · ${sTotal.toFixed(2)} €` : ''}</div>
          </div>
          <div>
            ${items.map(it => {
              const { qte, unite } = formaterQuantiteFusionnee(it.qteBaseTotal, it.fam, it.uniteOrig);
              const sessionsArr = Array.from(it.sessions);
              const sessionsLabel = sessionsArr.length > 1
                ? `${sessionsArr.length} sessions (${sessionsArr.join(', ')})`
                : sessionsArr[0];
              const idsJoined = it.ids.join(',');
              return `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-light);">
                  <label style="display:flex; align-items:center; gap:10px; cursor:pointer; flex:1;">
                    <input type="checkbox" ${it.tousAchetes ? 'checked' : ''} onchange="basculerAchatGroupeCourses('${escapeJsStr(idsJoined)}')" style="width:18px; height:18px; accent-color:var(--primary);">
                    <div style="${it.tousAchetes ? 'text-decoration:line-through; opacity:0.6;' : ''}">
                      <span style="font-weight:600; font-size:0.88rem;">${escapeHtml(it.nom)}</span>
                      <div style="font-size:0.75rem; color:var(--text-muted);">${qte} ${escapeHtml(unite)} · ${escapeHtml(sessionsLabel)}</div>
                    </div>
                  </label>
                  <div style="display:flex; align-items:center; gap:8px;">
                    ${prixActif ? `<span style="font-weight:700; font-size:0.85rem; white-space:nowrap; color:${it.tousAchetes ? 'var(--text-muted)' : 'var(--text)'};">${it.prixTotal.toFixed(2)} €</span>` : ''}
                    ${it.ids.length === 1 ? `<button class="btn btn-secondary btn-sm" onclick="ouvrirModalModifierCourse('${escapeJsStr(it.ids[0])}')" style="padding:4px 8px;">✎</button>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
    return;
  }

  // Grouper par session
  const groupes = {};
  courses.forEach(c => {
    const projNom = c.nomProjet || c.projetNom || 'Articles libres';
    if (!groupes[projNom]) groupes[projNom] = [];
    groupes[projNom].push(c);
  });

  container.innerHTML = Object.keys(groupes).map(projNom => {
    const items = groupes[projNom];
    const sTotal = items.reduce((acc, i) => acc + (i.prixReelPaye || i.prix || 0), 0);

    return `
      <div class="card" style="padding:14px; margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; border-bottom:1px solid var(--border-light); padding-bottom:8px; margin-bottom:10px;">
          <div style="font-weight:800; font-size:0.95rem; color:var(--primary);">${escapeHtml(projNom)}</div>
          ${prixActif ? `<div style="font-size:0.8rem; font-weight:700; white-space:nowrap;">${sTotal.toFixed(2)} €</div>` : ''}
        </div>

        <div>
          ${items.map(it => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-light);">
              <label style="display:flex; align-items:center; gap:10px; cursor:pointer; flex:1;">
                <input type="checkbox" ${it.achete ? 'checked' : ''} onchange="basculerAchatCourse('${escapeJsStr(it.id)}')" style="width:18px; height:18px; accent-color:var(--primary);">
                <div style="${it.achete ? 'text-decoration:line-through; opacity:0.6;' : ''}">
                  <span style="font-weight:600; font-size:0.88rem;">${escapeHtml(it.nom)}</span>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${it.qte} ${escapeHtml(it.unite || '')} · ${escapeHtml(it.categorie || 'Ingrédient')}</div>
                </div>
              </label>
              <div style="display:flex; align-items:center; gap:8px;">
                ${prixActif ? `<span style="font-weight:700; font-size:0.85rem; white-space:nowrap; color:${it.achete ? 'var(--text-muted)' : 'var(--text)'};">${(it.prixReelPaye ?? it.prix ?? 0).toFixed(2)} €</span>` : ''}
                <button class="btn btn-secondary btn-sm" onclick="ouvrirModalModifierCourse('${escapeJsStr(it.id)}')" style="padding:4px 8px;">✎</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

export function basculerAchatCourse(id) {
  const item = appState.courses.find(c => c.id === id);
  if (!item) return;
  item.achete = !item.achete;
  sauvegarderDonnees();
  rendreCourses();
  if (typeof window.mettreAJourBadgeCourses === 'function') window.mettreAJourBadgeCourses();
}

export function basculerAchatGroupeCourses(idsCsv) {
  const ids = new Set(String(idsCsv || '').split(',').filter(Boolean));
  if (ids.size === 0) return;
  const items = appState.courses.filter(c => ids.has(c.id));
  if (items.length === 0) return;
  const nouveauStatut = !items.every(i => i.achete);
  items.forEach(i => { i.achete = nouveauStatut; });
  sauvegarderDonnees();
  rendreCourses();
  if (typeof window.mettreAJourBadgeCourses === 'function') window.mettreAJourBadgeCourses();
}

export function nettoyerCoursesAchetees() {
  const nbAchetees = appState.courses.filter(c => c.achete).length;
  if (nbAchetees === 0) {
    alert('Aucun article acheté à nettoyer.');
    return;
  }
  if (!confirm(`Supprimer les ${nbAchetees} articles déjà achetés ?`)) return;
  appState.courses = appState.courses.filter(c => !c.achete);
  sauvegarderDonnees();
  rendreCourses();
}

export function ouvrirModalModifierCourse(id) {
  const item = appState.courses.find(c => c.id === id);
  if (!item) return;
  document.getElementById('edit-course-id').value = item.id;
  document.getElementById('edit-course-nom').value = item.nom;
  document.getElementById('edit-course-qte').value = item.qte;
  document.getElementById('edit-course-unite').value = item.unite || '';
  document.getElementById('edit-course-prix').value = item.prixReelPaye || item.prix || 0;
  const editPrixGroup = document.getElementById('edit-course-prix-group');
  if (editPrixGroup) editPrixGroup.style.display = window.estOptionPrixActive() ? 'block' : 'none';

  document.getElementById('modal-edit-course').classList.add('active');
}

export function sauvegarderCourseModifiee() {
  const id = document.getElementById('edit-course-id').value;
  const item = appState.courses.find(c => c.id === id);
  if (!item) return;

  item.nom = document.getElementById('edit-course-nom').value.trim() || item.nom;
  item.qte = parseFloat(document.getElementById('edit-course-qte').value) || item.qte;
  item.unite = document.getElementById('edit-course-unite').value.trim() || item.unite;
  item.prixReelPaye = parseFloat(document.getElementById('edit-course-prix').value) || 0;
  item.prix = item.prixReelPaye;

  sauvegarderDonnees();
  window.fermerModals();
  rendreCourses();
}

export function supprimerCourseActuelle() {
  const id = document.getElementById('edit-course-id').value;
  appState.courses = appState.courses.filter(c => c.id !== id);
  sauvegarderDonnees();
  window.fermerModals();
  rendreCourses();
}

export function ouvrirModalAjoutCourseManuel() {
  const select = document.getElementById('add-course-projet-select');
  select.innerHTML = '<option value="">(Hors session / Général)</option>' +
    appState.projets.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.nom)}</option>`).join('');

  document.getElementById('add-course-nom').value = '';
  document.getElementById('add-course-qte').value = '1';
  document.getElementById('add-course-unite').value = 'lot';
  document.getElementById('add-course-prix').value = '5.0';
  const addPrixGroup = document.getElementById('add-course-prix-group');
  if (addPrixGroup) addPrixGroup.style.display = window.estOptionPrixActive() ? 'block' : 'none';

  document.getElementById('modal-ajout-course').classList.add('active');
}

export function confirmerAjoutCourseManuel() {
  const nom = (document.getElementById('add-course-nom').value || '').trim();
  if (!nom) {
    alert('Veuillez saisir un nom.');
    return;
  }
  const projId = document.getElementById('add-course-projet-select').value;
  const proj = appState.projets.find(p => p.id === projId);

  appState.courses.push({
    id: 'c_' + Math.random().toString(36).slice(2, 9),
    projetId: projId || null,
    nomProjet: proj ? proj.nom : 'Articles libres',
    nom: nom,
    categorie: document.getElementById('add-course-cat').value,
    qte: parseFloat(document.getElementById('add-course-qte').value) || 1,
    unite: document.getElementById('add-course-unite').value.trim() || 'lot',
    prix: parseFloat(document.getElementById('add-course-prix').value) || 0,
    prixReelPaye: parseFloat(document.getElementById('add-course-prix').value) || 0,
    achete: false
  });

  sauvegarderDonnees();
  window.fermerModals();
  rendreCourses();
}
