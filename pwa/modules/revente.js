import { appState, sauvegarderDonnees, escapeHtml, escapeJsStr } from './state.js';
export function rendreRevente() {
  const container = document.getElementById('revente-container');
  const countBadge = document.getElementById('clients-count-badge');
  if (countBadge) countBadge.innerText = (appState.clients || []).length;

  const commandes = appState.commandes || [];
  const total = commandes.reduce((acc, c) => acc + (c.montantTotal || c.prix || 0), 0);
  const paye = commandes.filter(c => c.paye).reduce((acc, c) => acc + (c.montantTotal || c.prix || 0), 0);
  const reste = Math.max(0, total - paye);

  container.innerHTML = `
    <div class="bilan-grid">
      <div class="bilan-stat-card">
        <div class="bilan-stat-label">Total Commandes</div>
        <div class="bilan-stat-val">${total.toFixed(2)} €</div>
      </div>
      <div class="bilan-stat-card">
        <div class="bilan-stat-label">Encaissé (Payé)</div>
        <div class="bilan-stat-val secondary">${paye.toFixed(2)} €</div>
      </div>
    </div>
    <div class="card" style="margin-bottom:14px; padding:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:700;">Reste à percevoir</span>
        <strong style="color:var(--danger); font-size:1.1rem;">${reste.toFixed(2)} €</strong>
      </div>
    </div>

    <div style="font-weight:700; margin-bottom:8px;">Commandes réservées</div>
    ${commandes.length === 0 ? `
      <div style="text-align:center; padding:32px; color:var(--text-muted);">
        Aucune commande enregistrée.<br>
        <button class="btn btn-primary btn-sm" style="margin-top:10px;" onclick="ouvrirModalNouvelleCommande()">+ Ajouter une commande</button>
      </div>
    ` : commandes.map(cmd => {
      const montant = cmd.montantTotal || cmd.prix || 0;
      return `
        <div class="card" style="margin-bottom:10px; padding:12px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div style="font-weight:800; font-size:0.95rem;">${escapeHtml(cmd.nomAcheteur || cmd.client || 'Client')}</div>
              <div style="font-size:0.82rem; color:var(--text); margin-top:2px;">
                ${(() => { const q = cmd.quantite || 1; const u = cmd.unite || 'pièce'; const uPl = (q > 1 && u === 'pièce') ? 'pièces' : u; return `${q} ${escapeHtml(uPl)}`; })()} · <strong>${escapeHtml(cmd.produit || 'Produit')}</strong>
              </div>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                ${cmd.moyenPaiement ? escapeHtml(cmd.moyenPaiement) + ' · ' : ''}${cmd.livre ? 'Livré' : 'À livrer'}
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:800; font-size:1.05rem; color:var(--primary);">${montant.toFixed(2)} €</div>
              <span class="badge ${cmd.paye ? 'badge-green' : 'badge-muted'}" style="cursor:pointer;" onclick="basculerPaiementCommande('${escapeJsStr(cmd.id)}')">
                ${cmd.paye ? '✓ Payé' : 'En attente'}
              </span>
            </div>
          </div>
          ${cmd.commentaire ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:6px; font-style:italic;">« ${escapeHtml(cmd.commentaire)} »</div>` : ''}
          <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:10px; border-top:1px solid var(--border-light); padding-top:8px;">
            <button class="btn btn-secondary btn-sm" onclick="ouvrirModalModifierCommande('${escapeJsStr(cmd.id)}')">
              ✎ Modifier
            </button>
            <button class="btn btn-secondary btn-sm" onclick="basculerLivraisonCommande('${escapeJsStr(cmd.id)}')">
              ${cmd.livre ? 'Marquer non livré' : '✓ Marquer livré'}
            </button>
            <button class="btn btn-secondary btn-sm" onclick="supprimerCommande('${escapeJsStr(cmd.id)}')" style="color:var(--danger);">
              Supprimer
            </button>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

export function basculerPaiementCommande(id) {
  const cmd = appState.commandes.find(c => c.id === id);
  if (!cmd) return;
  cmd.paye = !cmd.paye;
  sauvegarderDonnees();
  rendreRevente();
}

export function basculerLivraisonCommande(id) {
  const cmd = appState.commandes.find(c => c.id === id);
  if (!cmd) return;
  cmd.livre = !cmd.livre;
  sauvegarderDonnees();
  rendreRevente();
}

export function supprimerCommande(id) {
  if (!confirm('Supprimer cette commande ?')) return;
  appState.commandes = appState.commandes.filter(c => c.id !== id);
  sauvegarderDonnees();
  rendreRevente();
}

export function ouvrirModalNouvelleCommande(projIdPreselect = null) {
  document.getElementById('cmd-edit-id').value = '';
  document.getElementById('modal-cmd-titre').innerText = 'Nouvelle commande';
  document.getElementById('cmd-client-nom').value = '';
  document.getElementById('cmd-produit').value = '';
  document.getElementById('cmd-qte').value = '1';
  document.getElementById('cmd-prix-unit').value = '12.0';
  document.getElementById('cmd-prix').value = '12.0';
  document.getElementById('cmd-moyen').value = 'Wero / Paylib';
  document.getElementById('cmd-paye').value = 'false';
  document.getElementById('cmd-livre').checked = false;
  document.getElementById('cmd-comm').value = '';

  const selectProj = document.getElementById('cmd-projet-select');
  selectProj.innerHTML = '<option value="">(Aucune session particulière)</option>' +
    appState.projets.map(p => `<option value="${escapeHtml(p.id)}" ${p.id === projIdPreselect ? 'selected' : ''}>${escapeHtml(p.nom)}</option>`).join('');

  remplirSuggestionsClientsModal();
  mettreAJourProduitsDepuisProjetModal();
  document.getElementById('modal-commande').classList.add('active');
}

export function recalculerTotalCommandeModal() {
  const qte = parseFloat(document.getElementById('cmd-qte').value) || 1;
  const unit = parseFloat(document.getElementById('cmd-prix-unit').value) || 0;
  document.getElementById('cmd-prix').value = (qte * unit).toFixed(2);
}

export function mettreAJourProduitsDepuisProjetModal() {
  const projId = document.getElementById('cmd-projet-select').value;
  const p = appState.projets.find(x => x.id === projId);
  if (!p) return;
  if (p.lots && p.lots.length > 0) {
    document.getElementById('cmd-produit').value = `${p.lots[0].nomProduit} - ${p.lots[0].variante}`;
  }
}

export function remplirSuggestionsClientsModal() {
  const wrap = document.getElementById('cmd-clients-chips-wrap');
  const container = document.getElementById('cmd-clients-chips');
  const clients = appState.clients || [];

  if (clients.length === 0) {
    wrap.style.display = 'none';
    return;
  }
  wrap.style.display = 'block';
  container.innerHTML = clients.map(c => `
    <button type="button" class="chip-sm" onclick="document.getElementById('cmd-client-nom').value='${escapeJsStr(c.nom)}';">${escapeHtml(c.nom)}</button>
  `).join('');
}

export function sauvegarderCommandeModal() {
  const clientNom = (document.getElementById('cmd-client-nom').value || '').trim();
  if (!clientNom) {
    alert('Veuillez saisir le nom du client.');
    return;
  }
  const produit = (document.getElementById('cmd-produit').value || '').trim() || 'Charcuterie';
  const qte = parseFloat(document.getElementById('cmd-qte').value) || 1;
  const unitParsed = parseFloat(document.getElementById('cmd-prix-unit').value);
  const unit = Number.isNaN(unitParsed) ? 0 : unitParsed;
  const totalParsed = parseFloat(document.getElementById('cmd-prix').value);
  const total = Number.isNaN(totalParsed) ? (qte * unit) : totalParsed;
  const moyen = document.getElementById('cmd-moyen').value;
  const paye = document.getElementById('cmd-paye').value === 'true';
  const livre = document.getElementById('cmd-livre').checked;
  const comm = (document.getElementById('cmd-comm').value || '').trim();
  const projId = document.getElementById('cmd-projet-select').value;
  const proj = appState.projets.find(x => x.id === projId);

  // Enregistrer client si nouveau
  enregistrerClientSiNouveau(clientNom);

  const editId = document.getElementById('cmd-edit-id').value;
  if (editId) {
    const cmd = appState.commandes.find(c => c.id === editId);
    if (cmd) {
      cmd.projetId = projId || null;
      cmd.projetNom = proj ? proj.nom : '';
      cmd.nomAcheteur = clientNom;
      cmd.client = clientNom;
      cmd.produit = produit;
      cmd.quantite = qte;
      cmd.prixUnitaire = unit;
      cmd.montantTotal = total;
      cmd.prix = total;
      cmd.moyenPaiement = moyen;
      cmd.paye = paye;
      cmd.livre = livre;
      cmd.commentaire = comm;
    }
  } else {
    appState.commandes.push({
      id: 'cmd_' + Date.now(),
      projetId: projId || null,
      projetNom: proj ? proj.nom : '',
      nomAcheteur: clientNom,
      client: clientNom,
      produit: produit,
      quantite: qte,
      unite: 'pièce',
      prixUnitaire: unit,
      montantTotal: total,
      prix: total,
      moyenPaiement: moyen,
      paye: paye,
      livre: livre,
      commentaire: comm
    });
  }

  sauvegarderDonnees();
  window.fermerModals();
  rendreRevente();
}

export function enregistrerClientSiNouveau(nom) {
  if (!nom || !nom.trim()) return;
  const n = nom.trim();
  if (!appState.clients.some(c => c.nom.toLowerCase() === n.toLowerCase())) {
    appState.clients.push({ id: 'cli_' + Date.now(), nom: n });
  }
}

// Clients Subview
export function rendreClients() {
  const container = document.getElementById('clients-list');
  const summary = document.getElementById('clients-summary');
  const query = (document.getElementById('search-clients').value || '').trim().toLowerCase();

  let list = appState.clients || [];
  if (query) {
    list = list.filter(c => c.nom.toLowerCase().includes(query));
  }

  summary.innerText = `${list.length} client${list.length > 1 ? 's' : ''} enregistré${list.length > 1 ? 's' : ''}`;

  if (list.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:32px; color:var(--text-muted);">Aucun client enregistré.</div>';
    return;
  }

  container.innerHTML = list.map(c => {
    const cmds = appState.commandes.filter(cmd => (cmd.nomAcheteur || cmd.client || '').trim().toLowerCase() === c.nom.trim().toLowerCase());
    const totalAchats = cmds.reduce((acc, cmd) => acc + (cmd.montantTotal || cmd.prix || 0), 0);

    return `
      <div class="card" style="margin-bottom:10px; padding:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:700; font-size:1rem;">${escapeHtml(c.nom)}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${cmds.length} commande${cmds.length > 1 ? 's' : ''} · Total : ${totalAchats.toFixed(2)} €</div>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            <button class="btn btn-secondary btn-sm" onclick="ouvrirModalModifierClient('${escapeJsStr(c.id)}')" title="Modifier">✎</button>
            <button class="btn btn-secondary btn-sm" onclick="supprimerClient('${escapeJsStr(c.id)}')" style="color:var(--danger);" title="Supprimer">✕</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

export function ouvrirModalModifierCommande(id) {
  const cmd = (appState.commandes || []).find(c => c.id === id);
  if (!cmd) return;
  ouvrirModalNouvelleCommande(cmd.projetId || null);
  document.getElementById('cmd-edit-id').value = cmd.id;
  document.getElementById('cmd-client-nom').value = cmd.nomAcheteur || cmd.client || '';
  document.getElementById('cmd-produit').value = cmd.produit || '';
  document.getElementById('cmd-qte').value = cmd.quantite ?? 1;
  document.getElementById('cmd-prix-unit').value = cmd.prixUnitaire ?? 0;
  document.getElementById('cmd-prix').value = (cmd.montantTotal ?? cmd.prix ?? 0).toFixed(2);
  document.getElementById('cmd-moyen').value = cmd.moyenPaiement || 'Wero / Paylib';
  document.getElementById('cmd-paye').value = cmd.paye ? 'true' : 'false';
  document.getElementById('cmd-livre').checked = !!cmd.livre;
  document.getElementById('cmd-comm').value = cmd.commentaire || '';
}

export function ouvrirModalClient() {
  document.getElementById('client-edit-id').value = '';
  document.getElementById('client-nom-input').value = '';
  document.getElementById('modal-client').classList.add('active');
}

export function ouvrirModalModifierClient(id) {
  const c = (appState.clients || []).find(x => x.id === id);
  if (!c) return;
  document.getElementById('client-edit-id').value = c.id;
  document.getElementById('client-nom-input').value = c.nom || '';
  document.getElementById('modal-client').classList.add('active');
}

export function sauvegarderClientModal() {
  const nom = (document.getElementById('client-nom-input').value || '').trim();
  if (!nom) return;
  const editId = document.getElementById('client-edit-id').value;
  if (editId) {
    const client = (appState.clients || []).find(c => c.id === editId);
    if (client) {
      const ancienNom = (client.nom || '').trim().toLowerCase();
      client.nom = nom;
      (appState.commandes || []).forEach(cmd => {
        if ((cmd.nomAcheteur || cmd.client || '').trim().toLowerCase() === ancienNom) {
          cmd.nomAcheteur = nom;
          cmd.client = nom;
        }
      });
    }
  } else {
    enregistrerClientSiNouveau(nom);
  }
  sauvegarderDonnees();
  window.fermerModals();
  rendreClients();
  rendreRevente();
}

export function supprimerClient(id) {
  if (!confirm('Supprimer ce client ?')) return;
  appState.clients = appState.clients.filter(c => c.id !== id);
  sauvegarderDonnees();
  rendreClients();
}
