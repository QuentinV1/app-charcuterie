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
import com.quentin.charcuterie.domain.ModeSalage
import com.quentin.charcuterie.domain.SalageHelper
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
// ÉCRAN DE PLANIFICATION D'UN PROJET (Nom + Date de début + Sélection Charcuterie + Quantité)
// ============================================================================================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun PlanifierProjetScreen(
    recettes: List<RecetteComplete>,
    recetteInitiale: RecetteComplete,
    evaluations: List<ProjetEvaluationEntity> = emptyList(),
    optionPrixActive: Boolean,
    optionReventeParDefaut: Boolean,
    majorationDefautPct: Double,
    prixCanardDefaut: Double = 18.0,
    prixSelKgDefaut: Double = 1.0,
    prixEpicesKgDefaut: Double = 25.0,
    onBack: () -> Unit,
    onSauvegarderLotCatalogue: (Long, String, String, Double, Double, Boolean) -> Unit,
    onConfirm: (String, RecetteComplete, Long, Double, Double, Double, Set<String>, List<LotDraft>, Boolean, Boolean, Double, ModeSalage) -> Unit
) {
    BackHandler { onBack() }

    var selectedRecetteId by remember { mutableLongStateOf(recetteInitiale.recette.id) }
    val selectedRecette = remember(recettes, selectedRecetteId) {
        recettes.find { it.recette.id == selectedRecetteId } ?: recetteInitiale
    }
    var nomPersonnaliseParUtilisateur by remember { mutableStateOf(false) }
    var nomProjet by remember { mutableStateOf("Projet ${recetteInitiale.recette.nom}") }

    var quantiteBase by remember(selectedRecette.recette.id) {
        val q = selectedRecette.recette.quantiteDefaut
        mutableStateOf(if (q % 1.0 == 0.0) q.toInt().toString() else q.toString())
    }
    var modeSalage by remember(selectedRecette.recette.id) {
        mutableStateOf(SalageHelper.modeSalageParDefaut(selectedRecette))
    }
    var prixUnitaire by remember(selectedRecette.recette.id, prixCanardDefaut) {
        val prixInit = if (selectedRecette.recette.code == "VALORISATION_CANARD" || selectedRecette.recette.famille.equals("Canard", ignoreCase = true)) {
            prixCanardDefaut
        } else {
            selectedRecette.ingredients.firstOrNull()?.prixKgOuUniteEstime?.takeIf { it > 0.0 } ?: 10.0
        }
        mutableStateOf("%.2f".format(Locale.US, prixInit))
    }
    var activerReventeProjet by remember { mutableStateOf(optionReventeParDefaut) }
    var activerRappels by remember { mutableStateOf(true) }
    var afficherOptionsAvancees by remember { mutableStateOf(false) }
    var showAddCustomLotDialog by remember { mutableStateOf(false) }

    // Menu déroulant avec recherche pour le choix de la charcuterie
    var menuCharcuterieOuvert by remember { mutableStateOf(false) }
    var rechercheCharcuterie by remember { mutableStateOf("") }
    var familleFiltre by remember { mutableStateOf("Toutes") }
    val familles = listOf("Toutes", "Canard", "Porc", "Bœuf", "Poisson", "Gibier & Foie")
    val recettesFiltrees = remember(recettes, familleFiltre, rechercheCharcuterie) {
        val nonMasquees = recettes.filter { !it.recette.masquee }
        val parFamille = if (familleFiltre == "Toutes") nonMasquees
        else nonMasquees.filter { it.recette.famille.equals(familleFiltre, ignoreCase = true) }
        if (rechercheCharcuterie.isBlank()) {
            parFamille
        } else {
            val q = rechercheCharcuterie.trim()
            parFamille.filter {
                it.recette.nom.contains(q, ignoreCase = true) ||
                it.recette.famille.contains(q, ignoreCase = true) ||
                it.variantes.any { v -> v.nom.contains(q, ignoreCase = true) }
            }
        }
    }

    // Gestion de la Date et de l'Heure de début
    var dateDebutMillis by remember {
        val cal = Calendar.getInstance().apply {
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        mutableLongStateOf(cal.timeInMillis)
    }
    var showDatePicker by remember { mutableStateOf(false) }
    var showTimePicker by remember { mutableStateOf(false) }

    // Sorties de découpe cochées
    val sortiesCochees = remember(selectedRecette.recette.id) {
        mutableStateMapOf<String, Boolean>().apply {
            selectedRecette.sortiesDecoupe.forEach { put(it.codeSortie, it.cocheParDefaut) }
        }
    }

    // Calcul en temps réel du coût de revient estimé et du prix de revente conseillé
    val estimationPrix = remember(selectedRecette, quantiteBase, prixUnitaire, sortiesCochees.toMap(), majorationDefautPct, prixSelKgDefaut, prixEpicesKgDefaut) {
        val q = quantiteBase.replace(",", ".").toDoubleOrNull() ?: 1.0
        val p = prixUnitaire.replace(",", ".").toDoubleOrNull() ?: 0.0
        val codesActifs = sortiesCochees.filterValues { it }.keys
        CalculateurCharcuterie.estimerPrixUnitairePlanification(
            recetteComplete = selectedRecette,
            quantiteBase = q,
            prixUnitaireMatiere = p,
            codesSortiesCochees = codesActifs,
            majorationDefautPct = majorationDefautPct,
            prixSelKg = prixSelKgDefaut,
            prixEpicesKg = prixEpicesKgDefaut
        )
    }

    var prixReventeModifieManuellement by remember(selectedRecette.recette.id) { mutableStateOf(false) }
    var prixReventeConseilleStr by remember(selectedRecette.recette.id) {
        mutableStateOf("%.2f".format(Locale.US, estimationPrix.prixReventeConseilleUnitaire))
    }

    LaunchedEffect(estimationPrix.prixReventeConseilleUnitaire) {
        if (!prixReventeModifieManuellement) {
            prixReventeConseilleStr = "%.2f".format(Locale.US, estimationPrix.prixReventeConseilleUnitaire)
        }
    }

    // Répartition des variantes du catalogue
    val qteParVariante = remember(selectedRecette.recette.id) {
        mutableStateMapOf<String, String>().apply {
            selectedRecette.variantes.forEachIndexed { idx, v ->
                val defVal = if (selectedRecette.recette.code == "VALORISATION_CANARD") {
                    when (v.nom) {
                        "Paprika" -> "10"
                        "Café" -> "3"
                        "Fumé" -> "7"
                        else -> "0"
                    }
                } else if (idx == 0) selectedRecette.recette.quantiteDefaut.toInt().toString() else "0"
                put(v.nom, defVal)
            }
        }
    }

    // Lots supplémentaires personnalisés ajoutés manuellement pendant la planification
    val lotsPersonnalises = remember(selectedRecette.recette.id) {
        mutableStateListOf<LotDraft>()
    }

    // Si une nouvelle variante a été ajoutée au catalogue, s'assurer qu'elle a une entrée dans qteParVariante
    LaunchedEffect(selectedRecette.variantes) {
        selectedRecette.variantes.forEach { v ->
            if (!qteParVariante.containsKey(v.nom)) {
                qteParVariante[v.nom] = "0"
            }
        }
    }

    val dateFormatter = remember { SimpleDateFormat("EEEE dd MMMM yyyy", Locale.FRANCE) }
    val heureFormatter = remember { SimpleDateFormat("HH'h'mm", Locale.FRANCE) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Barre supérieure épurée
        Surface(
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 0.dp
        ) {
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
                            text = "Planifier un projet",
                            style = MaterialTheme.typography.titleLarge
                        )
                        Text(
                            text = "Nom, date de début et choix de la charcuterie",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            }
        }

        // Contenu principal déroulant
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
            contentPadding = PaddingValues(top = 18.dp, bottom = 32.dp)
        ) {
            // BLOC 1 : NOM DU PROJET
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(Modifier.padding(18.dp)) {
                        SectionHeaderBadge("1", "Nom de votre projet")
                        Spacer(Modifier.height(10.dp))
                        OutlinedTextField(
                            value = nomProjet,
                            onValueChange = {
                                nomProjet = it
                                nomPersonnaliseParUtilisateur = true
                            },
                            label = { Text("Ex : Magrets d'automne, Jambon d'hiver…") },
                            singleLine = true,
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }

            // Rappel automatique de la dernière évaluation de cette recette
            val derniereEval = evaluations
                .filter { it.recetteId == selectedRecette.recette.id || it.nomRecette.equals(selectedRecette.recette.nom, ignoreCase = true) }
                .maxByOrNull { it.dateMillis }
            if (derniereEval != null) {
                item {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.55f)),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.35f))
                    ) {
                        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                "💡 Retour dernière session (${SimpleDateFormat("dd MMM yyyy", Locale.FRANCE).format(Date(derniereEval.dateMillis))}) — ${"⭐".repeat(derniereEval.noteGlobale)}",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                "Texture : ${derniereEval.texture} · Salinité : ${derniereEval.salinite} · Arômes : ${derniereEval.aromes}",
                                style = MaterialTheme.typography.bodySmall
                            )
                            if (derniereEval.commentaire.isNotBlank()) {
                                Text(
                                    "📝 \"${derniereEval.commentaire}\"",
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }
                }
            }

            // BLOC 2 : DATE & HEURE DE DÉBUT
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(Modifier.padding(18.dp)) {
                        SectionHeaderBadge("2", "Date et heure de début")
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = "Quand souhaitez-vous commencer la préparation ?",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(Modifier.height(12.dp))

                        // Raccourcis rapides en 1 clic
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            item {
                                SuggestionChip(
                                    onClick = {
                                        dateDebutMillis = System.currentTimeMillis()
                                    },
                                    label = { Text("Maintenant") },
                                    icon = { Icon(Icons.Default.Bolt, contentDescription = null, modifier = Modifier.size(16.dp)) }
                                )
                            }
                            item {
                                SuggestionChip(
                                    onClick = {
                                        val cal = Calendar.getInstance().apply {
                                            add(Calendar.DAY_OF_YEAR, 1)
                                            set(Calendar.HOUR_OF_DAY, 9)
                                            set(Calendar.MINUTE, 0)
                                        }
                                        dateDebutMillis = cal.timeInMillis
                                    },
                                    label = { Text("Demain 9h00") }
                                )
                            }
                            item {
                                SuggestionChip(
                                    onClick = {
                                        val cal = Calendar.getInstance().apply {
                                            while (get(Calendar.DAY_OF_WEEK) != Calendar.SATURDAY) {
                                                add(Calendar.DAY_OF_YEAR, 1)
                                            }
                                            set(Calendar.HOUR_OF_DAY, 9)
                                            set(Calendar.MINUTE, 0)
                                        }
                                        dateDebutMillis = cal.timeInMillis
                                    },
                                    label = { Text("Samedi 9h00") }
                                )
                            }
                        }

                        Spacer(Modifier.height(10.dp))

                        // Boutons Calendrier et Heure bien visibles
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            OutlinedCard(
                                onClick = { showDatePicker = true },
                                modifier = Modifier.weight(1.4f),
                                shape = RoundedCornerShape(14.dp),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.5f))
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        Icons.Default.CalendarMonth,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "Jour de début",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        Text(
                                            text = dateFormatter.format(Date(dateDebutMillis)).replaceFirstChar { it.uppercase() },
                                            style = MaterialTheme.typography.labelLarge,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }
                            }

                            OutlinedCard(
                                onClick = { showTimePicker = true },
                                modifier = Modifier.weight(0.9f),
                                shape = RoundedCornerShape(14.dp),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.5f))
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        Icons.Default.Schedule,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "Heure",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        Text(
                                            text = heureFormatter.format(Date(dateDebutMillis)),
                                            style = MaterialTheme.typography.labelLarge,
                                            maxLines = 1
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // BLOC 3 : SÉLECTIONNER UNE CHARCUTERIE (Menu Déroulant avec Recherche & Filtres)
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
                            SectionHeaderBadge("3", "Charcuterie à préparer")
                            SuggestionChip(
                                onClick = { menuCharcuterieOuvert = !menuCharcuterieOuvert },
                                label = { Text(if (menuCharcuterieOuvert) "Fermer le menu" else "Changer") },
                                icon = {
                                    Icon(
                                        imageVector = if (menuCharcuterieOuvert) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                        contentDescription = null,
                                        modifier = Modifier.size(16.dp)
                                    )
                                },
                                shape = RoundedCornerShape(10.dp)
                            )
                        }

                        Spacer(Modifier.height(10.dp))

                        // Bouton principal du menu déroulant (affiche la charcuterie courante)
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .clickable { menuCharcuterieOuvert = !menuCharcuterieOuvert },
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f),
                            border = BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.85f))
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(42.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(
                                            Icons.Default.Check,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.onPrimary,
                                            modifier = Modifier.size(22.dp)
                                        )
                                    }
                                }
                                Spacer(Modifier.width(12.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = selectedRecette.recette.nom,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                    Spacer(Modifier.height(2.dp))
                                    Text(
                                        text = "${selectedRecette.recette.famille} · ${selectedRecette.etapes.size} étapes guidées · ${selectedRecette.variantes.size} variantes",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Spacer(Modifier.width(8.dp))
                                Icon(
                                    imageVector = if (menuCharcuterieOuvert) Icons.Default.ExpandLess else Icons.Default.ArrowDropDown,
                                    contentDescription = "Ouvrir le menu déroulant",
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(28.dp)
                                )
                            }
                        }

                        // PANNEAU DÉROULANT AVEC RECHERCHE EN TEMPS RÉEL
                        AnimatedVisibility(visible = menuCharcuterieOuvert) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 14.dp)
                            ) {
                                // Champ de recherche textuelle instantanée
                                OutlinedTextField(
                                    value = rechercheCharcuterie,
                                    onValueChange = { rechercheCharcuterie = it },
                                    label = { Text("Rechercher une charcuterie…") },
                                    placeholder = { Text("Ex: canard, coppa, saucisson, saumon…") },
                                    leadingIcon = {
                                        Icon(
                                            Icons.Default.Search,
                                            contentDescription = "Rechercher",
                                            tint = MaterialTheme.colorScheme.primary
                                        )
                                    },
                                    trailingIcon = {
                                        if (rechercheCharcuterie.isNotBlank()) {
                                            IconButton(onClick = { rechercheCharcuterie = "" }) {
                                                Icon(Icons.Default.Clear, contentDescription = "Effacer")
                                            }
                                        }
                                    },
                                    singleLine = true,
                                    shape = RoundedCornerShape(14.dp),
                                    modifier = Modifier.fillMaxWidth()
                                )

                                Spacer(Modifier.height(10.dp))

                                // Filtres rapides par type de viande
                                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    items(familles) { fam ->
                                        FilterChip(
                                            selected = familleFiltre == fam,
                                            onClick = { familleFiltre = fam },
                                            label = { Text(fam) },
                                            shape = RoundedCornerShape(12.dp)
                                        )
                                    }
                                }

                                Spacer(Modifier.height(10.dp))

                                // Liste des résultats dans le menu déroulant
                                Surface(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(14.dp)),
                                    shape = RoundedCornerShape(14.dp),
                                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                                ) {
                                    if (recettesFiltrees.isEmpty()) {
                                        Column(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(24.dp),
                                            horizontalAlignment = Alignment.CenterHorizontally
                                        ) {
                                            Icon(
                                                Icons.Default.SearchOff,
                                                contentDescription = null,
                                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                                modifier = Modifier.size(32.dp)
                                            )
                                            Spacer(Modifier.height(8.dp))
                                            Text(
                                                text = "Aucune charcuterie trouvée pour « $rechercheCharcuterie »",
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    } else {
                                        Column(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(8.dp),
                                            verticalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            recettesFiltrees.forEach { rc ->
                                                val estSelectionnee = selectedRecette.recette.id == rc.recette.id
                                                Surface(
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .clip(RoundedCornerShape(10.dp))
                                                        .clickable {
                                                            selectedRecetteId = rc.recette.id
                                                            if (!nomPersonnaliseParUtilisateur) {
                                                                nomProjet = "Projet ${rc.recette.nom}"
                                                            }
                                                            menuCharcuterieOuvert = false
                                                            rechercheCharcuterie = ""
                                                        },
                                                    shape = RoundedCornerShape(10.dp),
                                                    color = if (estSelectionnee) MaterialTheme.colorScheme.primaryContainer else Color.Transparent
                                                ) {
                                                    Row(
                                                        modifier = Modifier
                                                            .fillMaxWidth()
                                                            .padding(horizontal = 12.dp, vertical = 10.dp),
                                                        verticalAlignment = Alignment.CenterVertically
                                                    ) {
                                                        Icon(
                                                            imageVector = if (estSelectionnee) Icons.Default.CheckCircle else Icons.Outlined.Circle,
                                                            contentDescription = null,
                                                            tint = if (estSelectionnee) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                                                            modifier = Modifier.size(20.dp)
                                                        )
                                                        Spacer(Modifier.width(10.dp))
                                                        Column(modifier = Modifier.weight(1f)) {
                                                            Text(
                                                                text = rc.recette.nom,
                                                                style = MaterialTheme.typography.bodyLarge,
                                                                fontWeight = if (estSelectionnee) FontWeight.Bold else FontWeight.Normal,
                                                                color = if (estSelectionnee) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface
                                                            )
                                                            Text(
                                                                text = "${rc.recette.famille} · ${rc.etapes.size} étapes · ${rc.variantes.size} variantes",
                                                                style = MaterialTheme.typography.labelSmall,
                                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                                            )
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
                }
            }

            // BLOC 4 : QUANTITÉ & OPTIONS AVANCÉES REPLIABLES
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(Modifier.padding(18.dp)) {
                        SectionHeaderBadge("4", "Quantité à préparer")
                        Spacer(Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            FilledTonalIconButton(
                                onClick = {
                                    val actuel = quantiteBase.replace(",", ".").toDoubleOrNull() ?: 1.0
                                    val nouveau = (actuel - 1.0).coerceAtLeast(1.0)
                                    quantiteBase = if (nouveau % 1.0 == 0.0) nouveau.toInt().toString() else nouveau.toString()
                                }
                            ) {
                                Icon(Icons.Default.Remove, contentDescription = "Moins")
                            }

                            OutlinedTextField(
                                value = quantiteBase,
                                onValueChange = { quantiteBase = it },
                                label = { Text("Quantité (${selectedRecette.recette.uniteBase})") },
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.weight(1f)
                            )

                            FilledTonalIconButton(
                                onClick = {
                                    val actuel = quantiteBase.replace(",", ".").toDoubleOrNull() ?: 1.0
                                    val nouveau = actuel + 1.0
                                    quantiteBase = if (nouveau % 1.0 == 0.0) nouveau.toInt().toString() else nouveau.toString()
                                }
                            ) {
                                Icon(Icons.Default.Add, contentDescription = "Plus")
                            }
                        }

                        Spacer(Modifier.height(14.dp))

                        // Sélection du mode de salage : Recouvrement au sel vs Sous-vide
                        val qBaseNum = quantiteBase.replace(",", ".").toDoubleOrNull() ?: selectedRecette.recette.quantiteDefaut
                        val dureeRecouvrementH = remember(selectedRecette.recette.id, qBaseNum) {
                            SalageHelper.dureeSalageHeuresAdaptee(selectedRecette, ModeSalage.RECOUVREMENT_SEL, qBaseNum)
                        }
                        val dureeSousVideH = remember(selectedRecette.recette.id, qBaseNum) {
                            SalageHelper.dureeSalageHeuresAdaptee(selectedRecette, ModeSalage.SOUS_VIDE, qBaseNum)
                        }

                        Text(
                            text = "Méthode de salage",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            listOf(
                                ModeSalage.RECOUVREMENT_SEL to dureeRecouvrementH,
                                ModeSalage.SOUS_VIDE to dureeSousVideH
                            ).forEach { (mode, dureeH) ->
                                val selected = modeSalage == mode
                                Surface(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(14.dp))
                                        .clickable { modeSalage = mode },
                                    shape = RoundedCornerShape(14.dp),
                                    color = if (selected) MaterialTheme.colorScheme.primaryContainer
                                    else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                                    border = BorderStroke(
                                        width = if (selected) 1.5.dp else 1.dp,
                                        color = if (selected) MaterialTheme.colorScheme.primary
                                        else MaterialTheme.colorScheme.outlineVariant
                                    )
                                ) {
                                    Column(
                                        modifier = Modifier.padding(12.dp),
                                        verticalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            Icon(
                                                imageVector = if (selected) Icons.Default.CheckCircle else Icons.Outlined.Circle,
                                                contentDescription = null,
                                                tint = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                                                modifier = Modifier.size(18.dp)
                                            )
                                            Text(
                                                text = mode.libelle,
                                                style = MaterialTheme.typography.labelLarge,
                                                fontWeight = FontWeight.Bold,
                                                color = if (selected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface
                                            )
                                        }
                                        Text(
                                            text = if (mode == ModeSalage.RECOUVREMENT_SEL) "Gros sel · ${SalageHelper.formaterDureeSalage(dureeH)}"
                                            else "3 % sel · ${SalageHelper.formaterDureeSalage(dureeH)}",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                }
                            }
                        }
                        Spacer(Modifier.height(6.dp))
                        val dureeSelectionneeH = if (modeSalage == ModeSalage.SOUS_VIDE) dureeSousVideH else dureeRecouvrementH
                        Text(
                            text = "⏱️ Mise au sel : ${SalageHelper.formaterDureeSalage(dureeSelectionneeH)} · Les étapes et la liste de courses s'adaptent automatiquement.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(Modifier.height(12.dp))

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { activerRappels = !activerRappels }
                        ) {
                            Switch(checked = activerRappels, onCheckedChange = { activerRappels = it })
                            Spacer(Modifier.width(10.dp))
                            Text(
                                text = "M'envoyer une notification à chaque étape",
                                style = MaterialTheme.typography.bodyMedium,
                                modifier = Modifier.weight(1f)
                            )
                        }

                        Spacer(Modifier.height(8.dp))
                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                        Spacer(Modifier.height(8.dp))

                        // Bouton pour afficher/masquer la personnalisation avancée (lots d'épices, découpe, prix)
                        TextButton(
                            onClick = { afficherOptionsAvancees = !afficherOptionsAvancees },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(
                                if (afficherOptionsAvancees) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                contentDescription = null
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(
                                if (afficherOptionsAvancees) "Masquer les options avancées"
                                else if (optionPrixActive) "Options avancées (lots personnalisés, découpe, prix)"
                                else "Options avancées (lots personnalisés, découpe)"
                            )
                        }

                        AnimatedVisibility(visible = afficherOptionsAvancees) {
                            Column(
                                modifier = Modifier.padding(top = 12.dp),
                                verticalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                if (optionPrixActive) {
                                    // Option Revente activable / désactivable
                                    Surface(
                                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                                        shape = RoundedCornerShape(14.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .clickable { activerReventeProjet = !activerReventeProjet }
                                                .padding(horizontal = 14.dp, vertical = 10.dp),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(
                                                    text = "Option Revente sur ce projet",
                                                    style = MaterialTheme.typography.titleSmall
                                                )
                                                Text(
                                                    text = if (activerReventeProjet) "Affiche les prix de revente conseillés et les commandes"
                                                    else "Masque la revente (usage personnel uniquement)",
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                            Spacer(Modifier.width(8.dp))
                                            Switch(
                                                checked = activerReventeProjet,
                                                onCheckedChange = { activerReventeProjet = it }
                                            )
                                        }
                                    }

                                    // Prix d'achat matière première + Prix de revente conseillé (au lieu de "Marge amis (%)")
                                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                        OutlinedTextField(
                                            value = prixUnitaire,
                                            onValueChange = { prixUnitaire = it },
                                            label = { Text("Prix achat €/${selectedRecette.recette.uniteBase}") },
                                            singleLine = true,
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                            modifier = Modifier.weight(1f)
                                        )
                                        if (activerReventeProjet) {
                                            OutlinedTextField(
                                                value = prixReventeConseilleStr,
                                                onValueChange = {
                                                    prixReventeConseilleStr = it
                                                    prixReventeModifieManuellement = true
                                                },
                                                label = { Text("Prix de revente conseillé (€)") },
                                                singleLine = true,
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                                modifier = Modifier.weight(1.2f)
                                            )
                                        }
                                    }

                                    if (activerReventeProjet) {
                                        Surface(
                                            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.6f),
                                            shape = RoundedCornerShape(10.dp),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text(
                                                    text = "Coût de revient estimé (${estimationPrix.nomProduitPrincipal}) : ${formatEuro(estimationPrix.coutRevientUnitaireEstime)} / ${estimationPrix.uniteProduitPrincipal}",
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                                                    modifier = Modifier.weight(1f)
                                                )
                                                if (prixReventeModifieManuellement) {
                                                    TextButton(
                                                        onClick = {
                                                            prixReventeModifieManuellement = false
                                                            prixReventeConseilleStr = "%.2f".format(Locale.US, estimationPrix.prixReventeConseilleUnitaire)
                                                        },
                                                        contentPadding = PaddingValues(horizontal = 6.dp, vertical = 0.dp)
                                                    ) {
                                                        Text("Réinitialiser", style = MaterialTheme.typography.labelSmall)
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                // Répartition en lots + Ajout manuel de lots supplémentaires personnalisables
                                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = "Lots d'épices & variantes",
                                                style = MaterialTheme.typography.titleSmall
                                            )
                                            Text(
                                                text = "Répartissez vos quantités ou ajoutez un lot personnalisé.",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                        Spacer(Modifier.width(8.dp))
                                        FilledTonalButton(
                                            onClick = { showAddCustomLotDialog = true },
                                            shape = RoundedCornerShape(10.dp),
                                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                        ) {
                                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                            Spacer(Modifier.width(4.dp))
                                            Text("Ajouter un lot", style = MaterialTheme.typography.labelMedium)
                                        }
                                    }

                                    selectedRecette.variantes.forEach { v ->
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(
                                                    text = v.nom,
                                                    style = MaterialTheme.typography.bodyMedium,
                                                    fontWeight = FontWeight.Medium
                                                )
                                                val salageVarH = SalageHelper.dureeSalageHeuresAdaptee(
                                                    selectedRecette,
                                                    modeSalage,
                                                    qBaseNum,
                                                    v.dureeSalageHeuresSpecifique
                                                )
                                                Text(
                                                    text = "${v.epicesGrammesParUnite.toInt()}g épices · Salage ${SalageHelper.formaterDureeSalage(salageVarH)}",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                            Spacer(Modifier.width(8.dp))
                                            OutlinedTextField(
                                                value = qteParVariante[v.nom] ?: "0",
                                                onValueChange = { qteParVariante[v.nom] = it },
                                                label = { Text("Qté") },
                                                singleLine = true,
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                                modifier = Modifier.width(95.dp)
                                            )
                                        }
                                    }

                                    // Lots supplémentaires personnalisés ajoutés à la volée
                                    lotsPersonnalises.forEachIndexed { idx, customLot ->
                                        Surface(
                                            color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.45f),
                                            shape = RoundedCornerShape(12.dp),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Row(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .padding(horizontal = 12.dp, vertical = 8.dp),
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Column(modifier = Modifier.weight(1f)) {
                                                    Text(
                                                        text = "${customLot.variante} (Lot personnalisé)",
                                                        style = MaterialTheme.typography.bodyMedium,
                                                        fontWeight = FontWeight.SemiBold,
                                                        color = MaterialTheme.colorScheme.onSecondaryContainer
                                                    )
                                                    Text(
                                                        text = "${customLot.epicesGrammesParUnite.toInt()}g épices · Salage ${customLot.dureeSalageHeures.toInt()}h",
                                                        style = MaterialTheme.typography.labelSmall,
                                                        color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.8f)
                                                    )
                                                }
                                                OutlinedTextField(
                                                    value = if (customLot.quantite % 1.0 == 0.0) customLot.quantite.toInt().toString() else customLot.quantite.toString(),
                                                    onValueChange = { newVal ->
                                                        val q = newVal.replace(",", ".").toDoubleOrNull() ?: 0.0
                                                        lotsPersonnalises[idx] = customLot.copy(quantite = q)
                                                    },
                                                    label = { Text("Qté") },
                                                    singleLine = true,
                                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                                    modifier = Modifier.width(85.dp)
                                                )
                                                IconButton(onClick = { lotsPersonnalises.removeAt(idx) }) {
                                                    Icon(
                                                        Icons.Default.Close,
                                                        contentDescription = "Retirer ce lot",
                                                        modifier = Modifier.size(18.dp)
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }

                                if (selectedRecette.sortiesDecoupe.isNotEmpty()) {
                                    Text(
                                        text = "Parties à valoriser :",
                                        style = MaterialTheme.typography.titleSmall
                                    )
                                    selectedRecette.sortiesDecoupe.forEach { s ->
                                        val checked = sortiesCochees[s.codeSortie] ?: s.cocheParDefaut
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .clickable { sortiesCochees[s.codeSortie] = !checked }
                                                .padding(vertical = 4.dp)
                                        ) {
                                            Checkbox(
                                                checked = checked,
                                                onCheckedChange = { sortiesCochees[s.codeSortie] = it }
                                            )
                                            Text(
                                                text = "${s.nom} (${s.rendementParUniteBase} ${s.unite}/${selectedRecette.recette.uniteBase})",
                                                style = MaterialTheme.typography.bodyMedium,
                                                modifier = Modifier.weight(1f)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Barre d'action inférieure fixe
        Surface(
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 4.dp
        ) {
            Column {
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedButton(
                        onClick = onBack,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(14.dp),
                        contentPadding = PaddingValues(vertical = 14.dp)
                    ) {
                        Text("Annuler")
                    }
                    Button(
                        onClick = {
                            val qBase = quantiteBase.replace(",", ".").toDoubleOrNull() ?: 1.0
                            val pUnit = prixUnitaire.replace(",", ".").toDoubleOrNull() ?: 0.0
                            val prixRevUnit = if (activerReventeProjet) {
                                prixReventeConseilleStr.replace(",", ".").toDoubleOrNull() ?: estimationPrix.prixReventeConseilleUnitaire
                            } else 0.0
                            val coutUnitEstime = estimationPrix.coutRevientUnitaireEstime.coerceAtLeast(0.01)
                            val mPct = if (activerReventeProjet && prixRevUnit > 0.0) {
                                (((prixRevUnit - coutUnitEstime) / coutUnitEstime) * 100.0).coerceAtLeast(0.0)
                            } else majorationDefautPct

                            val codesActifs = sortiesCochees.filterValues { it }.keys
                            val lotsCatalogue = selectedRecette.variantes.mapNotNull { v ->
                                val q = (qteParVariante[v.nom] ?: "0").replace(",", ".").toDoubleOrNull() ?: 0.0
                                if (q > 0.0) {
                                    val salH = SalageHelper.dureeSalageHeuresAdaptee(selectedRecette, modeSalage, qBase, v.dureeSalageHeuresSpecifique)
                                    LotDraft(v.nom, q, v.epicesGrammesParUnite, salH)
                                } else null
                            }
                            val lotsCustomValides = lotsPersonnalises.filter { it.quantite > 0.0 }

                            val lots = if (afficherOptionsAvancees || lotsCustomValides.isNotEmpty()) {
                                lotsCatalogue + lotsCustomValides
                            } else {
                                if (selectedRecette.recette.code == "VALORISATION_CANARD" && qBase == 10.0) {
                                    lotsCatalogue
                                } else {
                                    val premVar = selectedRecette.variantes.firstOrNull()
                                    if (premVar != null) {
                                        val nbPieces = if (selectedRecette.recette.code == "VALORISATION_CANARD") qBase * 2.0 else qBase
                                        val salH = SalageHelper.dureeSalageHeuresAdaptee(selectedRecette, modeSalage, qBase, premVar.dureeSalageHeuresSpecifique)
                                        listOf(LotDraft(premVar.nom, nbPieces, premVar.epicesGrammesParUnite, salH))
                                    } else emptyList()
                                }
                            }
                            onConfirm(
                                nomProjet.ifBlank { "Projet ${selectedRecette.recette.nom}" },
                                selectedRecette,
                                dateDebutMillis,
                                qBase,
                                pUnit,
                                mPct,
                                codesActifs,
                                lots,
                                activerRappels,
                                activerReventeProjet,
                                prixRevUnit,
                                modeSalage
                            )
                        },
                        modifier = Modifier.weight(1.8f),
                        shape = RoundedCornerShape(14.dp),
                        contentPadding = PaddingValues(vertical = 14.dp)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Lancer le projet", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // Dialogue d'ajout manuel d'un lot supplémentaire personnalisable pendant la planification
    if (showAddCustomLotDialog) {
        var nomLot by remember { mutableStateOf("") }
        var qteLot by remember { mutableStateOf("4") }
        var epicesLotG by remember { mutableStateOf("15") }
        var salageLotH by remember { mutableStateOf("24") }
        var descLot by remember { mutableStateOf("") }
        var fumageLot by remember { mutableStateOf(false) }
        var sauvegarderDansCatalogue by remember { mutableStateOf(true) }

        AlertDialog(
            onDismissRequest = { showAddCustomLotDialog = false },
            title = { Text("Ajouter un lot personnalisé") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = nomLot,
                        onValueChange = { nomLot = it },
                        label = { Text("Nom du lot / épices (ex: Miel & Romarin)") },
                        singleLine = true
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = qteLot,
                            onValueChange = { qteLot = it },
                            label = { Text("Quantité") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = epicesLotG,
                            onValueChange = { epicesLotG = it },
                            label = { Text("Épices (g/u)") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = salageLotH,
                            onValueChange = { salageLotH = it },
                            label = { Text("Salage (h)") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = descLot,
                            onValueChange = { descLot = it },
                            label = { Text("Note épices (optionnel)") },
                            singleLine = true,
                            modifier = Modifier.weight(1.3f)
                        )
                    }
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.clickable { sauvegarderDansCatalogue = !sauvegarderDansCatalogue }
                    ) {
                        Checkbox(
                            checked = sauvegarderDansCatalogue,
                            onCheckedChange = { sauvegarderDansCatalogue = it }
                        )
                        Text(
                            text = "Enregistrer aussi ce lot dans mes lots prédéfinis",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            },
            confirmButton = {
                Button(onClick = {
                    val nomClean = nomLot.trim()
                    if (nomClean.isNotBlank()) {
                        val q = qteLot.replace(",", ".").toDoubleOrNull() ?: 1.0
                        val epG = epicesLotG.replace(",", ".").toDoubleOrNull() ?: 15.0
                        val salH = salageLotH.replace(",", ".").toDoubleOrNull() ?: 24.0
                        if (sauvegarderDansCatalogue) {
                            onSauvegarderLotCatalogue(
                                selectedRecette.recette.id,
                                nomClean,
                                descLot.ifBlank { "Lot personnalisé ($epG g)" },
                                epG,
                                salH,
                                fumageLot
                            )
                            qteParVariante[nomClean] = if (q % 1.0 == 0.0) q.toInt().toString() else q.toString()
                        } else {
                            lotsPersonnalises.add(
                                LotDraft(
                                    variante = nomClean,
                                    quantite = q,
                                    epicesGrammesParUnite = epG,
                                    dureeSalageHeures = salH
                                )
                            )
                        }
                    }
                    showAddCustomLotDialog = false
                }) { Text("Ajouter") }
            },
            dismissButton = {
                TextButton(onClick = { showAddCustomLotDialog = false }) { Text("Annuler") }
            }
        )
    }

    // Sélecteur de Date Material 3
    if (showDatePicker) {
        val datePickerState = rememberDatePickerState(initialSelectedDateMillis = dateDebutMillis)
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                Button(onClick = {
                    datePickerState.selectedDateMillis?.let { selectedUtc ->
                        val calUtc = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply { timeInMillis = selectedUtc }
                        val calLocal = Calendar.getInstance().apply {
                            timeInMillis = dateDebutMillis
                            set(Calendar.YEAR, calUtc.get(Calendar.YEAR))
                            set(Calendar.MONTH, calUtc.get(Calendar.MONTH))
                            set(Calendar.DAY_OF_MONTH, calUtc.get(Calendar.DAY_OF_MONTH))
                        }
                        dateDebutMillis = calLocal.timeInMillis
                    }
                    showDatePicker = false
                }) {
                    Text("Valider")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) { Text("Annuler") }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }

    // Sélecteur d'Heure Material 3
    if (showTimePicker) {
        val calActuel = remember(dateDebutMillis) {
            Calendar.getInstance().apply { timeInMillis = dateDebutMillis }
        }
        val timePickerState = rememberTimePickerState(
            initialHour = calActuel.get(Calendar.HOUR_OF_DAY),
            initialMinute = calActuel.get(Calendar.MINUTE),
            is24Hour = true
        )
        AlertDialog(
            onDismissRequest = { showTimePicker = false },
            title = { Text("Heure de début") },
            text = {
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    TimePicker(state = timePickerState)
                }
            },
            confirmButton = {
                Button(onClick = {
                    val cal = Calendar.getInstance().apply {
                        timeInMillis = dateDebutMillis
                        set(Calendar.HOUR_OF_DAY, timePickerState.hour)
                        set(Calendar.MINUTE, timePickerState.minute)
                        set(Calendar.SECOND, 0)
                    }
                    dateDebutMillis = cal.timeInMillis
                    showTimePicker = false
                }) {
                    Text("Valider")
                }
            },
            dismissButton = {
                TextButton(onClick = { showTimePicker = false }) { Text("Annuler") }
            }
        )
    }
}

@Composable
private fun SectionHeaderBadge(numero: String, titre: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(26.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primaryContainer),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = numero,
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Bold
            )
        }
        Spacer(Modifier.width(10.dp))
        Text(
            text = titre,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}
