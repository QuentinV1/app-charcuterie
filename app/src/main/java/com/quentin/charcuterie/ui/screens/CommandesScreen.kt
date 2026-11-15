@file:OptIn(ExperimentalMaterial3Api::class)

package com.quentin.charcuterie.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.quentin.charcuterie.data.*
import com.quentin.charcuterie.domain.CalculateurCharcuterie
import com.quentin.charcuterie.ui.CharcuterieViewModel
import java.text.NumberFormat
import java.util.Locale

// ============================================================================================
// ÉCRAN SUIVI DE REVENTE & COMMANDES (MODERNE & SANS CHEVAUCHEMENT)
// ============================================================================================
@Composable
fun CommandesGlobalScreen(viewModel: CharcuterieViewModel) {
    val commandes by viewModel.commandes.collectAsState()
    val projets by viewModel.projets.collectAsState()
    val clients by viewModel.clients.collectAsState()
    var afficherClients by rememberSaveable { mutableStateOf(false) }
    var showAddCommande by remember { mutableStateOf(false) }
    var commandeAEditer by remember { mutableStateOf<ProjetCommandeEntity?>(null) }

    if (afficherClients) {
        BackHandler { afficherClients = false }
        ClientsScreen(
            viewModel = viewModel,
            onRetour = { afficherClients = false }
        )
        return
    }

    val totalCmd = commandes.sumOf { it.montantTotal }
    val totalPaye = commandes.filter { it.paye }.sumOf { it.montantTotal }
    val resteDu = (totalCmd - totalPaye).coerceAtLeast(0.0)

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 20.dp, bottom = 100.dp)
    ) {
        item(key = "header_revente") {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Suivi des ventes & paiements",
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(Modifier.height(2.dp))
                        Text(
                            text = "Revente",
                            style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                    }
                    OutlinedButton(
                        onClick = { afficherClients = true },
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Clients (${clients.size})", style = MaterialTheme.typography.labelMedium)
                    }
                }
                if (projets.isNotEmpty()) {
                    Button(
                        onClick = { showAddCommande = true },
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Nouvelle commande", style = MaterialTheme.typography.labelLarge)
                    }
                }
            }
        }

        // Résumé en 3 cartes côte à côte aérées
        item(key = "stats_revente") {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                ResumeStatCard(
                    titre = "Total ventes",
                    valeur = formatEuro(totalCmd),
                    couleurValeur = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.weight(1f)
                )
                ResumeStatCard(
                    titre = "Encaissé",
                    valeur = formatEuro(totalPaye),
                    couleurValeur = MaterialTheme.colorScheme.secondary,
                    modifier = Modifier.weight(1f)
                )
                ResumeStatCard(
                    titre = "Reste dû",
                    valeur = formatEuro(resteDu),
                    couleurValeur = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        if (commandes.isEmpty()) {
            item(key = "empty_revente") {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Text(
                        text = "Aucune revente enregistrée. Vous pouvez ajouter vos commandes détaillées ici ou dans l'onglet « Budget & Revente » de chaque projet.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(20.dp)
                    )
                }
            }
        }

        items(commandes, key = { "global_cmd_${it.id}" }) { cmd ->
            val nomProjet = projets.find { it.projet.id == cmd.projetId }?.projet?.nom ?: "Projet #${cmd.projetId}"
            CarteCommandeDetaillee(
                cmd = cmd,
                nomProjet = nomProjet,
                onTogglePaye = { viewModel.basculerCommandePayee(cmd) },
                onToggleLivre = { viewModel.basculerCommandeLivree(cmd) },
                onEdit = { commandeAEditer = cmd },
                onDelete = { viewModel.supprimerCommande(cmd) }
            )
        }
    }

    if (showAddCommande && projets.isNotEmpty()) {
        CommandeDetailleeDialog(
            projetComplet = null,
            projetsDisponibles = projets,
            clientsDisponibles = clients,
            commandeInitiale = null,
            onDismiss = { showAddCommande = false },
            onSaveWithProjet = { projetId, acheteur, lignes, paye, moyenPaiement, livre, commentaire ->
                viewModel.enregistrerCommandeDetaillee(
                    projetId = projetId,
                    nomAcheteur = acheteur,
                    lignes = lignes,
                    paye = paye,
                    moyenPaiement = moyenPaiement,
                    livre = livre,
                    commentaire = commentaire
                )
                showAddCommande = false
            }
        )
    }

    commandeAEditer?.let { cmd ->
        val projetAssocie = projets.find { it.projet.id == cmd.projetId }
        CommandeDetailleeDialog(
            projetComplet = projetAssocie,
            projetsDisponibles = projets,
            clientsDisponibles = clients,
            commandeInitiale = cmd,
            onDismiss = { commandeAEditer = null },
            onDelete = {
                viewModel.supprimerCommande(cmd)
                commandeAEditer = null
            },
            onSaveWithProjet = { projetId, acheteur, lignes, paye, moyenPaiement, livre, commentaire ->
                viewModel.modifierCommandeDetaillee(
                    commandeOrigine = cmd,
                    projetId = projetId,
                    nomAcheteur = acheteur,
                    lignes = lignes,
                    paye = paye,
                    moyenPaiement = moyenPaiement,
                    livre = livre,
                    commentaire = commentaire
                )
                commandeAEditer = null
            }
        )
    }
}

