import { appState, sauvegarderDonnees, escapeHtml, escapeJsStr } from './state.js';
import { CalculateurCharcuterie } from './calculateur.js';

let cmdLignesDraft = [];

function parseDetailsLignes(detailsLignes, fallbackCmd) {
  if (detailsLignes && typeof detailsLignes === 'string' && detailsLignes.trim()) {
    const lignes = detailsLignes.split(';;').map(part => {
      const cols = part.split('||');
      if (cols.length >= 4) {
        return {
          produit: cols[0] || 'Charcuterie',
          quantite: parseFloat(cols[1]) || 1,
          unite: cols[2] || 'pièce',
          prixUnitaire: parseFloat(cols[3]) || 0
        };
      }
      return null;
    }).filter(Boolean);
    if (lignes.length > 0) return lignes;
  }
  if (fallbackCmd) {
    return [{
      produit: fallbackCmd.produit || 'Charcuterie',
      quantite: fallbackCmd.quantite || 1,
      unite: fallbackCmd.unite || 'pièce',
      prixUnitaire: fallbackCmd.prixUnitaire ?? ((fallbackCmd.montantTotal || fallbackCmd.prix || 0) / (fallbackCmd.quantite || 1))
    }];
  }
  return [];
}

function serializeDetailsLignes(lignes) {
  return lignes.map(l => `${(l.produit || 'Produit').replace(/\|\||;;/g, ' ')}||${l.quantite || 1}||${l.unite || 'pièce'}||${Number(l.prixUnitaire || 0).toFixed(2)}`).join(';;');
}

export function rendreRevente() {
  const container = document.getElementById('revente-container');
  const countBadge = document.getElementById('clients-count-badge');
  if (countBadge) countBadge.innerText = (appState.clients || []).length;

  const commandes = appState.commandes || [];
  const total = commandes.reduce((acc, c) => acc + (c.montantTotal || c.prix || 0), 0);
  const paye = commandes.filter(c => c.paye).reduce((acc, c) => acc + (c.montantTotal || c.prix || 0), 0);
  const reste = Math.max(0, total - paye);

  container.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:14px;">
      <div class="bilan-stat-card" style="padding:10px;">
        <div class="bilan-stat-label" style="font-size:0.68rem;">Total ventes</div>
        <div class="bilan-stat-val" style="font-size:1.05rem;">${total.toFixed(2)} €</div>
      </div>
      <div class="bilan-stat-card" style="padding:10px;">
        <div class="bilan-stat-label" style="font-size:0.68rem;">Encaissé</div>
        <div class="bilan-stat-val secondary" style="font-size:1.05rem;">${paye.toFixed(2)} €</div>
      </div>
      <div class="bilan-stat-card" style="padding:10px;">
        <div class="bilan-stat-label" style="font-size:0.68rem;">Reste dû</div>
        <div class="bilan-stat-val" style="font-size:1.05rem; color:${reste > 0 ? 'var(--danger)' : 'var(--secondary)'};">${reste.toFixed(2)} €</div>
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
      const lignes = parseDetailsLignes(cmd.detailsLignes, cmd);
      return `
        <div class="card" style="margin-bottom:10px; padding:12px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div style="flex:1; padding-right:8px;">
              <div style="font-weight:800; font-size:0.95rem;">${escapeHtml(cmd.nomAcheteur || cmd.client || 'Client')}</div>
              ${cmd.projetNom ? `<div style="font-size:0.72rem; color:var(--text-muted); margin-bottom:3px;">Session : ${escapeHtml(cmd.projetNom)}</div>` : ''}
              <div style="margin-top:4px;">
                ${lignes.map(l => {
                  const sub = (l.quantite || 1) * (l.prixUnitaire || 0);
                  return `<div style="font-size:0.8rem; color:var(--text);">${l.quantite} ${escapeHtml(l.unite)} × <strong>${escapeHtml(l.produit)}</strong> · ${Number(l.prixUnitaire || 0).toFixed(2)} €/${escapeHtml(l.unite)} = <strong>${sub.toFixed(2)} €</strong></div>`;
                }).join('')}
              </div>
              <div style="font-size:0.74rem; color:var(--text-muted); margin-top:4px;">
                ${cmd.moyenPaiement ? escapeHtml(cmd.moyenPaiement) : ''}
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:800; font-size:1.05rem; color:var(--primary);">${montant.toFixed(2)} €</div>
              <div style="display:flex; flex-direction:column; gap:4px; align-items:flex-end; margin-top:4px;">
                <span class="badge ${cmd.paye ? 'badge-green' : 'badge-muted'}" style="cursor:pointer;" onclick="basculerPaiementCommande('${escapeJsStr(cmd.id)}')">
                  ${cmd.paye ? 'Payé ✓' : 'À payer'}
                </span>
                <span class="badge ${cmd.livre ? 'badge-green' : 'badge-muted'}" style="cursor:pointer;" onclick="basculerLivraisonCommande('${escapeJsStr(cmd.id)}')">
                  ${cmd.livre ? 'Livré ✓' : 'À livrer'}
                </span>
              </div>
            </div>
          </div>
          ${cmd.commentaire ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:6px; font-style:italic;">« ${escapeHtml(cmd.commentaire)} »</div>` : ''}
          <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:10px; border-top:1px solid var(--border-light); padding-top:8px;">
            <button class="btn btn-secondary btn-sm" onclick="ouvrirModalModifierCommande('${escapeJsStr(cmd.id)}')">
              ✎ Modifier
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
  document.getElementById('cmd-moyen').value = 'Wero / Paylib';
  document.getElementById('cmd-paye').value = 'false';
  document.getElementById('cmd-livre').checked = false;
  document.getElementById('cmd-comm').value = '';

  const selectProj = document.getElementById('cmd-projet-select');
  selectProj.innerHTML = '<option value="">(Aucune session particulière)</option>' +
    appState.projets.map(p => `<option value="${escapeHtml(p.id)}" ${p.id === projIdPreselect ? 'selected' : ''}>${escapeHtml(p.nom)}</option>`).join('');

  cmdLignesDraft = [];
  remplirSuggestionsClientsModal();
  mettreAJourProduitsDepuisProjetModal();
  document.getElementById('modal-commande').classList.add('active');
}

