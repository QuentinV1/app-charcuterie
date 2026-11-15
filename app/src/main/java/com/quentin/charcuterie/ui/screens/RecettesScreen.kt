@file:OptIn(ExperimentalMaterial3Api::class)

package com.quentin.charcuterie.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.quentin.charcuterie.data.RecetteComplete
import com.quentin.charcuterie.data.RecetteEtapeEntity
import com.quentin.charcuterie.data.RecetteIngredientEntity
import com.quentin.charcuterie.ui.CharcuterieViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecettesScreen(
    viewModel: CharcuterieViewModel,
    onLancerProjetDepuisRecette: (RecetteComplete) -> Unit
) {
    val recettes by viewModel.recettes.collectAsState()
    val parametres by viewModel.parametres.collectAsState()
    val optionPrixActive = parametres.find { it.cle == "ACTIVER_PRIX" }?.let { it.valeur >= 0.5 } ?: true
    var familleSelectionnee by rememberSaveable { mutableStateOf("Toutes") }
    var recherche by rememberSaveable { mutableStateOf("") }
    var afficherMasquees by rememberSaveable { mutableStateOf(false) }
    var recetteOuverteId by rememberSaveable { mutableStateOf<Long?>(null) }
    var showNouvelleRecetteDialog by rememberSaveable { mutableStateOf(false) }
    var recetteASupprimer by remember { mutableStateOf<com.quentin.charcuterie.data.RecetteEntity?>(null) }

    val nbMasquees = remember(recettes) { recettes.count { it.recette.masquee } }
    val familles = listOf("Toutes", "Canard", "Porc", "Bœuf", "Poisson", "Gibier & Foie")
    val recettesFiltrees = remember(recettes, familleSelectionnee, recherche, afficherMasquees) {
        recettes.filter { rc ->
            val matchMasquee = afficherMasquees || !rc.recette.masquee
            val matchFamille = familleSelectionnee == "Toutes" || rc.recette.famille == familleSelectionnee
            val matchRecherche = recherche.isBlank() ||
                rc.recette.nom.contains(recherche, ignoreCase = true) ||
                rc.recette.description.contains(recherche, ignoreCase = true)
            matchMasquee && matchFamille && matchRecherche
        }
    }

    val activeRecette = recetteOuverteId?.let { id -> recettes.find { it.recette.id == id } }
    if (activeRecette != null) {
        FicheRecetteDetailScreen(
            recetteComplete = activeRecette,
            viewModel = viewModel,
            onBack = { recetteOuverteId = null },
            onLancerProjet = { onLancerProjetDepuisRecette(activeRecette) }
        )
        return
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 20.dp, bottom = 100.dp)
    ) {
        // En-tête moderne
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "${recettes.size} recettes disponibles",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = "Charcuteries",
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                }
                FilledTonalButton(
                    onClick = { showNouvelleRecetteDialog = true },
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Créer")
                }
            }
        }

        // Barre de recherche moderne
        item {
            OutlinedTextField(
                value = recherche,
                onValueChange = { recherche = it },
                placeholder = { Text("Rechercher (magret, jambon, coppa, pâté…)") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                trailingIcon = {
                    if (recherche.isNotEmpty()) {
                        IconButton(onClick = { recherche = "" }) {
                            Icon(Icons.Default.Clear, contentDescription = "Effacer")
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(16.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                    focusedContainerColor = MaterialTheme.colorScheme.surface
                ),
                modifier = Modifier.fillMaxWidth()
            )
        }

        // Filtres par famille et masquage
        item {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                items(familles) { fam ->
                    FilterChip(
                        selected = familleSelectionnee == fam,
                        onClick = { familleSelectionnee = fam },
                        label = { Text(fam) },
                        shape = RoundedCornerShape(12.dp)
                    )
                }
                if (nbMasquees > 0) {
                    item {
                        FilterChip(
                            selected = afficherMasquees,
                            onClick = { afficherMasquees = !afficherMasquees },
                            leadingIcon = {
                                Icon(
                                    if (afficherMasquees) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                            },
                            label = { Text(if (afficherMasquees) "Toutes visibles" else "$nbMasquees masquée(s)") },
                            shape = RoundedCornerShape(12.dp),
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = MaterialTheme.colorScheme.tertiaryContainer,
                                selectedLabelColor = MaterialTheme.colorScheme.onTertiaryContainer
                            )
                        )
                    }
                }
            }
        }

        // Cartes de charcuteries épurées
        items(recettesFiltrees, key = { it.recette.id }) { rc ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { recetteOuverteId = rc.recette.id },
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (rc.recette.masquee)
                        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                    else
                        MaterialTheme.colorScheme.surface
                ),
                border = BorderStroke(
                    1.dp,
                    if (rc.recette.masquee) MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f) else MaterialTheme.colorScheme.outlineVariant
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
            ) {
                Column(Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Surface(
                                color = MaterialTheme.colorScheme.primaryContainer,
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = rc.recette.famille,
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                )
                            }
                            if (rc.recette.masquee) {
                                Surface(
                                    color = MaterialTheme.colorScheme.surfaceVariant,
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text(
                                        text = "Masquée",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            if (rc.recette.perteCiblePct > 0) {
                                Text(
                                    text = "Séchage -${rc.recette.perteCiblePct.toInt()}%",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            } else if (rc.recette.tempCoeurCible > 0) {
                                Text(
                                    text = "Cuisson ${rc.recette.tempCoeurCible.toInt()}°C",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.secondary
                                )
                            }
                            IconButton(
                                onClick = { viewModel.basculerMasquageRecette(rc.recette) },
                                modifier = Modifier.size(36.dp)
                            ) {
                                Icon(
                                    imageVector = if (rc.recette.masquee) Icons.Default.Visibility else Icons.Outlined.VisibilityOff,
                                    contentDescription = if (rc.recette.masquee) "Démasquer" else "Masquer",
                                    tint = if (rc.recette.masquee) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            IconButton(
                                onClick = { recetteASupprimer = rc.recette },
                                modifier = Modifier.size(36.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.Delete,
                                    contentDescription = "Supprimer la recette",
                                    tint = MaterialTheme.colorScheme.error.copy(alpha = 0.85f),
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }

                    Spacer(Modifier.height(10.dp))

                    Text(
                        text = rc.recette.nom,
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    Spacer(Modifier.height(4.dp))

                    Text(
                        text = rc.recette.description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )

                    Spacer(Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "${rc.etapes.size} étapes · ${rc.variantes.size} variantes",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.weight(1f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Spacer(Modifier.width(8.dp))
                        Button(
                            onClick = { onLancerProjetDepuisRecette(rc) },
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                        ) {
                            Icon(Icons.Default.CalendarMonth, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Planifier")
                        }
                    }
                }
            }
        }
    }

    if (showNouvelleRecetteDialog) {
        CreerRecetteDialog(
            optionPrixActive = optionPrixActive,
            onDismiss = { showNouvelleRecetteDialog = false },
            onEnregistrer = { nom, fam, type, unite, quantite, perte, temp, desc, ings, etapes, vars ->
                viewModel.creerRecetteCompletePersonnalisee(
                    nom = nom,
                    famille = fam,
                    typeRecette = type,
                    uniteBase = unite,
                    quantiteDefaut = quantite,
                    perteCiblePct = perte,
                    tempCoeurCible = temp,
                    conditionsConservation = "À conserver au frais et au sec (12-15°C) ou sous vide.",
                    pointsVigilance = "Bien respecter le dosage de sel au gramme près pour une conservation optimale.",
                    description = desc,
                    ingredients = ings,
                    etapes = etapes,
                    variantes = vars
                )
                showNouvelleRecetteDialog = false
            }
        )
    }

    recetteASupprimer?.let { rec ->
        AlertDialog(
            onDismissRequest = { recetteASupprimer = null },
            icon = { Icon(Icons.Default.Delete, contentDescription = null, tint = MaterialTheme.colorScheme.error) },
            title = { Text("Supprimer la recette ?") },
            text = {
                Text("Voulez-vous vraiment supprimer définitivement « ${rec.nom} » ?\nCette action est irréversible.")
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.supprimerRecette(rec)
                        recetteASupprimer = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Supprimer")
                }
            },
            dismissButton = {
                TextButton(onClick = { recetteASupprimer = null }) {
                    Text("Annuler")
                }
            }
        )
    }
}

@Composable
private fun FicheRecetteDetailScreen(
    recetteComplete: RecetteComplete,
    viewModel: CharcuterieViewModel,
    onBack: () -> Unit,
    onLancerProjet: () -> Unit
) {
    BackHandler { onBack() }
    val r = recetteComplete.recette
    var etapeAEditer by remember { mutableStateOf<RecetteEtapeEntity?>(null) }
    var ingAEditer by remember { mutableStateOf<RecetteIngredientEntity?>(null) }
    var showAjoutVariante by remember { mutableStateOf(false) }
    var showConfirmationSuppression by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Barre supérieure propre et sans chevauchement
        Surface(color = MaterialTheme.colorScheme.surface) {
            Column {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Retour")
                    }
                    Spacer(Modifier.width(4.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = r.nom,
                            style = MaterialTheme.typography.titleLarge,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = "${r.famille} · Version v${r.versionActuelle}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    IconButton(
                        onClick = { viewModel.basculerMasquageRecette(r) },
                        modifier = Modifier.size(36.dp)
                    ) {
                        Icon(
                            imageVector = if (r.masquee) Icons.Default.Visibility else Icons.Outlined.VisibilityOff,
                            contentDescription = if (r.masquee) "Démasquer la recette" else "Masquer la recette",
                            tint = if (r.masquee) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
                        )
                    }
                    IconButton(
                        onClick = { showConfirmationSuppression = true },
                        modifier = Modifier.size(36.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Delete,
                            contentDescription = "Supprimer la recette",
                            tint = MaterialTheme.colorScheme.error
                        )
                    }
                    Spacer(Modifier.width(6.dp))
                    Button(
                        onClick = onLancerProjet,
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                    ) {
                        Icon(Icons.Default.CalendarMonth, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Planifier")
                    }
                }
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            }
        }

        if (r.masquee) {
            Surface(
                color = MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.6f),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 18.dp, vertical = 8.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        Icons.Default.VisibilityOff,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onTertiaryContainer,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = "Cette recette est masquée : elle n'apparaît pas dans la sélection de planification des projets.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onTertiaryContainer
                    )
                }
            }
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            contentPadding = PaddingValues(top = 16.dp, bottom = 90.dp)
        ) {
            // Présentation & Conseils
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(Modifier.padding(18.dp)) {
                        Text(r.description, style = MaterialTheme.typography.bodyLarge)
                        if (r.conditionsConservation.isNotBlank()) {
                            Spacer(Modifier.height(10.dp))
                            Text(
                                text = "Conservation : ${r.conditionsConservation}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        if (r.pointsVigilance.isNotBlank()) {
                            Spacer(Modifier.height(12.dp))
                            Surface(
                                color = MaterialTheme.colorScheme.primaryContainer,
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(
                                    text = r.pointsVigilance,
                                    modifier = Modifier.padding(12.dp),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                        }
                    }
                }
            }

            // Ingrédients & Proportions
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(Modifier.padding(18.dp)) {
                        Text(
                            text = "Ingrédients (touchez pour ajuster)",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(Modifier.height(8.dp))
                        recetteComplete.ingredients.forEachIndexed { index, ing ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { ingAEditer = ing }
                                    .padding(vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = ing.nomIngredient,
                                    style = MaterialTheme.typography.bodyMedium,
                                    modifier = Modifier.weight(1f)
                                )
                                Spacer(Modifier.width(8.dp))
                                Text(
                                    text = "${ing.quantite} ${ing.unite}",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                            if (index < recetteComplete.ingredients.lastIndex) {
                                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                            }
                        }
                    }
                }
            }

            // Variantes d'assaisonnement
            item {
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
                                text = "Variantes (${recetteComplete.variantes.size})",
                                style = MaterialTheme.typography.titleMedium,
                                modifier = Modifier.weight(1f)
                            )
                            TextButton(onClick = { showAjoutVariante = true }) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(4.dp))
                                Text("Ajouter")
                            }
                        }
                        recetteComplete.variantes.forEach { v ->
                            Column(Modifier.padding(vertical = 6.dp)) {
                                Text(
                                    text = v.nom + (if (v.ajouteEtapeFumage) " · Fumage" else ""),
                                    style = MaterialTheme.typography.titleSmall,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                Text(
                                    text = v.descriptionEpices,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }

            // Étapes de la recette
            item {
                Text(
                    text = "Étapes de préparation",
                    style = MaterialTheme.typography.titleLarge
                )
            }

            items(recetteComplete.etapes.sortedBy { it.ordre }, key = { it.id }) { e ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { etapeAEditer = e },
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.weight(1f)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(24.dp)
                                        .clip(CircleShape)
                                        .background(MaterialTheme.colorScheme.primaryContainer),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = e.ordre.toString(),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.primary,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Spacer(Modifier.width(10.dp))
                                Text(
                                    text = e.titre,
                                    style = MaterialTheme.typography.titleSmall,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                            Spacer(Modifier.width(8.dp))
                            Surface(
                                color = MaterialTheme.colorScheme.surfaceVariant,
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = formatDuree(e.dureeMinutes),
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = e.instructions,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }

    etapeAEditer?.let { etape ->
        var titre by remember { mutableStateOf(etape.titre) }
        var dureeHeures by remember { mutableStateOf((etape.dureeMinutes / 60.0).toString()) }
        var instr by remember { mutableStateOf(etape.instructions) }
        var motif by remember { mutableStateOf("Ajustement ${etape.titre}") }

        AlertDialog(
            onDismissRequest = { etapeAEditer = null },
            title = { Text("Modifier l'étape") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = titre, onValueChange = { titre = it }, label = { Text("Titre") })
                    OutlinedTextField(
                        value = dureeHeures,
                        onValueChange = { dureeHeures = it },
                        label = { Text("Durée (heures)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true
                    )
                    OutlinedTextField(value = instr, onValueChange = { instr = it }, label = { Text("Instructions") }, minLines = 3)
                }
            },
            confirmButton = {
                Button(onClick = {
                    val h = dureeHeures.replace(",", ".").toDoubleOrNull() ?: 1.0
                    viewModel.ajusterEtapeRecette(r, etape, titre, (h * 60).toInt(), instr, motif)
                    etapeAEditer = null
                }) { Text("Enregistrer") }
            },
            dismissButton = {
                TextButton(onClick = { etapeAEditer = null }) { Text("Annuler") }
            }
        )
    }

    ingAEditer?.let { ing ->
        var qte by remember { mutableStateOf(ing.quantite.toString()) }
        AlertDialog(
            onDismissRequest = { ingAEditer = null },
            title = { Text(ing.nomIngredient) },
            text = {
                OutlinedTextField(
                    value = qte,
                    onValueChange = { qte = it },
                    label = { Text("Quantité (${ing.unite})") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true
                )
            },
            confirmButton = {
                Button(onClick = {
                    val v = qte.replace(",", ".").toDoubleOrNull() ?: ing.quantite
                    viewModel.ajusterIngredientRecette(r, ing, v, "Ajustement ${ing.nomIngredient}")
                    ingAEditer = null
                }) { Text("Enregistrer") }
            },
            dismissButton = {
                TextButton(onClick = { ingAEditer = null }) { Text("Annuler") }
            }
        )
    }

    if (showAjoutVariante) {
        var nomVar by remember { mutableStateOf("") }
        var descVar by remember { mutableStateOf("") }
        var epicesG by remember { mutableStateOf("15") }
        var fumage by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = { showAjoutVariante = false },
            title = { Text("Nouvelle variante") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = nomVar, onValueChange = { nomVar = it }, label = { Text("Nom (ex: Romarin, 5 Baies…)") })
                    OutlinedTextField(value = descVar, onValueChange = { descVar = it }, label = { Text("Description des épices") })
                    OutlinedTextField(
                        value = epicesG,
                        onValueChange = { epicesG = it },
                        label = { Text("Épices (g par unité/kg)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = fumage, onCheckedChange = { fumage = it })
                        Text("Inclut un fumage")
                    }
                }
            },
            confirmButton = {
                Button(onClick = {
                    if (nomVar.isNotBlank()) {
                        viewModel.ajouterVarianteRecette(
                            r.id,
                            nomVar,
                            descVar,
                            epicesG.replace(",", ".").toDoubleOrNull() ?: 15.0,
                            null,
                            fumage
                        )
                    }
                    showAjoutVariante = false
                }) { Text("Ajouter") }
            },
            dismissButton = {
                TextButton(onClick = { showAjoutVariante = false }) { Text("Annuler") }
            }
        )
    }

    if (showConfirmationSuppression) {
        AlertDialog(
            onDismissRequest = { showConfirmationSuppression = false },
            icon = { Icon(Icons.Default.Delete, contentDescription = null, tint = MaterialTheme.colorScheme.error) },
            title = { Text("Supprimer la recette ?") },
            text = {
                Text("Voulez-vous vraiment supprimer définitivement « ${r.nom} » ?\nCette action est irréversible.")
            },
            confirmButton = {
                Button(
                    onClick = {
                        showConfirmationSuppression = false
                        viewModel.supprimerRecette(r)
                        onBack()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Supprimer")
                }
            },
            dismissButton = {
                TextButton(onClick = { showConfirmationSuppression = false }) {
                    Text("Annuler")
                }
            }
        )
    }
}

@Composable
private fun CreerRecetteDialog(
    optionPrixActive: Boolean,
    onDismiss: () -> Unit,
    onEnregistrer: (
        nom: String,
        famille: String,
        type: String,
        unite: String,
        quantiteDefaut: Double,
        perteCible: Double,
        tempCoeur: Double,
        description: String,
        ingredients: List<CharcuterieViewModel.DraftIngredient>,
        etapes: List<CharcuterieViewModel.DraftEtape>,
        variantes: List<String>
    ) -> Unit
) {
    var nom by remember { mutableStateOf("") }
    var famille by remember { mutableStateOf("Porc") }
    var typeRecette by remember { mutableStateOf("SALAISON_SECHE") }
    var uniteBase by remember { mutableStateOf("kg") }
    var quantiteDefaut by remember { mutableStateOf("1") }
    var perte by remember { mutableStateOf("35") }
    var tempCoeur by remember { mutableStateOf("0") }
    var desc by remember { mutableStateOf("") }

    val ingredients = remember {
        mutableStateListOf(
            CharcuterieViewModel.DraftIngredient("Matière première (viande/poisson)", 1000.0, "g", 12.0),
            CharcuterieViewModel.DraftIngredient("Sel fin sans additif", 30.0, "g", 0.1),
            CharcuterieViewModel.DraftIngredient("Poivre noir concassé", 3.0, "g", 0.2)
        )
    }

    val etapes = remember {
        mutableStateListOf(
            CharcuterieViewModel.DraftEtape(
                titre = "1. Salage & assaisonnement",
                instructions = "Mettre sous vide avec le sel et les épices, laisser reposer au froid (3-4°C).",
                dureeHeures = 24.0
            ),
            CharcuterieViewModel.DraftEtape(
                titre = "2. Séchage et affinage",
                instructions = "Suspendre en cave d'affinage à 12-14°C et 75-80% d'humidité jusqu'à la perte cible.",
                dureeHeures = 720.0
            )
        )
    }

    val variantes = remember {
        mutableStateListOf("Nature", "Fumé aux bois nobles")
    }

    val famillesDispos = listOf("Porc", "Canard", "Bœuf", "Poisson", "Gibier & Foie", "Autre")
    val typesDispos = listOf(
        "SALAISON_SECHE" to "Salaison sèche",
        "FUMAGE" to "Fumage",
        "CUISSON" to "Cuisson",
        "MELEE" to "Mêlée / Saucisse"
    )

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.92f),
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 6.dp
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // En-tête fixe
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Nouvelle recette",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Personnalisez tous les ingrédients et étapes",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Fermer")
                    }
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                // Contenu défilable
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(18.dp)
                ) {
                    // 1. Informations générales
                    Text("1. Informations de base", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)

                    OutlinedTextField(
                        value = nom,
                        onValueChange = { nom = it },
                        label = { Text("Nom de la recette *") },
                        placeholder = { Text("Ex: Saucisse sèche au piment d'Espelette") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    Text("Famille", style = MaterialTheme.typography.labelMedium)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(famillesDispos) { f ->
                            FilterChip(
                                selected = famille == f,
                                onClick = { famille = f },
                                label = { Text(f) },
                                shape = RoundedCornerShape(10.dp)
                            )
                        }
                    }

                    Text("Type de préparation", style = MaterialTheme.typography.labelMedium)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(typesDispos) { (code, label) ->
                            FilterChip(
                                selected = typeRecette == code,
                                onClick = { typeRecette = code },
                                label = { Text(label) },
                                shape = RoundedCornerShape(10.dp)
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedTextField(
                            value = uniteBase,
                            onValueChange = { uniteBase = it },
                            label = { Text("Unité base") },
                            placeholder = { Text("kg / pièce") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = perte,
                            onValueChange = { perte = it },
                            label = { Text("Perte cible %") },
                            placeholder = { Text("Ex: 35") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                    }

                    OutlinedTextField(
                        value = desc,
                        onValueChange = { desc = it },
                        label = { Text("Description ou conseils") },
                        placeholder = { Text("Description courte de la charcuterie...") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2
                    )

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                    // 2. Ingrédients
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "2. Ingrédients (${ingredients.size})",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                        FilledTonalButton(
                            onClick = {
                                ingredients.add(
                                    CharcuterieViewModel.DraftIngredient(
                                        nom = "Nouvel ingrédient",
                                        quantite = 10.0,
                                        unite = "g",
                                        prixEstime = 0.5
                                    )
                                )
                            },
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Ajouter", style = MaterialTheme.typography.labelSmall)
                        }
                    }

                    ingredients.forEachIndexed { idx, ing ->
                        Card(
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    OutlinedTextField(
                                        value = ing.nom,
                                        onValueChange = { newNom ->
                                            ingredients[idx] = ing.copy(nom = newNom)
                                        },
                                        label = { Text("Nom ingrédient") },
                                        modifier = Modifier.weight(1f),
                                        singleLine = true
                                    )
                                    IconButton(
                                        onClick = { ingredients.removeAt(idx) },
                                        modifier = Modifier.size(36.dp)
                                    ) {
                                        Icon(Icons.Default.Delete, contentDescription = "Supprimer", tint = MaterialTheme.colorScheme.error)
                                    }
                                }
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    OutlinedTextField(
                                        value = ing.quantite.toString(),
                                        onValueChange = { qStr ->
                                            val q = qStr.replace(",", ".").toDoubleOrNull() ?: ing.quantite
                                            ingredients[idx] = ing.copy(quantite = q)
                                        },
                                        label = { Text("Quantité") },
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                        modifier = Modifier.weight(1f),
                                        singleLine = true
                                    )
                                    OutlinedTextField(
                                        value = ing.unite,
                                        onValueChange = { uStr ->
                                            ingredients[idx] = ing.copy(unite = uStr)
                                        },
                                        label = { Text("Unité (g, kg, %)") },
                                        modifier = Modifier.weight(1f),
                                        singleLine = true
                                    )
                                    if (optionPrixActive) {
                                        OutlinedTextField(
                                            value = ing.prixEstime.toString(),
                                            onValueChange = { pStr ->
                                                val p = pStr.replace(",", ".").toDoubleOrNull() ?: ing.prixEstime
                                                ingredients[idx] = ing.copy(prixEstime = p)
                                            },
                                            label = { Text("Prix est. €") },
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                            modifier = Modifier.weight(1f),
                                            singleLine = true
                                        )
                                    }
                                }
                            }
                        }
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                    // 3. Étapes de préparation
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "3. Étapes du planning (${etapes.size})",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                        FilledTonalButton(
                            onClick = {
                                etapes.add(
                                    CharcuterieViewModel.DraftEtape(
                                        titre = "${etapes.size + 1}. Nouvelle étape",
                                        instructions = "Instructions de l'étape...",
                                        dureeHeures = 24.0
                                    )
                                )
                            },
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Ajouter", style = MaterialTheme.typography.labelSmall)
                        }
                    }

                    etapes.forEachIndexed { idx, etape ->
                        Card(
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    OutlinedTextField(
                                        value = etape.titre,
                                        onValueChange = { newTitre ->
                                            etapes[idx] = etape.copy(titre = newTitre)
                                        },
                                        label = { Text("Titre de l'étape") },
                                        modifier = Modifier.weight(1f),
                                        singleLine = true
                                    )
                                    IconButton(
                                        onClick = { etapes.removeAt(idx) },
                                        modifier = Modifier.size(36.dp)
                                    ) {
                                        Icon(Icons.Default.Delete, contentDescription = "Supprimer", tint = MaterialTheme.colorScheme.error)
                                    }
                                }
                                OutlinedTextField(
                                    value = etape.instructions,
                                    onValueChange = { newInst ->
                                        etapes[idx] = etape.copy(instructions = newInst)
                                    },
                                    label = { Text("Instructions détaillées") },
                                    modifier = Modifier.fillMaxWidth(),
                                    minLines = 2
                                )
                                OutlinedTextField(
                                    value = etape.dureeHeures.toString(),
                                    onValueChange = { dStr ->
                                        val d = dStr.replace(",", ".").toDoubleOrNull() ?: etape.dureeHeures
                                        etapes[idx] = etape.copy(dureeHeures = d)
                                    },
                                    label = { Text("Durée de l'étape (heures)") },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                    modifier = Modifier.fillMaxWidth(),
                                    singleLine = true
                                )
                            }
                        }
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                    // 4. Variantes
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "4. Variantes d'assaisonnement (${variantes.size})",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                        FilledTonalButton(
                            onClick = {
                                variantes.add("Variante ${variantes.size + 1}")
                            },
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Ajouter", style = MaterialTheme.typography.labelSmall)
                        }
                    }

                    variantes.forEachIndexed { idx, vNom ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedTextField(
                                value = vNom,
                                onValueChange = { newV -> variantes[idx] = newV },
                                label = { Text("Nom variante ${idx + 1}") },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                            if (variantes.size > 1) {
                                IconButton(
                                    onClick = { variantes.removeAt(idx) },
                                    modifier = Modifier.size(36.dp)
                                ) {
                                    Icon(Icons.Default.Delete, contentDescription = "Supprimer", tint = MaterialTheme.colorScheme.error)
                                }
                            }
                        }
                    }
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                // Barre d'actions
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Annuler")
                    }
                    Spacer(Modifier.width(8.dp))
                    Button(
                        onClick = {
                            if (nom.isNotBlank()) {
                                onEnregistrer(
                                    nom.trim(),
                                    famille,
                                    typeRecette,
                                    uniteBase.trim(),
                                    quantiteDefaut.replace(",", ".").toDoubleOrNull() ?: 1.0,
                                    perte.replace(",", ".").toDoubleOrNull() ?: 0.0,
                                    tempCoeur.replace(",", ".").toDoubleOrNull() ?: 0.0,
                                    desc.trim(),
                                    ingredients.toList(),
                                    etapes.toList(),
                                    variantes.toList()
                                )
                            }
                        },
                        enabled = nom.isNotBlank(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Créer la recette")
                    }
                }
            }
        }
    }
}

fun formatDuree(minutes: Int): String {
    return when {
        minutes < 60 -> "$minutes min"
        minutes < 1440 -> {
            val h = minutes / 60
            val m = minutes % 60
            if (m == 0) "${h}h" else "${h}h%02d".format(m)
        }
        else -> {
            val j = minutes / 1440
            "$j jours"
        }
    }
}