@Composable
private fun ResumeStatCard(
    titre: String,
    valeur: String,
    couleurValeur: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
    ) {
        Column(Modifier.padding(12.dp)) {
            Text(
                text = titre,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = valeur,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = couleurValeur,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

// ============================================================================================
// COMPOSANTS PARTAGÉS : CARTE COMMANDE DÉTAILLÉE & DIALOGUE MULTI-PRODUITS (AJOUT / ÉDITION)
// ============================================================================================

data class ProduitProposeCommande(
    val nom: String,
    val unite: String,
    val prixUnitaireConseille: Double
)

fun extraireProduitsProposesDuProjet(projetComplet: ProjetComplet?): List<ProduitProposeCommande> {
    if (projetComplet == null) return emptyList()
    val bilan = CalculateurCharcuterie.calculerBilanProjet(projetComplet)
    val prixMagretOuPrincipal = bilan.lignesProduits.find { it.codeSortie == "magret" }?.prixReventeConseilleUnitaire
        ?: bilan.lignesProduits.firstOrNull()?.prixReventeConseilleUnitaire
        ?: 6.0

    val result = mutableListOf<ProduitProposeCommande>()

    // 1. Lots / variantes du projet (ex: Magret séché Paprika, Magret séché Herbes, Magret séché Café...)
    projetComplet.lots.forEach { lot ->
        val nomPropre = if (lot.variante.isNotBlank() && !lot.variante.equals("Standard", ignoreCase = true)) {
            "${lot.nomProduit} ${lot.variante}"
        } else {
            lot.nomProduit
        }
        result.add(
            ProduitProposeCommande(
                nom = nomPropre,
                unite = lot.unite.ifBlank { "pièce" },
                prixUnitaireConseille = prixMagretOuPrincipal
            )
        )
    }

    // 2. Produits de découpe actifs (ex: Cuisses confites, Rillettes, Foie gras, Graisse...)
    projetComplet.sortiesDecoupe.filter { it.actif && it.quantiteReelle > 0.0 }.forEach { s ->
        // Si les magrets sont déjà détaillés par lot ci-dessus, on ne duplique pas la ligne générique "magret"
        if (s.codeSortie != "magret" || projetComplet.lots.isEmpty()) {
            val prixSortie = bilan.lignesProduits.find { it.codeSortie == s.codeSortie }?.prixReventeConseilleUnitaire
                ?: if (s.prixReventeUnitaire > 0.0) s.prixReventeUnitaire else s.valeurRefUnitaire
            result.add(
                ProduitProposeCommande(
                    nom = s.nom,
                    unite = s.unite.ifBlank { "pièce" },
                    prixUnitaireConseille = prixSortie
                )
            )
        }
    }

    return result.distinctBy { it.nom.lowercase() }
}

@Composable
fun CarteCommandeDetaillee(
    cmd: ProjetCommandeEntity,
    nomProjet: String?,
    onTogglePaye: () -> Unit,
    onToggleLivre: () -> Unit,
    onEdit: () -> Unit,
    onDelete: (() -> Unit)? = null
) {
    val lignes = remember(cmd) { cmd.extraireLignes() }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onEdit() },
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
    ) {
        Column(Modifier.padding(16.dp)) {
            // En-tête : Nom de l'acheteur + Projet éventuel + Montant total
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.Person,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = cmd.nomAcheteur,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    if (!nomProjet.isNullOrBlank()) {
                        Spacer(Modifier.height(2.dp))
                        Text(
                            text = nomProjet,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Spacer(Modifier.width(8.dp))
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(
                        text = formatEuro(cmd.montantTotal),
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.ExtraBold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(Modifier.height(10.dp))

            // Détail ligne par ligne des produits commandés avec prix unitaire et sous-total
            Surface(
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    lignes.forEachIndexed { idx, l ->
                        val qStr = if (l.quantite % 1.0 == 0.0) l.quantite.toInt().toString() else l.quantite.toString()
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "$qStr × ${l.produit}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "${formatEuro(l.prixUnitaire)} / ${l.unite}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Spacer(Modifier.width(8.dp))
                            Text(
                                text = formatEuro(l.sousTotal),
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                        if (idx < lignes.lastIndex) {
                            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                        }
                    }
                }
            }

            if (cmd.commentaire.isNotBlank() || cmd.moyenPaiement.isNotBlank()) {
                Spacer(Modifier.height(8.dp))
                val infos = listOfNotNull(
                    cmd.moyenPaiement.takeIf { it.isNotBlank() }?.let { "Paiement : $it" },
                    cmd.commentaire.takeIf { it.isNotBlank() }?.let { "Note : $it" }
                ).joinToString(" · ")
                Text(
                    text = infos,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(Modifier.height(10.dp))

            // Barre d'actions : Payé, Livré, Modifier, Supprimer
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                FilterChip(
                    selected = cmd.paye,
                    onClick = onTogglePaye,
                    label = { Text(if (cmd.paye) "Payé ✓" else "À payer") }
                )
                FilterChip(
                    selected = cmd.livre,
                    onClick = onToggleLivre,
                    label = { Text(if (cmd.livre) "Livré ✓" else "À livrer") }
                )
                Spacer(Modifier.weight(1f))
                IconButton(
                    onClick = onEdit,
                    modifier = Modifier.size(36.dp)
                ) {
                    Icon(
                        Icons.Outlined.Edit,
                        contentDescription = "Modifier la commande",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
                if (onDelete != null) {
                    IconButton(
                        onClick = onDelete,
                        modifier = Modifier.size(36.dp)
                    ) {
                        Icon(
                            Icons.Outlined.Delete,
                            contentDescription = "Supprimer la commande",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

private class DraftLigneCommandeState(
    produitInitial: String,
    quantiteInitiale: String,
    uniteInitiale: String,
    prixUnitaireInitial: String
) {
    var produit by mutableStateOf(produitInitial)
    var quantite by mutableStateOf(quantiteInitiale)
    var unite by mutableStateOf(uniteInitiale)
    var prixUnitaire by mutableStateOf(prixUnitaireInitial)

    val quantiteDouble: Double
        get() = quantite.replace(",", ".").toDoubleOrNull() ?: 0.0

    val prixUnitaireDouble: Double
        get() = prixUnitaire.replace(",", ".").toDoubleOrNull() ?: 0.0

    val sousTotal: Double
        get() = quantiteDouble * prixUnitaireDouble
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommandeDetailleeDialog(
    projetComplet: ProjetComplet?,
    projetsDisponibles: List<ProjetComplet> = emptyList(),
    clientsDisponibles: List<ClientEntity> = emptyList(),
    commandeInitiale: ProjetCommandeEntity? = null,
    onDismiss: () -> Unit,
    onDelete: (() -> Unit)? = null,
    onSaveWithProjet: ((projetId: Long, acheteur: String, lignes: List<LigneCommandeItem>, paye: Boolean, moyenPaiement: String, livre: Boolean, commentaire: String) -> Unit)? = null,
    onSave: ((acheteur: String, lignes: List<LigneCommandeItem>, paye: Boolean, moyenPaiement: String, livre: Boolean, commentaire: String) -> Unit)? = null
) {
    val estEdition = commandeInitiale != null
    var selectedProjetId by remember(commandeInitiale?.id, projetComplet?.projet?.id) {
        mutableLongStateOf(
            commandeInitiale?.projetId
                ?: projetComplet?.projet?.id
                ?: projetsDisponibles.firstOrNull()?.projet?.id
                ?: 0L
        )
    }
    val projetActif = remember(projetComplet, projetsDisponibles, selectedProjetId) {
        projetComplet ?: projetsDisponibles.find { it.projet.id == selectedProjetId } ?: projetsDisponibles.firstOrNull()
    }

    val produitsProposes = remember(projetActif) {
        extraireProduitsProposesDuProjet(projetActif)
    }

    val prixDefaut = remember(produitsProposes) {
        produitsProposes.firstOrNull()?.prixUnitaireConseille ?: 6.0
    }

    var acheteur by remember(commandeInitiale?.id) {
        mutableStateOf(commandeInitiale?.nomAcheteur ?: "")
    }
    var paye by remember(commandeInitiale?.id) {
        mutableStateOf(commandeInitiale?.paye ?: false)
    }
    var livre by remember(commandeInitiale?.id) {
        mutableStateOf(commandeInitiale?.livre ?: false)
    }
    var moyenPaiement by remember(commandeInitiale?.id) {
        mutableStateOf(commandeInitiale?.moyenPaiement?.ifBlank { "Wero / Espèces" } ?: "Wero / Espèces")
    }
    var commentaire by remember(commandeInitiale?.id) {
        mutableStateOf(commandeInitiale?.commentaire ?: "")
    }

    val lignesState = remember(commandeInitiale?.id) {
        val list = mutableStateListOf<DraftLigneCommandeState>()
        if (commandeInitiale != null) {
            commandeInitiale.extraireLignes().forEach { l ->
                val qStr = if (l.quantite % 1.0 == 0.0) l.quantite.toInt().toString() else l.quantite.toString()
                val puStr = "%.2f".format(Locale.US, l.prixUnitaire)
                list.add(DraftLigneCommandeState(l.produit, qStr, l.unite, puStr))
            }
        } else {
            val premierProd = produitsProposes.firstOrNull()
            list.add(
                DraftLigneCommandeState(
                    produitInitial = premierProd?.nom ?: (projetActif?.projet?.nomRecettePrincipale ?: "Magret séché Paprika"),
                    quantiteInitiale = "2",
                    uniteInitiale = premierProd?.unite ?: "pièce",
                    prixUnitaireInitial = "%.2f".format(Locale.US, premierProd?.prixUnitaireConseille ?: prixDefaut)
                )
            )
        }
        list
    }

    val totalCommande = lignesState.sumOf { it.sousTotal }
    val moyensDispos = listOf("Wero / Espèces", "Espèces", "Wero / Paylib", "Lydia", "Virement")

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.90f),
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 6.dp
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // En-tête fixe
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (estEdition) "Modifier la commande" else "Nouvelle commande détaillée",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Précisez chaque produit, sa quantité et son prix unitaire",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Fermer")
                    }
                }
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                // Corps déroulant
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 18.dp, vertical = 14.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Sélection du projet si ouvert depuis l'écran global Revente
                    if (projetComplet == null && projetsDisponibles.size > 1) {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                text = "Projet associé",
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.primary
                            )
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                items(projetsDisponibles, key = { "sel_proj_${it.projet.id}" }) { pc ->
                                    FilterChip(
                                        selected = selectedProjetId == pc.projet.id,
                                        onClick = { selectedProjetId = pc.projet.id },
                                        label = { Text(pc.projet.nom) }
                                    )
                                }
                            }
                        }
                    }

                    // 1. Acheteur
                    OutlinedTextField(
                        value = acheteur,
                        onValueChange = { acheteur = it },
                        label = { Text("Pour qui ? (ex: Baptiste et Pauline)") },
                        placeholder = { Text("Nom de l'acheteur ou du couple") },
                        leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                        trailingIcon = {
                            if (acheteur.isNotEmpty()) {
                                IconButton(onClick = { acheteur = "" }) {
                                    Icon(Icons.Default.Close, contentDescription = "Effacer")
                                }
                            }
                        },
                        singleLine = true,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    if (clientsDisponibles.isNotEmpty()) {
                        val clientsFiltres = remember(clientsDisponibles, acheteur) {
                            val q = acheteur.trim()
                            if (q.isBlank() || clientsDisponibles.any { it.nom.equals(q, ignoreCase = true) }) {
                                clientsDisponibles
                            } else {
                                clientsDisponibles.filter { it.nom.contains(q, ignoreCase = true) }
                            }
                        }
                        if (clientsFiltres.isNotEmpty()) {
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(
                                    text = "Clients enregistrés",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    items(clientsFiltres, key = { "cli_chip_${it.id}" }) { cli ->
                                        FilterChip(
                                            selected = acheteur.trim().equals(cli.nom.trim(), ignoreCase = true),
                                            onClick = { acheteur = cli.nom },
                                            label = { Text(cli.nom) },
                                            leadingIcon = {
                                                Icon(
                                                    Icons.Default.Person,
                                                    contentDescription = null,
                                                    modifier = Modifier.size(16.dp)
                                                )
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // 2. Sélection rapide des produits du projet (Lots + Découpe)
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Produits commandés (${lignesState.size})",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            FilledTonalButton(
                                onClick = {
                                    lignesState.add(
                                        DraftLigneCommandeState(
                                            produitInitial = "",
                                            quantiteInitiale = "2",
                                            uniteInitiale = "pièce",
                                            prixUnitaireInitial = "%.2f".format(Locale.US, prixDefaut)
                                        )
                                    )
                                },
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(4.dp))
                                Text("Ajouter un produit", style = MaterialTheme.typography.labelMedium)
                            }
                        }

                        if (produitsProposes.isNotEmpty()) {
                            Text(
                                text = "Touchez un produit du projet pour l'ajouter avec son prix conseillé :",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                items(produitsProposes, key = { "prop_${it.nom}" }) { prop ->
                                    SuggestionChip(
                                        onClick = {
                                            val existante = lignesState.find { it.produit.equals(prop.nom, ignoreCase = true) }
                                            val premiereVide = lignesState.firstOrNull { it.produit.isBlank() }
                                            when {
                                                existante != null -> {
                                                    val nvQte = existante.quantiteDouble + 1.0
                                                    existante.quantite = if (nvQte % 1.0 == 0.0) nvQte.toInt().toString() else nvQte.toString()
                                                }
                                                premiereVide != null -> {
                                                    premiereVide.produit = prop.nom
                                                    premiereVide.unite = prop.unite
                                                    premiereVide.prixUnitaire = "%.2f".format(Locale.US, prop.prixUnitaireConseille)
                                                }
                                                else -> {
                                                    lignesState.add(
                                                        DraftLigneCommandeState(
                                                            produitInitial = prop.nom,
                                                            quantiteInitiale = "2",
                                                            uniteInitiale = prop.unite,
                                                            prixUnitaireInitial = "%.2f".format(Locale.US, prop.prixUnitaireConseille)
                                                        )
                                                    )
                                                }
                                            }
                                        },
                                        label = {
                                            Text("+ ${prop.nom} (${formatEuro(prop.prixUnitaireConseille)})")
                                        },
                                        shape = RoundedCornerShape(10.dp)
                                    )
                                }
                            }
                        }

                        // Liste des lignes de produits de la commande
                        lignesState.forEachIndexed { idx, ligne ->
                            Card(
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
                                ),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        OutlinedTextField(
                                            value = ligne.produit,
                                            onValueChange = { ligne.produit = it },
                                            label = { Text("Produit #${idx + 1} (ex: Magret Paprika, Cuisse confite…)") },
                                            singleLine = true,
                                            shape = RoundedCornerShape(12.dp),
                                            modifier = Modifier.weight(1f)
                                        )
                                        if (lignesState.size > 1) {
                                            IconButton(
                                                onClick = { lignesState.removeAt(idx) },
                                                modifier = Modifier.size(32.dp)
                                            ) {
                                                Icon(
                                                    Icons.Default.Close,
                                                    contentDescription = "Retirer ce produit",
                                                    tint = MaterialTheme.colorScheme.error
                                                )
                                            }
                                        }
                                    }

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        FilledTonalIconButton(
                                            onClick = {
                                                val nv = (ligne.quantiteDouble - 1.0).coerceAtLeast(1.0)
                                                ligne.quantite = if (nv % 1.0 == 0.0) nv.toInt().toString() else nv.toString()
                                            },
                                            modifier = Modifier.size(34.dp)
                                        ) {
                                            Icon(Icons.Default.Remove, contentDescription = "Moins", modifier = Modifier.size(16.dp))
                                        }

                                        OutlinedTextField(
                                            value = ligne.quantite,
                                            onValueChange = { ligne.quantite = it },
                                            label = { Text("Qté") },
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                            singleLine = true,
                                            shape = RoundedCornerShape(12.dp),
                                            modifier = Modifier.weight(0.75f)
                                        )

                                        FilledTonalIconButton(
                                            onClick = {
                                                val nv = ligne.quantiteDouble + 1.0
                                                ligne.quantite = if (nv % 1.0 == 0.0) nv.toInt().toString() else nv.toString()
                                            },
                                            modifier = Modifier.size(34.dp)
                                        ) {
                                            Icon(Icons.Default.Add, contentDescription = "Plus", modifier = Modifier.size(16.dp))
                                        }

                                        OutlinedTextField(
                                            value = ligne.prixUnitaire,
                                            onValueChange = { ligne.prixUnitaire = it },
                                            label = { Text("Prix / u (€)") },
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                            singleLine = true,
                                            shape = RoundedCornerShape(12.dp),
                                            modifier = Modifier.weight(1f)
                                        )

                                        Surface(
                                            color = MaterialTheme.colorScheme.primaryContainer,
                                            shape = RoundedCornerShape(10.dp)
                                        ) {
                                            Text(
                                                text = formatEuro(ligne.sousTotal),
                                                style = MaterialTheme.typography.labelLarge,
                                                fontWeight = FontWeight.Bold,
                                                color = MaterialTheme.colorScheme.primary,
                                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 10.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // 3. Statut de paiement, livraison & note
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                    ) {
                        Column(
                            modifier = Modifier.padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text(
                                text = "Paiement & Livraison",
                                style = MaterialTheme.typography.titleSmall
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                FilterChip(
                                    selected = paye,
                                    onClick = { paye = !paye },
                                    label = { Text(if (paye) "Payé ✓" else "À payer") }
                                )
                                FilterChip(
                                    selected = livre,
                                    onClick = { livre = !livre },
                                    label = { Text(if (livre) "Livré ✓" else "À livrer") }
                                )
                            }
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                items(moyensDispos, key = { "moyen_$it" }) { m ->
                                    FilterChip(
                                        selected = moyenPaiement == m,
                                        onClick = { moyenPaiement = m },
                                        label = { Text(m) }
                                    )
                                }
                            }
                            OutlinedTextField(
                                value = commentaire,
                                onValueChange = { commentaire = it },
                                label = { Text("Commentaire / Précision (optionnel)") },
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                }

                // Pied de dialogue fixe avec Total & Boutons d'action
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 18.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Total de la commande",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Text(
                            text = formatEuro(totalCommande),
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (estEdition && onDelete != null) {
                            OutlinedButton(
                                onClick = onDelete,
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Outlined.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(4.dp))
                                Text("Supprimer")
                            }
                        } else {
                            OutlinedButton(
                                onClick = onDismiss,
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Annuler")
                            }
                        }
                        Button(
                            onClick = {
                                val lignesValides = lignesState.mapNotNull { st ->
                                    val nom = st.produit.trim()
                                    val q = st.quantiteDouble
                                    val pu = st.prixUnitaireDouble
                                    if (nom.isNotBlank() && q > 0.0) {
                                        LigneCommandeItem(
                                            produit = nom,
                                            quantite = q,
                                            unite = st.unite.trim().ifBlank { "pièce" },
                                            prixUnitaire = pu
                                        )
                                    } else null
                                }
                                if (acheteur.isNotBlank() && lignesValides.isNotEmpty()) {
                                    onSave?.invoke(acheteur.trim(), lignesValides, paye, moyenPaiement, livre, commentaire.trim())
                                    onSaveWithProjet?.invoke(selectedProjetId, acheteur.trim(), lignesValides, paye, moyenPaiement, livre, commentaire.trim())
                                }
                            },
                            enabled = acheteur.isNotBlank() && lignesState.any { it.produit.isNotBlank() && it.quantiteDouble > 0.0 },
                            modifier = Modifier.weight(1.4f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(if (estEdition) "Enregistrer" else "Valider la commande", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

fun formatEuro(montant: Double): String {
    return NumberFormat.getCurrencyInstance(Locale.FRANCE).format(montant)
}