export function rendreLignesCommandeModal() {
  const container = document.getElementById('cmd-lignes-container');
  const totalEl = document.getElementById('cmd-total-auto');
  if (!container) return;

  if (cmdLignesDraft.length === 0) {
    cmdLignesDraft.push({ produit: 'Charcuterie', quantite: 1, unite: 'pièce', prixUnitaire: 12.0 });
  }

  container.innerHTML = cmdLignesDraft.map((l, idx) => `
    <div class="cmd-line-item">
      <input type="text" class="form-control" style="flex:2; padding:6px 8px; font-size:0.8rem;" value="${escapeHtml(l.produit)}" onchange="modifierLigneCommandeModal(${idx}, 'produit', this.value)" placeholder="Produit">
      <input type="number" step="0.5" min="0.5" class="form-control" style="width:58px; padding:6px; font-size:0.8rem;" value="${l.quantite}" oninput="modifierLigneCommandeModal(${idx}, 'quantite', this.value)">
      <input type="text" class="form-control" style="width:54px; padding:6px; font-size:0.78rem;" value="${escapeHtml(l.unite)}" onchange="modifierLigneCommandeModal(${idx}, 'unite', this.value)" placeholder="u.">
      <input type="number" step="0.1" min="0" class="form-control" style="width:66px; padding:6px; font-size:0.8rem;" value="${l.prixUnitaire}" oninput="modifierLigneCommandeModal(${idx}, 'prixUnitaire', this.value)" title="Prix unitaire (€)">
      ${cmdLignesDraft.length > 1 ? `<button type="button" class="btn-icon" style="color:var(--danger); padding:2px 6px;" onclick="supprimerLigneCommandeModal(${idx})">✕</button>` : ''}
    </div>
  `).join('');

  const total = cmdLignesDraft.reduce((acc, l) => acc + (l.quantite || 0) * (l.prixUnitaire || 0), 0);
  if (totalEl) totalEl.innerText = total.toFixed(2) + ' €';
  const prixHidden = document.getElementById('cmd-prix');
  if (prixHidden) prixHidden.value = total.toFixed(2);
}

export function ajouterLigneCommandeModal(produit = '', quantite = 1, unite = 'pièce', prixUnitaire = 12.0) {
  if (cmdLignesDraft.length === 1 && cmdLignesDraft[0].produit === 'Charcuterie' && !produit) {
    // keep
  } else if (cmdLignesDraft.length === 1 && cmdLignesDraft[0].produit === 'Charcuterie' && produit) {
    cmdLignesDraft[0] = { produit, quantite, unite, prixUnitaire };
    rendreLignesCommandeModal();
    return;
  }
  cmdLignesDraft.push({ produit: produit || 'Charcuterie', quantite, unite, prixUnitaire });
  rendreLignesCommandeModal();
}

export function modifierLigneCommandeModal(idx, champ, valeur) {
  const l = cmdLignesDraft[idx];
  if (!l) return;
  if (champ === 'produit') l.produit = String(valeur || '');
  else if (champ === 'unite') l.unite = String(valeur || 'pièce');
  else if (champ === 'quantite') l.quantite = parseFloat(valeur) || 0;
  else if (champ === 'prixUnitaire') l.prixUnitaire = parseFloat(valeur) || 0;
  const total = cmdLignesDraft.reduce((acc, x) => acc + (x.quantite || 0) * (x.prixUnitaire || 0), 0);
  const totalEl = document.getElementById('cmd-total-auto');
  if (totalEl) totalEl.innerText = total.toFixed(2) + ' €';
  const prixHidden = document.getElementById('cmd-prix');
  if (prixHidden) prixHidden.value = total.toFixed(2);
}

