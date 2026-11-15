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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProjetsScreen(
    viewModel: CharcuterieViewModel,
    recettePreselectionnee: RecetteComplete?,
    onConsommerPreselection: () -> Unit,
    onAllerAuxRecettes: () -> Unit = {},
    onAllerAuxReglages: () -> Unit = {}
) {
    val projets by viewModel.projets.collectAsState()
    val recettes by viewModel.recettes.collectAsState()
    val parametres by viewModel.parametres.collectAsState()
    var projetOuvertId by rememberSaveable { mutableStateOf<Long?>(null) }
    var showCreateScreen by rememberSaveable { mutableStateOf(false) }
    var recettePourCreationId by rememberSaveable { mutableStateOf<Long?>(null) }
    val recettePourCreation = remember(recettes, recettePourCreationId) {
        recettePourCreationId?.let { id -> recettes.find { it.recette.id == id } }
    }
    val guideMasqueEnBase = remember(parametres) {
        (parametres.find { it.cle == "MASQUER_GUIDE_DEBUTANT" }?.valeur ?: 0.0) >= 0.5
    }
    var guideMasqueLocal by rememberSaveable { mutableStateOf(false) }
    val afficherGuideDebutant = !guideMasqueEnBase && !guideMasqueLocal

    val optionPrixActive = remember(parametres) {
        (parametres.find { it.cle == "ACTIVER_PRIX" }?.valeur ?: 1.0) >= 0.5
    }
    val optionReventeGlobale = remember(parametres, optionPrixActive) {
        optionPrixActive && ((parametres.find { it.cle == "ACTIVER_REVENTE" }?.valeur ?: 1.0) >= 0.5)
    }
    val majorationDefautPct = remember(parametres) {
        parametres.find { it.cle == "MARGE_AMIS_PCT" }?.valeur ?: 10.0
    }
    val prixCanardDefaut = remember(parametres) {
        parametres.find { it.cle == "PRIX_CANARD" }?.valeur ?: 18.0
    }
    val prixSelKgDefaut = remember(parametres) {
        parametres.find { it.cle == "PRIX_SEL_KG" }?.valeur ?: 1.0
    }
    val prixEpicesKgDefaut = remember(parametres) {
        parametres.find { it.cle == "PRIX_EPICES_KG" }?.valeur ?: 25.0
    }

    LaunchedEffect(recettePreselectionnee) {
        if (recettePreselectionnee != null) {
            recettePourCreationId = recettePreselectionnee.recette.id
            showCreateScreen = true
            onConsommerPreselection()
        }
    }

    // 1. Écran de création de projet plein écran moderne et guidé
    if (showCreateScreen && recettes.isNotEmpty()) {
        val evaluations by viewModel.evaluations.collectAsState()
        PlanifierProjetScreen(
            recettes = recettes,
            recetteInitiale = recettePourCreation ?: recettes.first(),
            evaluations = evaluations,
            optionPrixActive = optionPrixActive,
            optionReventeParDefaut = optionReventeGlobale,
            majorationDefautPct = majorationDefautPct,
            prixCanardDefaut = prixCanardDefaut,
            prixSelKgDefaut = prixSelKgDefaut,
            prixEpicesKgDefaut = prixEpicesKgDefaut,
            onBack = { showCreateScreen = false },
            onSauvegarderLotCatalogue = { recetteId, nom, desc, epicesG, salageH, fumage ->
                viewModel.ajouterVarianteRecette(recetteId, nom, desc, epicesG, salageH, fumage)
            },
            onConfirm = { nom, rec, dateDebutMillis, qte, prixUnit, marge, sortiesCochees, lots, rappels, activerRevente, prixReventeFixe, modeSalage ->
                viewModel.creerProjet(
                    nomProjet = nom,
                    recetteComplete = rec,
                    dateDebutMillis = dateDebutMillis,
                    quantiteBase = qte,
                    prixUnitaireMatiere = prixUnit,
                    margePct = marge,
                    codesSortiesCochees = sortiesCochees,
                    lotsChoisis = lots,
                    activerRappels = rappels,
                    activerRevente = activerRevente,
                    prixReventeUnitaireFixe = prixReventeFixe,
                    modeSalage = modeSalage
                )
                showCreateScreen = false
            }
        )
        return
    }

    // 2. Écran de détail d'un projet
    val projetActif = projetOuvertId?.let { id -> projets.find { it.projet.id == id } }
    if (projetActif != null) {
        ProjetDetailScreen(
            projetComplet = projetActif,
            recettes = recettes,
            optionPrixActive = optionPrixActive,
            viewModel = viewModel,
            onBack = { projetOuvertId = null }
        )
        return
    }

    // 3. Liste principale des projets (Accueil épuré & moderne)
    val dateFmt = remember { SimpleDateFormat("EEE dd MMM yyyy · HH'h'mm", Locale.FRANCE) }

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(top = 20.dp, bottom = 100.dp)
        ) {
            // En-tête moderne avec le nouveau logo et le nom "L'Affinoir"
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        modifier = Modifier.weight(1f),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.ic_app_logo),
                            contentDescription = "Logo L'Affinoir",
                            modifier = Modifier
                                .size(46.dp)
                                .clip(RoundedCornerShape(12.dp))
                        )
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "L'Affinoir · Charcuterie & Salaisons",
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.primary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Spacer(Modifier.height(2.dp))
                            Text(
                                text = "Mes Projets",
                                style = MaterialTheme.typography.headlineMedium,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                        }
                    }
                    Spacer(Modifier.width(8.dp))
                    Button(
                        onClick = {
                            recettePourCreationId = recettes.firstOrNull()?.recette?.id
                            showCreateScreen = true
                        },
                        shape = RoundedCornerShape(14.dp),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 10.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Planifier", fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Guide de prise en main rapide (fermable) pour les nouveaux utilisateurs
            if (afficherGuideDebutant) {
                item {
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
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
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(
                                        Icons.Default.AutoAwesome,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Text(
                                        text = "Comment fonctionne l'application ?",
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                                IconButton(
                                    onClick = {
                                        guideMasqueLocal = true
                                        viewModel.masquerGuideDebutant()
                                    },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Icon(
                                        Icons.Default.Close,
                                        contentDescription = "Fermer l'aide",
                                        tint = MaterialTheme.colorScheme.onPrimaryContainer,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                            Spacer(Modifier.height(10.dp))
                            EtapeGuideRow("1", "Cliquez sur « Planifier » : choisissez une charcuterie, un nom et une date de début.")
                            Spacer(Modifier.height(6.dp))
                            EtapeGuideRow("2", "Votre liste de courses et le planning heure par heure sont générés tout seuls.")
                            Spacer(Modifier.height(6.dp))
                            EtapeGuideRow("3", "Ouvrez votre projet pour cocher les étapes au fur et à mesure.")
                        }
                    }
                }
            }

            if (projets.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(28.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                Icons.Outlined.EventAvailable,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(Modifier.height(12.dp))
                            Text(
                                text = "Aucun projet en cours",
                                style = MaterialTheme.typography.titleLarge
                            )
                            Spacer(Modifier.height(6.dp))
                            Text(
                                text = "Lancez votre première réalisation en choisissant une charcuterie et une date de début.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(Modifier.height(18.dp))
                            Button(
                                onClick = {
                                    recettePourCreationId = recettes.firstOrNull()?.recette?.id
                                    showCreateScreen = true
                                },
                                shape = RoundedCornerShape(14.dp)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null)
                                Spacer(Modifier.width(8.dp))
                                Text("Planifier mon premier projet")
                            }
                        }
                    }
                }
            }

            items(projets, key = { it.projet.id }) { pc ->
                val etapesTriees = pc.etapes.sortedBy { it.ordre }
                val nbFaites = etapesTriees.count { it.terminee }
                val nbTot = etapesTriees.size.coerceAtLeast(1)
                val prochaineEtape = etapesTriees.firstOrNull { !it.terminee }
                val bilan = CalculateurCharcuterie.calculerBilanProjet(pc)

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { projetOuvertId = pc.projet.id },
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                ) {
                    Column(Modifier.padding(18.dp)) {
                        // Ligne supérieure : Date de début + badge progression (sans chevauchement)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                color = MaterialTheme.colorScheme.surfaceVariant,
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.weight(1f, fill = false)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        Icons.Outlined.Event,
                                        contentDescription = null,
                                        modifier = Modifier.size(14.dp),
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Spacer(Modifier.width(6.dp))
                                    Text(
                                        text = dateFmt.format(Date(pc.projet.dateDebutMillis)),
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                            Spacer(Modifier.width(8.dp))
                            Surface(
                                color = if (nbFaites == pc.etapes.size && pc.etapes.isNotEmpty())
                                    MaterialTheme.colorScheme.secondaryContainer
                                else MaterialTheme.colorScheme.primaryContainer,
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text(
                                    text = "$nbFaites / ${pc.etapes.size} étapes",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = if (nbFaites == pc.etapes.size && pc.etapes.isNotEmpty())
                                        MaterialTheme.colorScheme.secondary
                                    else MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                )
                            }
                        }

                        Spacer(Modifier.height(12.dp))

                        // Nom du projet + Charcuterie sélectionnée
                        Text(
                            text = pc.projet.nom,
                            style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.colorScheme.onSurface,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                        Spacer(Modifier.height(2.dp))
                        Text(
                            text = pc.projet.nomRecettePrincipale,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )

                        Spacer(Modifier.height(12.dp))

                        // Barre de progression moderne
                        LinearProgressIndicator(
                            progress = { nbFaites.toFloat() / nbTot.toFloat() },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(7.dp)
                                .clip(RoundedCornerShape(4.dp)),
                            color = MaterialTheme.colorScheme.primary,
                            trackColor = MaterialTheme.colorScheme.surfaceVariant
                        )

                        // Prochaine étape mise en évidence
                        if (prochaineEtape != null) {
                            Spacer(Modifier.height(12.dp))
                            Surface(
                                color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.65f),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        Icons.Default.PlayCircleOutline,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.secondary,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = "À suivre : ${prochaineEtape.titre}",
                                            style = MaterialTheme.typography.labelLarge,
                                            color = MaterialTheme.colorScheme.onSecondaryContainer,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }
                            }
                        }

                        Spacer(Modifier.height(12.dp))

                        // Résumé épuré en bas de carte
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            val resumeLots = if (pc.lots.isNotEmpty()) {
                                pc.lots.joinToString(" · ") { "${it.quantiteReelle.toInt()} ${it.variante}" }
                            } else {
                                "${pc.projet.quantiteBasePrevue.toInt()} unités"
                            }
                            Text(
                                text = resumeLots,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.weight(1f),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            if (optionPrixActive) {
                                Spacer(Modifier.width(12.dp))
                                Text(
                                    text = "Coût : ${formatEuro(bilan.coutRevientGlobal)}",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun EtapeGuideRow(numero: String, texte: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(22.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primary),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = numero,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onPrimary,
                fontWeight = FontWeight.Bold
            )
        }
        Spacer(Modifier.width(10.dp))
        Text(
            text = texte,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onPrimaryContainer
        )
    }
}

// ============================================================================================
// DÉTAIL D'UN PROJET : 3 ONGLETS MODERNES PAR PILULES, ZÉRO CHEVAUCHEMENT + RETOUR ARRIÈRE
// ============================================================================================
@Composable
private fun ProjetDetailScreen(
    projetComplet: ProjetComplet,
    recettes: List<RecetteComplete>,
    optionPrixActive: Boolean,
    viewModel: CharcuterieViewModel,
    onBack: () -> Unit
) {
    BackHandler { onBack() }

    var ongletSelectionne by rememberSaveable { mutableIntStateOf(0) }
    LaunchedEffect(optionPrixActive) {
        if (!optionPrixActive && ongletSelectionne == 2) {
            ongletSelectionne = 0
        }
    }
    var showConfirmDelete by remember { mutableStateOf(false) }
    val labelTroisiemeOnglet = if (projetComplet.projet.activerRevente) "3. Budget & Revente" else "3. Budget"
    val onglets = if (optionPrixActive) {
        listOf("1. Étapes", "2. Lots & Avis", labelTroisiemeOnglet)
    } else {
        listOf("1. Étapes", "2. Lots & Avis")
    }
    val dateFmt = remember { SimpleDateFormat("dd MMM yyyy à HH'h'mm", Locale.FRANCE) }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
        ) {
            // En-tête du projet sans aucun chevauchement
        Surface(color = MaterialTheme.colorScheme.surface) {
            Column(Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Retour aux projets")
                    }
                    Spacer(Modifier.width(4.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = projetComplet.projet.nom,
                            style = MaterialTheme.typography.titleLarge,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = "${projetComplet.projet.nomRecettePrincipale} · Début ${dateFmt.format(Date(projetComplet.projet.dateDebutMillis))}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    IconButton(onClick = { showConfirmDelete = true }) {
                        Icon(
                            Icons.Outlined.Delete,
                            contentDescription = "Supprimer le projet",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Spacer(Modifier.height(10.dp))

                // Sélecteur par pilules moderne (Segmented Pills)
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
                        onglets.forEachIndexed { idx, titre ->
                            val selected = ongletSelectionne == idx
                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(10.dp))
                                    .clickable { ongletSelectionne = idx },
                                shape = RoundedCornerShape(10.dp),
                                color = if (selected) MaterialTheme.colorScheme.surface else Color.Transparent,
                                shadowElevation = if (selected) 1.dp else 0.dp
                            ) {
                                Box(
                                    modifier = Modifier.padding(vertical = 9.dp, horizontal = 4.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = titre,
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

        Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
            when (ongletSelectionne) {
                0 -> OngletPlanningProjet(
                    projetComplet = projetComplet,
                    viewModel = viewModel,
                    onAllerAuxLots = { ongletSelectionne = 1 }
                )
                1 -> OngletProductionEtLots(projetComplet, recettes, viewModel)
                2 -> OngletBudgetEtRevente(projetComplet, viewModel)
            }
        }
    }
}

    if (showConfirmDelete) {
        AlertDialog(
            onDismissRequest = { showConfirmDelete = false },
            title = { Text("Supprimer ce projet ?") },
            text = { Text("Voulez-vous vraiment supprimer « ${projetComplet.projet.nom} » ?") },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.supprimerProjet(projetComplet.projet)
                        showConfirmDelete = false
                        onBack()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Supprimer")
                }
            },
            dismissButton = {
                TextButton(onClick = { showConfirmDelete = false }) { Text("Annuler") }
            }
        )
    }
}
