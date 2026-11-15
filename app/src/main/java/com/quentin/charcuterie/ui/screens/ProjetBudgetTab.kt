@file:OptIn(ExperimentalMaterial3Api::class)

package com.quentin.charcuterie.ui.screens

import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.quentin.charcuterie.R
import com.quentin.charcuterie.data.*
import com.quentin.charcuterie.domain.CalculateurCharcuterie
import com.quentin.charcuterie.ui.CharcuterieViewModel
import com.quentin.charcuterie.ui.LotDraft
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.text.input.KeyboardType

// ============================================================================================
// ONGLET 3 : BUDGET, RENTABILITÉ & REVENTE (AVEC OPTION REVENTE AFFICHABLE / MASQUABLE)
// ============================================================================================
@Composable
internal fun OngletBudgetEtRevente(
    projetComplet: ProjetComplet,
    viewModel: CharcuterieViewModel
) {
    val p = projetComplet.projet
    val bilan = CalculateurCharcuterie.calculerBilanProjet(projetComplet)
    var showEditParams by remember { mutableStateOf(false) }
    var ligneProduitAEditer by remember { mutableStateOf<com.quentin.charcuterie.domain.LigneRentabiliteProduit?>(null) }
    var showAddCommande by remember { mutableStateOf(false) }
    var commandeAEditer by remember { mutableStateOf<ProjetCommandeEntity?>(null) }

    val prixProduitConseille = bilan.lignesProduits.find { it.codeSortie == "magret" }?.prixReventeConseilleUnitaire
        ?: bilan.lignesProduits.firstOrNull()?.prixReventeConseilleUnitaire
        ?: 5.55

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 18.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 90.dp)
    ) {
        // 1. Résumé financier clair + Option Revente modifiable
        item(key = "budget_resume") {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Column(Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Budget du projet",
                            style = MaterialTheme.typography.titleLarge,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedButton(
                            onClick = { showEditParams = true },
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Modifier prix")
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    LigneBilan("Matière première (${p.quantiteBaseReelle.toInt()} × ${formatEuro(p.prixUnitaireMatiereBase)})", formatEuro(bilan.coutMatierePremiereTotal))
                    LigneBilan("Sel, épices & bocaux", formatEuro(bilan.coutIngredientsEtFraisTotal))
                    HorizontalDivider(Modifier.padding(vertical = 8.dp), color = MaterialTheme.colorScheme.outlineVariant)
                    LigneBilan("Coût de revient total", formatEuro(bilan.coutRevientGlobal), gras = true)
                    LigneBilan("Valeur en boutique", formatEuro(bilan.valeurRefBoutiqueGlobale))
                    LigneBilan("Économie réalisée", formatEuro(bilan.economieRealiseeVsBoutique), accent = true)

                    Spacer(Modifier.height(12.dp))
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    Spacer(Modifier.height(10.dp))

                    // Commutateur pour afficher / masquer les éléments de revente sur ce projet
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { viewModel.basculerReventeProjet(p, !p.activerRevente) },
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Option Revente",
                                style = MaterialTheme.typography.titleSmall
                            )
                            Text(
                                text = if (p.activerRevente) "Affiche les prix de revente conseillés et les commandes"
                                else "Masquée (affiche uniquement vos coûts de revient)",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Spacer(Modifier.width(8.dp))
                        Switch(
                            checked = p.activerRevente,
                            onCheckedChange = { viewModel.basculerReventeProjet(p, it) }
                        )
                    }
                }
            }
        }

        // 2. Prix de revient (et prix de revente par produit si l'option Revente est activée)
        item(key = "header_prix_revient") {
            Column {
                Text(
                    text = if (p.activerRevente) "Prix de revient & prix de revente par produit"
                    else "Prix de revient unitaire par produit",
                    style = MaterialTheme.typography.titleMedium
                )
                if (p.activerRevente) {
                    Text(
                        text = "Touchez un produit (magret, cuisses, rillettes…) pour personnaliser son prix de revente unitaire.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        items(
            items = bilan.lignesProduits.filter { it.actif && it.quantiteReelle > 0.0 },
            key = { "bilan_prod_${it.codeSortie}_${it.nom}" }
        ) { l ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { ligneProduitAEditer = l },
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "${l.nom} (${l.quantiteReelle} ${l.unite})",
                            style = MaterialTheme.typography.titleSmall
                        )
                        Text(
                            text = "Revient : ${formatEuro(l.coutRevientUnitaire)} / ${l.unite}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Spacer(Modifier.width(8.dp))
                    if (p.activerRevente) {
                        Surface(
                            color = MaterialTheme.colorScheme.primaryContainer,
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Revente : ${formatEuro(l.prixReventeConseilleUnitaire)}",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(Modifier.width(6.dp))
                                Icon(
                                    Icons.Default.Edit,
                                    contentDescription = "Modifier le prix de ${l.nom}",
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                        }
                    } else {
                        Surface(
                            color = MaterialTheme.colorScheme.surfaceVariant,
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text(
                                text = formatEuro(l.coutRevientUnitaire),
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                            )
                        }
                    }
                }
            }
        }

        // 3. Section Revente & Commandes (affichée uniquement si l'option Revente est active !)
        if (p.activerRevente) {
            item(key = "header_commandes") {
                Spacer(Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Commandes & Revente",
                            style = MaterialTheme.typography.titleLarge
                        )
                        Text(
                            text = "Encaissé : ${formatEuro(bilan.totalPayeParAmis)} · Reste dû : ${formatEuro(bilan.resteAPayerParAmis)}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Spacer(Modifier.width(8.dp))
                    Button(
                        onClick = { showAddCommande = true },
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Ajouter")
                    }
                }
            }

            if (projetComplet.commandes.isEmpty()) {
                item(key = "empty_commandes") {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
                    ) {
                        Text(
                            text = "Aucune commande enregistrée sur ce projet. Cliquez sur « Ajouter » pour détailler les produits vendus à vos proches.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }
            }

            items(projetComplet.commandes, key = { "cmd_${it.id}" }) { cmd ->
                CarteCommandeDetaillee(
                    cmd = cmd,
                    nomProjet = null,
                    onTogglePaye = { viewModel.basculerCommandePayee(cmd) },
                    onToggleLivre = { viewModel.basculerCommandeLivree(cmd) },
                    onEdit = { commandeAEditer = cmd },
                    onDelete = { viewModel.supprimerCommande(cmd) }
                )
            }
        }
    }

    // Dialogue d'édition directe du prix de revente d'un produit spécifique (Magret, Cuisses confites, Rillettes, Graisse…)
    ligneProduitAEditer?.let { l ->
        val sortieAssociee = projetComplet.sortiesDecoupe.find { it.codeSortie == l.codeSortie && it.nom == l.nom }
            ?: projetComplet.sortiesDecoupe.find { it.codeSortie == l.codeSortie }
        val prixAutoSansOverride = l.coutRevientUnitaire * (1.0 + (p.margeTravailPct / 100.0))
        var prixRevStr by remember(l.codeSortie, l.nom) {
            mutableStateOf("%.2f".format(Locale.US, l.prixReventeConseilleUnitaire))
        }
        var qteReelleStr by remember(l.codeSortie, l.nom) {
            mutableStateOf(
                if (l.quantiteReelle % 1.0 == 0.0) l.quantiteReelle.toInt().toString()
                else l.quantiteReelle.toString()
            )
        }

        AlertDialog(
            onDismissRequest = { ligneProduitAEditer = null },
            title = { Text("Prix · ${l.nom}") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(Modifier.padding(10.dp)) {
                            Text(
                                text = "Coût de revient calculé : ${formatEuro(l.coutRevientUnitaire)} / ${l.unite}",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "Valeur boutique réf. : ${formatEuro(l.valeurRefUnitaire)} / ${l.unite}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    OutlinedTextField(
                        value = prixRevStr,
                        onValueChange = { prixRevStr = it },
                        label = { Text("Prix de revente unitaire (€ / ${l.unite})") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.fillMaxWidth()
                    )

                    TextButton(
                        onClick = {
                            prixRevStr = "%.2f".format(Locale.US, prixAutoSansOverride)
                        },
                        contentPadding = PaddingValues(horizontal = 4.dp, vertical = 0.dp)
                    ) {
                        Text(
                            "Calcul auto (+${p.margeTravailPct.toInt()}%) : ${formatEuro(prixAutoSansOverride)}",
                            style = MaterialTheme.typography.labelMedium
                        )
                    }

                    if (sortieAssociee != null) {
                        OutlinedTextField(
                            value = qteReelleStr,
                            onValueChange = { qteReelleStr = it },
                            label = { Text("Quantité obtenue (${l.unite})") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            },
            confirmButton = {
                Button(onClick = {
                    val nvPrix = prixRevStr.replace(",", ".").toDoubleOrNull() ?: l.prixReventeConseilleUnitaire
                    val nvQte = qteReelleStr.replace(",", ".").toDoubleOrNull() ?: l.quantiteReelle
                    if (sortieAssociee != null) {
                        viewModel.mettreAJourSortieDecoupe(
                            sortie = sortieAssociee,
                            actif = sortieAssociee.actif,
                            quantiteReelle = nvQte,
                            valeurRefUnitaire = sortieAssociee.valeurRefUnitaire,
                            fraisTransfoUnitaire = sortieAssociee.fraisTransfoUnitaire,
                            commentaire = sortieAssociee.commentaireSortie,
                            prixReventeUnitaire = nvPrix
                        )
                        if (sortieAssociee.codeSortie == "magret") {
                            viewModel.mettreAJourParametresProjet(
                                projet = p,
                                quantiteBaseReelle = p.quantiteBaseReelle,
                                prixUnitaireMatiere = p.prixUnitaireMatiereBase,
                                margePct = p.margeTravailPct,
                                prixSelKg = p.prixSelKg,
                                prixEpicesKg = p.prixEpicesKg,
                                statut = p.statut,
                                activerRevente = true,
                                prixReventeUnitaireFixe = nvPrix
                            )
                        } else if (!p.activerRevente) {
                            viewModel.basculerReventeProjet(p, true)
                        }
                    } else {
                        viewModel.mettreAJourParametresProjet(
                            projet = p,
                            quantiteBaseReelle = p.quantiteBaseReelle,
                            prixUnitaireMatiere = p.prixUnitaireMatiereBase,
                            margePct = p.margeTravailPct,
                            prixSelKg = p.prixSelKg,
                            prixEpicesKg = p.prixEpicesKg,
                            statut = p.statut,
                            activerRevente = true,
                            prixReventeUnitaireFixe = nvPrix
                        )
                    }
                    ligneProduitAEditer = null
                }) { Text("Enregistrer") }
            },
            dismissButton = {
                TextButton(onClick = { ligneProduitAEditer = null }) { Text("Annuler") }
            }
        )
    }

    if (showEditParams) {
        var qBase by remember { mutableStateOf(p.quantiteBaseReelle.toString()) }
        var prixUnit by remember { mutableStateOf(p.prixUnitaireMatiereBase.toString()) }
        var prixReventeUnit by remember { mutableStateOf("%.2f".format(Locale.US, prixProduitConseille)) }
        var activerRev by remember { mutableStateOf(p.activerRevente) }

        val sortiesActives = remember(projetComplet.sortiesDecoupe) {
            projetComplet.sortiesDecoupe.filter { it.actif && it.quantiteReelle > 0.0 }
        }
        val prixParSortieMap = remember(projetComplet.sortiesDecoupe, bilan.lignesProduits) {
            mutableStateMapOf<Long, String>().apply {
                sortiesActives.forEach { s ->
                    val ligneBilan = bilan.lignesProduits.find { it.codeSortie == s.codeSortie && it.nom == s.nom }
                        ?: bilan.lignesProduits.find { it.codeSortie == s.codeSortie }
                    val prixInit = if (s.prixReventeUnitaire > 0.0) s.prixReventeUnitaire
                    else (ligneBilan?.prixReventeConseilleUnitaire ?: 0.0)
                    put(s.id, "%.2f".format(Locale.US, prixInit))
                }
            }
        }

        AlertDialog(
            onDismissRequest = { showEditParams = false },
            title = { Text("Modifier les coûts & prix") },
            text = {
                Column(
                    modifier = Modifier.verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = qBase,
                        onValueChange = { qBase = it },
                        label = { Text("Quantité matière réelle") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = prixUnit,
                        onValueChange = { prixUnit = it },
                        label = { Text("Prix unitaire matière (€)") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.fillMaxWidth()
                    )
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.clickable { activerRev = !activerRev }
                    ) {
                        Checkbox(checked = activerRev, onCheckedChange = { activerRev = it })
                        Text("Activer l'option Revente")
                    }
                    if (activerRev) {
                        if (sortiesActives.isNotEmpty()) {
                            HorizontalDivider(Modifier.padding(vertical = 4.dp))
                            Text(
                                text = "Prix de revente unitaire par produit :",
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.primary
                            )
                            sortiesActives.forEach { s ->
                                val ligneBilan = bilan.lignesProduits.find { it.codeSortie == s.codeSortie && it.nom == s.nom }
                                    ?: bilan.lignesProduits.find { it.codeSortie == s.codeSortie }
                                val coutRev = ligneBilan?.coutRevientUnitaire ?: 0.0
                                OutlinedTextField(
                                    value = prixParSortieMap[s.id] ?: "",
                                    onValueChange = { prixParSortieMap[s.id] = it },
                                    label = { Text("${s.nom} (€ / ${s.unite} · revient ${formatEuro(coutRev)})") },
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                        } else {
                            OutlinedTextField(
                                value = prixReventeUnit,
                                onValueChange = { prixReventeUnit = it },
                                label = { Text("Prix de revente conseillé (€ / unité)") },
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                }
            },
            confirmButton = {
                Button(onClick = {
                    if (activerRev && sortiesActives.isNotEmpty()) {
                        val sortiesMaj = sortiesActives.map { s ->
                            val nvP = prixParSortieMap[s.id]?.replace(",", ".")?.toDoubleOrNull() ?: s.prixReventeUnitaire
                            s.copy(prixReventeUnitaire = nvP)
                        }
                        viewModel.mettreAJourSortiesDecoupeListe(sortiesMaj)
                    }
                    val sortieMagretId = sortiesActives.find { it.codeSortie == "magret" }?.id
                    val nvPrixReventeMagret = if (activerRev) {
                        if (sortieMagretId != null) {
                            prixParSortieMap[sortieMagretId]?.replace(",", ".")?.toDoubleOrNull() ?: prixProduitConseille
                        } else {
                            prixReventeUnit.replace(",", ".").toDoubleOrNull() ?: prixProduitConseille
                        }
                    } else 0.0

                    val coutUnit = (bilan.lignesProduits.find { it.codeSortie == "magret" }?.coutRevientUnitaire
                        ?: bilan.lignesProduits.firstOrNull()?.coutRevientUnitaire
                        ?: 1.0).coerceAtLeast(0.01)
                    val nvMarge = if (activerRev && nvPrixReventeMagret > 0.0) {
                        (((nvPrixReventeMagret - coutUnit) / coutUnit) * 100.0).coerceAtLeast(0.0)
                    } else p.margeTravailPct

                    viewModel.mettreAJourParametresProjet(
                        projet = p,
                        quantiteBaseReelle = qBase.replace(",", ".").toDoubleOrNull() ?: p.quantiteBaseReelle,
                        prixUnitaireMatiere = prixUnit.replace(",", ".").toDoubleOrNull() ?: p.prixUnitaireMatiereBase,
                        margePct = nvMarge,
                        prixSelKg = p.prixSelKg,
                        prixEpicesKg = p.prixEpicesKg,
                        statut = p.statut,
                        activerRevente = activerRev,
                        prixReventeUnitaireFixe = nvPrixReventeMagret
                    )
                    showEditParams = false
                }) { Text("Enregistrer") }
            },
            dismissButton = {
                TextButton(onClick = { showEditParams = false }) { Text("Annuler") }
            }
        )
    }

    val clients by viewModel.clients.collectAsState()

    if (showAddCommande) {
        CommandeDetailleeDialog(
            projetComplet = projetComplet,
            clientsDisponibles = clients,
            commandeInitiale = null,
            onDismiss = { showAddCommande = false },
            onSave = { acheteur, lignes, paye, moyenPaiement, livre, commentaire ->
                viewModel.enregistrerCommandeDetaillee(
                    projetId = projetComplet.projet.id,
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
        CommandeDetailleeDialog(
            projetComplet = projetComplet,
            clientsDisponibles = clients,
            commandeInitiale = cmd,
            onDismiss = { commandeAEditer = null },
            onDelete = {
                viewModel.supprimerCommande(cmd)
                commandeAEditer = null
            },
            onSave = { acheteur, lignes, paye, moyenPaiement, livre, commentaire ->
                viewModel.modifierCommandeDetaillee(
                    commandeOrigine = cmd,
                    projetId = projetComplet.projet.id,
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
private fun LigneBilan(libelle: String, valeur: String, gras: Boolean = false, accent: Boolean = false) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = libelle,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = if (gras) FontWeight.Bold else FontWeight.Normal,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.weight(1f),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        Spacer(Modifier.width(8.dp))
        Text(
            text = valeur,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = if (gras || accent) FontWeight.Bold else FontWeight.Medium,
            color = if (accent) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.onSurface
        )
    }
}