export function supprimerLigneCommandeModal(idx) {
  cmdLignesDraft.splice(idx, 1);
  rendreLignesCommandeModal();
}

export function recalculerTotalCommandeModal() {
  rendreLignesCommandeModal();
}

export function mettreAJourProduitsDepuisProjetModal() {
  const projId = document.getElementById('cmd-projet-select').value;
  const chipsWrap = document.getElementById('cmd-produits-chips-wrap');
  const chipsCont = document.getElementById('cmd-produits-chips');
  const p = appState.projets.find(x => x.id === projId);

  if (!p) {
    if (chipsWrap) chipsWrap.style.display = 'none';
    if (cmdLignesDraft.length === 0) rendreLignesCommandeModal();
    return;
  }

  const bilan = CalculateurCharcuterie.calculerBilanProjet(p);
  const suggestions = [];

  (p.lots || []).forEach(lot => {
    const nom = `${lot.nomProduit || p.nomRecettePrincipale || 'Produit'} - ${lot.variante || 'Standard'}`;
    const unite = lot.unite || 'pièce';
    const ligneBilan = (bilan.lignesProduits || []).find(lp => lp.nom === lot.nomProduit) || bilan.lignesProduits[0];
    const prix = ligneBilan ? Number(ligneBilan.prixReventeConseilleUnitaire.toFixed(2)) : 12.0;
    suggestions.push({ nom, unite, prix });
  });

  (bilan.lignesProduits || []).forEach(lp => {
    if (!suggestions.some(s => s.nom.toLowerCase().includes(lp.nom.toLowerCase()))) {
      suggestions.push({ nom: lp.nom, unite: lp.unite || 'pièce', prix: Number(lp.prixReventeConseilleUnitaire.toFixed(2)) });
    }
  });

  if (chipsWrap && chipsCont) {
    if (suggestions.length > 0) {
      chipsWrap.style.display = 'block';
      chipsCont.innerHTML = suggestions.map(s => `
        <button type="button" class="cmd-chip" onclick="ajouterLigneCommandeModal('${escapeJsStr(s.nom)}', 1, '${escapeJsStr(s.unite)}', ${s.prix})">
          + ${escapeHtml(s.nom)} (${s.prix.toFixed(2)} €/${escapeHtml(s.unite)})
        </button>
      `).join('');
    } else {
      chipsWrap.style.display = 'none';
    }
  }

  if (cmdLignesDraft.length === 0 && suggestions.length > 0) {
    cmdLignesDraft.push({ produit: suggestions[0].nom, quantite: 1, unite: suggestions[0].unite, prixUnitaire: suggestions[0].prix });
  }
  rendreLignesCommandeModal();
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
  const lignesValides = cmdLignesDraft.filter(l => (l.produit || '').trim() && (l.quantite || 0) > 0);
  if (lignesValides.length === 0) {
    alert('Veuillez ajouter au moins un produit.');
    return;
  }

  const first = lignesValides[0];
  const produit = lignesValides.length === 1 ? first.produit : lignesValides.map(l => `${l.quantite}× ${l.produit}`).join(' + ');
  const qte = lignesValides.reduce((acc, l) => acc + (l.quantite || 0), 0);
  const unite = lignesValides.length === 1 ? (first.unite || 'pièce') : 'articles';
  const total = lignesValides.reduce((acc, l) => acc + (l.quantite || 0) * (l.prixUnitaire || 0), 0);
  const unit = qte > 0 ? total / qte : first.prixUnitaire;
  const detailsLignes = serializeDetailsLignes(lignesValides);

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
      cmd.unite = unite;
      cmd.prixUnitaire = unit;
      cmd.montantTotal = total;
      cmd.prix = total;
      cmd.detailsLignes = detailsLignes;
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
      unite: unite,
      prixUnitaire: unit,
      montantTotal: total,
      prix: total,
      detailsLignes: detailsLignes,
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
    const parts = (c.nom || '?').trim().split(/\s+/);
    const initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : (parts[0].slice(0, 2)).toUpperCase();

    return `
      <div class="card" style="margin-bottom:10px; padding:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="client-avatar">${escapeHtml(initials)}</div>
            <div>
              <div style="font-weight:700; font-size:1rem;">${escapeHtml(c.nom)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${cmds.length} commande${cmds.length > 1 ? 's' : ''} · Total : ${totalAchats.toFixed(2)} €</div>
            </div>
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
  document.getElementById('modal-cmd-titre').innerText = 'Modifier la commande';
  document.getElementById('cmd-client-nom').value = cmd.nomAcheteur || cmd.client || '';
  cmdLignesDraft = parseDetailsLignes(cmd.detailsLignes, cmd);
  rendreLignesCommandeModal();
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
