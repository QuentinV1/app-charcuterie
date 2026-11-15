import { appState, sauvegarderDonnees, escapeHtml, escapeJsStr } from './state.js';
export function rendreCourses() {
  const container = document.getElementById('courses-container');
  const totalDesc = document.getElementById('courses-total-desc');

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
        <div style="font-size: 3rem; margin-bottom: 12px;">🛒</div>
        <div style="font-weight: 700; font-size: 1.1rem; color: var(--text);">Votre panier est vide</div>
        <p style="font-size: 0.85rem; max-width: 320px; margin: 8px auto 16px;">Les ingrédients sont générés automatiquement lors de la planification d'une session.</p>
        <button class="btn btn-primary btn-sm" onclick="ouvrirModalAjoutCourseManuel()">+ Ajouter un article</button>
      </div>
    `;
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
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-light); padding-bottom:8px; margin-bottom:10px;">
          <div style="font-weight:800; font-size:0.95rem; color:var(--primary);">${escapeHtml(projNom)}</div>
          ${prixActif ? `<div style="font-size:0.8rem; font-weight:700;">${sTotal.toFixed(2)} €</div>` : ''}
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
                ${prixActif ? `<span style="font-weight:700; font-size:0.85rem; color:${it.achete ? 'var(--text-muted)' : 'var(--text)'};">${(it.prixReelPaye || it.prix || 0).toFixed(2)} €</span>` : ''}
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
