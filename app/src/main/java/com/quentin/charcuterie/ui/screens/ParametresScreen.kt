@file:OptIn(ExperimentalMaterial3Api::class)

package com.quentin.charcuterie.ui.screens

import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.quentin.charcuterie.data.ParametreEntity
import com.quentin.charcuterie.data.RecetteVarianteEntity
import com.quentin.charcuterie.ui.CharcuterieViewModel
import com.quentin.charcuterie.update.UpdateManager
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// ============================================================================================
// ÉCRAN RÉGLAGES : 1. OPTIONS & TARIFS | 2. PARAMÉTRAGE DES LOTS D'ASSAISONNEMENT
// ============================================================================================
@Composable
fun ParametresScreen(
    viewModel: CharcuterieViewModel,
    versionActuelle: String = UpdateManager.CURRENT_VERSION,
    verifMiseAJourEnCours: Boolean = false,
    onVerifierMiseAJour: () -> Unit = {}
) {
    val parametres by viewModel.parametres.collectAsState()
    val recettes by viewModel.recettes.collectAsState()

    var sousOnglet by rememberSaveable { mutableIntStateOf(0) } // 0 = Options & Tarifs, 1 = Lots prédéfinis
    val context = androidx.compose.ui.platform.LocalContext.current

    val exportLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.CreateDocument("application/json")
    ) { uri ->
        if (uri != null) {
            viewModel.exporterDonneesJson(uri) { _, msg ->
                Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
            }
        }
    }

    val importLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.OpenDocument()
    ) { uri ->
        if (uri != null) {
            viewModel.importerDonneesJson(uri) { _, msg ->
                Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
            }
        }
    }
    var paramAEditer by remember { mutableStateOf<ParametreEntity?>(null) }

    val optionPrixActive = remember(parametres) {
        (parametres.find { it.cle == "ACTIVER_PRIX" }?.valeur ?: 1.0) >= 0.5
    }
    val optionReventeActive = remember(parametres) {
        (parametres.find { it.cle == "ACTIVER_REVENTE" }?.valeur ?: 1.0) >= 0.5
    }
    val parametresTarifs = remember(parametres) {
        parametres.filter {
            it.cle != "ACTIVER_REVENTE" &&
                it.cle != "ACTIVER_PRIX" &&
                it.cle != "MASQUER_GUIDE_DEBUTANT"
        }
    }

    // État pour l'onglet "Lots & Assaisonnements"
    var recetteChoisieId by rememberSaveable { mutableLongStateOf(0L) }
    val recetteActive = remember(recettes, recetteChoisieId) {
        recettes.find { it.recette.id == recetteChoisieId } ?: recettes.firstOrNull()
    }
    var showAddLotDialog by remember { mutableStateOf(false) }
    var lotAEditer by remember { mutableStateOf<RecetteVarianteEntity?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // En-tête avec sélecteur d'onglets (Options & Tarifs / Lots prédéfinis)
        Surface(color = MaterialTheme.colorScheme.surface) {
            Column(Modifier.padding(horizontal = 20.dp, vertical = 14.dp)) {
                Text(
                    text = "Configuration de L'Affinoir",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    text = "Réglages & Lots",
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Spacer(Modifier.height(12.dp))

                Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(4.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        val tabs = listOf("Options & Tarifs", "Lots à paramétrer")
                        tabs.forEachIndexed { idx, label ->
                            val selected = sousOnglet == idx
                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(10.dp))
                                    .clickable { sousOnglet = idx },
                                shape = RoundedCornerShape(10.dp),
                                color = if (selected) MaterialTheme.colorScheme.surface else Color.Transparent,
                                shadowElevation = if (selected) 1.dp else 0.dp
                            ) {
                                Box(
                                    modifier = Modifier.padding(vertical = 10.dp, horizontal = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = label,
                                        style = MaterialTheme.typography.labelLarge,
                                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                        color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

        if (sousOnglet == 0) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(top = 18.dp, bottom = 100.dp)
            ) {
                // Carte Application & Mises à jour automatiques (Git)
                item {
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                    ) {
                        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                                    Icon(
                                        Icons.Default.SystemUpdate,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Text("Application & Mises à jour (Git)", style = MaterialTheme.typography.titleMedium)
                                }
                                Surface(
                                    color = MaterialTheme.colorScheme.primaryContainer,
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text(
                                        text = "v$versionActuelle",
                                        style = MaterialTheme.typography.labelLarge,
                                        color = MaterialTheme.colorScheme.primary,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                    )
                                }
                            }
                            Text(
                                "L'application vérifie automatiquement les nouvelles versions sur GitHub (branche main et Releases) à chaque lancement.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Button(
                                onClick = onVerifierMiseAJour,
                                enabled = !verifMiseAJourEnCours,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                if (verifMiseAJourEnCours) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(16.dp),
                                        strokeWidth = 2.dp
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Text("Vérification en cours…")
                                } else {
                                    Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(8.dp))
                                    Text("Vérifier les mises à jour")
                                }
                            }
                        }
                    }
                }

                // Carte Sauvegarde & Export JSON Mobile
                item {
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                    ) {
                        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Save, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
                                Spacer(Modifier.width(8.dp))
                                Text("Sauvegarde & Transfert (JSON)", style = MaterialTheme.typography.titleMedium)
                            }
                            Text(
                                "Exportez vos sessions, pesées, relevés de cave et évaluations dans un fichier JSON pour ne rien perdre.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                Button(
                                    onClick = {
                                        val dateStr = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
                                        exportLauncher.launch("laffinoir_mobile_$dateStr.json")
                                    },
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("Exporter JSON")
                                }
                                OutlinedButton(
                                    onClick = { importLauncher.launch(arrayOf("application/json", "text/plain", "*/*")) },
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("Importer")
                                }
                            }
                        }
                    }
                }

                // Carte Gestion des prix & coûts (Mode simplifié recettes uniquement)
                item {
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (optionPrixActive) MaterialTheme.colorScheme.surface
                            else MaterialTheme.colorScheme.secondaryContainer
                        ),
                        border = BorderStroke(
                            1.dp,
                            if (!optionPrixActive) MaterialTheme.colorScheme.secondary.copy(alpha = 0.4f)
                            else MaterialTheme.colorScheme.outlineVariant
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { viewModel.basculerOptionPrixGlobale(!optionPrixActive) }
                                .padding(18.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        Icons.Default.Euro,
                                        contentDescription = null,
                                        tint = if (optionPrixActive) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Text(
                                        text = "Gestion des prix & coûts",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = if (!optionPrixActive) MaterialTheme.colorScheme.onSecondaryContainer else MaterialTheme.colorScheme.onSurface
                                    )
                                }
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    text = if (optionPrixActive)
                                        "Activée : les prix, budgets, coûts et marges sont affichés."
                                    else
                                        "Désactivée : version simplifiée centrée uniquement sur les recettes et le suivi.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = if (!optionPrixActive) MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.85f)
                                    else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Spacer(Modifier.width(12.dp))
                            Switch(
                                checked = optionPrixActive,
                                onCheckedChange = { viewModel.basculerOptionPrixGlobale(it) }
                            )
                        }
                    }
                }

                // Carte Option Revente (Afficher / Masquer dans toute l'application)
                if (optionPrixActive) {
                    item {
                        Card(
                            shape = RoundedCornerShape(20.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = if (optionReventeActive) MaterialTheme.colorScheme.primaryContainer
                                else MaterialTheme.colorScheme.surface
                            ),
                            border = BorderStroke(
                                1.dp,
                                if (optionReventeActive) MaterialTheme.colorScheme.primary.copy(alpha = 0.4f)
                                else MaterialTheme.colorScheme.outlineVariant
                            )
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { viewModel.basculerOptionReventeGlobale(!optionReventeActive) }
                                    .padding(18.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            Icons.Default.Storefront,
                                            contentDescription = null,
                                            tint = if (optionReventeActive) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                                            modifier = Modifier.size(20.dp)
                                        )
                                        Spacer(Modifier.width(8.dp))
                                        Text(
                                            text = "Option Revente",
                                            style = MaterialTheme.typography.titleMedium,
                                            color = if (optionReventeActive) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface
                                        )
                                    }
                                    Spacer(Modifier.height(4.dp))
                                    Text(
                                        text = if (optionReventeActive)
                                            "Activée : l'onglet Revente, les prix de revente conseillés et les commandes sont affichés."
                                        else
                                            "Masquée : seuls les coûts de revient et le suivi de fabrication sont affichés.",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = if (optionReventeActive) MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.85f)
                                        else MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Spacer(Modifier.width(12.dp))
                                Switch(
                                    checked = optionReventeActive,
                                    onCheckedChange = { viewModel.basculerOptionReventeGlobale(it) }
                                )
                            }
                        }
                    }
                }

                // Raccourci vers le paramétrage des lots
                item {
                    OutlinedCard(
                        onClick = { sousOnglet = 1 },
                        shape = RoundedCornerShape(18.dp),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Paramétrer mes lots d'épices & variantes",
                                    style = MaterialTheme.typography.titleSmall,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                Text(
                                    text = "Ajoutez ou personnalisez à l'avance les lots proposés lors de la planification.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Icon(
                                Icons.Default.ChevronRight,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }

                if (optionPrixActive) {
                    item {
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = "Tarifs & Valeurs de référence",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        Text(
                            text = "Touchez une ligne pour adapter vos prix d'achat (canard, sel, épices) ou vos valeurs de référence.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    items(parametresTarifs, key = { it.cle }) { p ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { paramAEditer = p },
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = p.libelle,
                                        style = MaterialTheme.typography.titleSmall
                                    )
                                    if (p.description.isNotBlank()) {
                                        Text(
                                            text = p.description,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                                Spacer(Modifier.width(12.dp))
                                Surface(
                                    color = MaterialTheme.colorScheme.primaryContainer,
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text(
                                        text = "${p.valeur} ${p.unite}",
                                        style = MaterialTheme.typography.labelLarge,
                                        color = MaterialTheme.colorScheme.primary,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // SOUS-ONGLET 1 : PAGE DE PARAMÉTRAGE DES LOTS PRÉDÉFINIS PAR CHARCUTERIE
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(top = 18.dp, bottom = 100.dp)
            ) {
                item {
                    Text(
                        text = "Sélectionnez une charcuterie pour configurer les différents lots d'assaisonnement qui vous seront proposés lors de la planification :",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(10.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(recettes, key = { it.recette.id }) { rc ->
                            val selected = rc.recette.id == recetteActive?.recette?.id
                            FilterChip(
                                selected = selected,
                                onClick = { recetteChoisieId = rc.recette.id },
                                label = { Text(rc.recette.nom) },
                                shape = RoundedCornerShape(12.dp)
                            )
                        }
                    }
                }

                if (recetteActive != null) {
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Lots pour « ${recetteActive.recette.nom} »",
                                    style = MaterialTheme.typography.titleMedium
                                )
                                Text(
                                    text = "${recetteActive.variantes.size} lots configurés",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Spacer(Modifier.width(8.dp))
                            Button(
                                onClick = { showAddLotDialog = true },
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("Nouveau lot")
                            }
                        }
                    }

                    items(recetteActive.variantes, key = { it.id }) { v ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { lotAEditer = v },
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = v.nom,
                                            style = MaterialTheme.typography.titleMedium,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                        if (v.ajouteEtapeFumage) {
                                            Spacer(Modifier.width(8.dp))
                                            Surface(
                                                color = MaterialTheme.colorScheme.secondaryContainer,
                                                shape = RoundedCornerShape(6.dp)
                                            ) {
                                                Text(
                                                    text = "Fumé",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = MaterialTheme.colorScheme.onSecondaryContainer,
                                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                                )
                                            }
                                        }
                                    }
                                    if (v.descriptionEpices.isNotBlank()) {
                                        Spacer(Modifier.height(2.dp))
                                        Text(
                                            text = v.descriptionEpices,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    Spacer(Modifier.height(4.dp))
                                    Text(
                                        text = "Épices : ${v.epicesGrammesParUnite} g/${recetteActive.recette.uniteBase} · Salage : ${(v.dureeSalageHeuresSpecifique ?: 24.0).toInt()} h",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Row {
                                    IconButton(onClick = { lotAEditer = v }) {
                                        Icon(Icons.Outlined.Edit, contentDescription = "Modifier", tint = MaterialTheme.colorScheme.primary)
                                    }
                                    if (recetteActive.variantes.size > 1) {
                                        IconButton(onClick = { viewModel.supprimerVarianteRecette(v) }) {
                                            Icon(Icons.Outlined.Delete, contentDescription = "Supprimer", tint = MaterialTheme.colorScheme.onSurfaceVariant)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    paramAEditer?.let { p ->
        var valStr by remember { mutableStateOf(p.valeur.toString()) }
        AlertDialog(
            onDismissRequest = { paramAEditer = null },
            title = { Text(p.libelle) },
            text = {
                OutlinedTextField(
                    value = valStr,
                    onValueChange = { valStr = it },
                    label = { Text("Valeur (${p.unite})") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true
                )
            },
            confirmButton = {
                Button(onClick = {
                    val v = valStr.replace(",", ".").toDoubleOrNull() ?: p.valeur
                    viewModel.modifierParametreBase(p, v)
                    paramAEditer = null
                }) { Text("Enregistrer") }
            },
            dismissButton = {
                TextButton(onClick = { paramAEditer = null }) { Text("Annuler") }
            }
        )
    }

    if (showAddLotDialog && recetteActive != null) {
        var nom by remember { mutableStateOf("") }
        var desc by remember { mutableStateOf("") }
        var epicesG by remember { mutableStateOf("15") }
        var salageH by remember { mutableStateOf("24") }
        var fumage by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = { showAddLotDialog = false },
            title = { Text("Nouveau lot prédéfini") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = nom,
                        onValueChange = { nom = it },
                        label = { Text("Nom du lot (ex: Miel & Romarin, 5 Baies…)") },
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = desc,
                        onValueChange = { desc = it },
                        label = { Text("Description des épices") }
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = epicesG,
                            onValueChange = { epicesG = it },
                            label = { Text("Épices (g)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = salageH,
                            onValueChange = { salageH = it },
                            label = { Text("Salage (h)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.clickable { fumage = !fumage }
                    ) {
                        Checkbox(checked = fumage, onCheckedChange = { fumage = it })
                        Text("Ce lot inclut une étape de fumage")
                    }
                }
            },
            confirmButton = {
                Button(onClick = {
                    if (nom.isNotBlank()) {
                        viewModel.ajouterVarianteRecette(
                            recetteId = recetteActive.recette.id,
                            nom = nom.trim(),
                            description = desc.trim(),
                            epicesG = epicesG.replace(",", ".").toDoubleOrNull() ?: 15.0,
                            salageH = salageH.replace(",", ".").toDoubleOrNull() ?: 24.0,
                            fumage = fumage
                        )
                    }
                    showAddLotDialog = false
                }) { Text("Ajouter") }
            },
            dismissButton = {
                TextButton(onClick = { showAddLotDialog = false }) { Text("Annuler") }
            }
        )
    }

    lotAEditer?.let { v ->
        var nom by remember { mutableStateOf(v.nom) }
        var desc by remember { mutableStateOf(v.descriptionEpices) }
        var epicesG by remember { mutableStateOf(v.epicesGrammesParUnite.toString()) }
        var salageH by remember { mutableStateOf((v.dureeSalageHeuresSpecifique ?: 24.0).toString()) }
        var fumage by remember { mutableStateOf(v.ajouteEtapeFumage) }

        AlertDialog(
            onDismissRequest = { lotAEditer = null },
            title = { Text("Modifier le lot « ${v.nom} »") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = nom,
                        onValueChange = { nom = it },
                        label = { Text("Nom du lot") },
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = desc,
                        onValueChange = { desc = it },
                        label = { Text("Description des épices") }
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = epicesG,
                            onValueChange = { epicesG = it },
                            label = { Text("Épices (g)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = salageH,
                            onValueChange = { salageH = it },
                            label = { Text("Salage (h)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.clickable { fumage = !fumage }
                    ) {
                        Checkbox(checked = fumage, onCheckedChange = { fumage = it })
                        Text("Ce lot inclut une étape de fumage")
                    }
                }
            },
            confirmButton = {
                Button(onClick = {
                    if (nom.isNotBlank()) {
                        viewModel.modifierVarianteRecette(
                            v.copy(
                                nom = nom.trim(),
                                descriptionEpices = desc.trim(),
                                epicesGrammesParUnite = epicesG.replace(",", ".").toDoubleOrNull() ?: v.epicesGrammesParUnite,
                                dureeSalageHeuresSpecifique = salageH.replace(",", ".").toDoubleOrNull() ?: v.dureeSalageHeuresSpecifique,
                                ajouteEtapeFumage = fumage
                            )
                        )
                    }
                    lotAEditer = null
                }) { Text("Enregistrer") }
            },
            dismissButton = {
                TextButton(onClick = { lotAEditer = null }) { Text("Annuler") }
            }
        )
    }
}
