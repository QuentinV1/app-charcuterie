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
// ONGLET 2 : LOTS D'ÉPICES, AVIS & QUANTITÉS OBTENUES (SANS CHEVAUCHEMENT)
// ============================================================================================
@Composable
internal fun OngletProductionEtLots(
    projetComplet: ProjetComplet,
    recettes: List<RecetteComplete>,
    viewModel: CharcuterieViewModel
) {
    var lotAEditer by remember { mutableStateOf<ProjetLotEntity?>(null) }
    var lotPourPeseeRapide by remember { mutableStateOf<ProjetLotEntity?>(null) }
    var showAjouterLot by remember { mutableStateOf(false) }
    var lotPourAjusterRecette by remember { mutableStateOf<ProjetLotEntity?>(null) }
    var sortieAEditer by remember { mutableStateOf<ProjetSortieDecoupeEntity?>(null) }
    val recetteLiee = remember(recettes, projetComplet.projet.recettePrincipaleId) {
        recettes.find { it.recette.id == projetComplet.projet.recettePrincipaleId }?.recette
    }
    val perteCibleRecette = if (recetteLiee != null && recetteLiee.perteCiblePct > 0.0) recetteLiee.perteCiblePct else 35.0

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 18.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 90.dp)
    ) {
        // Section Lots & Variantes
        item(key = "header_lots") {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Lots & Assaisonnements",
                        style = MaterialTheme.typography.titleLarge
                    )
                    Text(
                        text = "Notez vos quantités, le suivi du poids et votre avis sur chaque lot.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(Modifier.width(8.dp))
                FilledTonalButton(
                    onClick = { showAjouterLot = true },
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Lot")
                }
            }
        }

        items(projetComplet.lots, key = { "lot_${it.id}" }) { lot ->
            val perte = if (lot.poidsInitialGrammes > 0 && lot.poidsActuelGrammes > 0) {
                ((lot.poidsInitialGrammes - lot.poidsActuelGrammes) / lot.poidsInitialGrammes) * 100.0
            } else 0.0
            val poidsCibleG = if (lot.poidsInitialGrammes > 0) {
                lot.poidsInitialGrammes * (1.0 - (perteCibleRecette / 100.0))
            } else 0.0
            val resteAPerdreG = if (lot.poidsActuelGrammes > poidsCibleG && poidsCibleG > 0) {
                lot.poidsActuelGrammes - poidsCibleG
            } else 0.0
            val progressionJauge = if (perteCibleRecette > 0 && perte > 0) {
                (perte / perteCibleRecette).coerceIn(0.0, 1.0).toFloat()
            } else 0f
            val affinageAtteint = lot.poidsActuelGrammes > 0 && perte >= perteCibleRecette

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Column(Modifier.padding(16.dp)) {
                    // Ligne de titre avec lot et étoiles
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "${lot.nomProduit} · ${lot.variante}",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = "Quantité : ${lot.quantiteReelle.toInt()} ${lot.unite} · Salage : ${lot.dureeSalageHeures.toInt()}h · Épices : ${lot.epicesUtiliseesGrammes.toInt()}g",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Spacer(Modifier.width(8.dp))
                        Surface(
                            color = MaterialTheme.colorScheme.primaryContainer,
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = if (lot.noteSur5 > 0) "★ ${lot.noteSur5}/5" else "Non noté",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }

                    // MODULE JAUGE DE PERTE DE POIDS & AFFINAGE EN CAVE
                    Spacer(Modifier.height(10.dp))
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                        shape = RoundedCornerShape(14.dp),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                    ) {
                        Column(Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "⚖️ Perte de poids (Cible -${perteCibleRecette.toInt()}%)",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold
                                )
                                if (lot.poidsInitialGrammes > 0 && lot.poidsActuelGrammes > 0) {
                                    Surface(
                                        color = if (affinageAtteint) MaterialTheme.colorScheme.secondaryContainer else MaterialTheme.colorScheme.primaryContainer,
                                        shape = RoundedCornerShape(6.dp)
                                    ) {
                                        Text(
                                            text = if (affinageAtteint) "✨ Affiné (-%.1f%%)".format(perte) else "En cave (-%.1f%%)".format(perte),
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = if (affinageAtteint) MaterialTheme.colorScheme.onSecondaryContainer else MaterialTheme.colorScheme.onPrimaryContainer,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                            }

                            Spacer(Modifier.height(8.dp))

                            if (lot.poidsInitialGrammes > 0) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = "Départ : ${lot.poidsInitialGrammes.toInt()}g",
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                    Text(
                                        text = if (lot.poidsActuelGrammes > 0) "Actuel : ${lot.poidsActuelGrammes.toInt()}g" else "Non pesé",
                                        style = MaterialTheme.typography.bodySmall,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Text(
                                        text = "Cible : ${poidsCibleG.toInt()}g",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }

                                Spacer(Modifier.height(6.dp))
                                LinearProgressIndicator(
                                    progress = { progressionJauge },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(8.dp)
                                        .clip(RoundedCornerShape(4.dp)),
                                    color = if (affinageAtteint) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.primary,
                                    trackColor = MaterialTheme.colorScheme.surfaceVariant
                                )

                                Spacer(Modifier.height(4.dp))
                                Text(
                                    text = if (affinageAtteint) "Perte cible atteinte ! Votre pièce est affinée à cœur."
                                    else if (lot.poidsActuelGrammes > 0) "Reste ~${resteAPerdreG.toInt()}g d'eau à perdre pour atteindre l'optimum."
                                    else "Pesez la pièce pour mesurer la perte hydrique.",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (affinageAtteint) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            } else {
                                Text(
                                    text = "Renseignez le poids initial pour activer le suivi automatique de l'affinage.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }

                    Spacer(Modifier.height(10.dp))
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = if (lot.commentaire.isNotBlank()) "« ${lot.commentaire} »"
                            else "Aucun commentaire pour le moment.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(12.dp)
                        )
                    }

                    Spacer(Modifier.height(12.dp))
                    // Boutons d'action pour ce lot : Peser et Modifier / Avis
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = { lotPourPeseeRapide = lot },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 8.dp)
                        ) {
                            Icon(Icons.Default.Scale, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(if (lot.poidsInitialGrammes > 0) "Peser" else "Poids départ", maxLines = 1)
                        }
                        OutlinedButton(
                            onClick = { lotAEditer = lot },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 8.dp)
                        ) {
                            Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Modifier & Avis", maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                    }
                    Spacer(Modifier.height(6.dp))
                    // Bouton explicite pour faire évoluer la recette de base (pour les prochains projets)
                    OutlinedButton(
                        onClick = { lotPourAjusterRecette = lot },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Icon(Icons.Default.MenuBook, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = "Améliorer la recette de base (futurs projets)",
                            style = MaterialTheme.typography.labelMedium,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
        }

        // Si le projet comporte de la découpe (ex: Canards entiers -> Cuisses, Rillettes, Graisse...)
        if (projetComplet.sortiesDecoupe.isNotEmpty()) {
            item(key = "header_sorties_decoupe") {
                Spacer(Modifier.height(8.dp))
                Text(
                    text = "Produits de la découpe",
                    style = MaterialTheme.typography.titleLarge
                )
                Text(
                    text = "Cochez les parties utilisées et touchez une ligne pour ajuster la quantité réellement obtenue.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            items(projetComplet.sortiesDecoupe, key = { "sortie_${it.id}" }) { s ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { sortieAEditer = s },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (s.actif) MaterialTheme.colorScheme.surface else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                    ),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = s.actif,
                            onCheckedChange = { coche ->
                                val qReel = if (coche && s.quantiteReelle == 0.0) s.quantitePrevue.coerceAtLeast(1.0) else s.quantiteReelle
                                viewModel.mettreAJourSortieDecoupe(s, coche, qReel, s.valeurRefUnitaire, s.fraisTransfoUnitaire, s.commentaireSortie)
                            }
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = s.nom,
                                style = MaterialTheme.typography.titleSmall,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = if (s.actif) "Prévu : ${s.quantitePrevue} ${s.unite}" else "Non inclus",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        if (s.actif) {
                            Spacer(Modifier.width(8.dp))
                            Surface(
                                color = MaterialTheme.colorScheme.primaryContainer,
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text(
                                    text = "${s.quantiteReelle} ${s.unite}",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // Fiche d'évaluation & Dégustation finale
        item(key = "eval_projet_card") {
            val evaluations by viewModel.evaluations.collectAsState()
            val evalProjet = evaluations.find { it.projetId == projetComplet.projet.id }
            var showEvalDialog by remember { mutableStateOf(false) }

            Spacer(Modifier.height(6.dp))
            if (evalProjet == null) {
                OutlinedCard(
                    modifier = Modifier.fillMaxWidth().clickable { showEvalDialog = true },
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.5f))
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp).fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text("🍷 Fiche d'évaluation & Dégustation", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                            Text("Notez texture, salinité et arômes pour ajuster votre prochaine session.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Spacer(Modifier.width(8.dp))
                        Button(onClick = { showEvalDialog = true }) { Text("Évaluer") }
                    }
                }
            } else {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.4f))
                ) {
                    Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("🍷 Évaluation & Dégustation", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                            TextButton(onClick = { showEvalDialog = true }) { Text("Modifier") }
                        }
                        Text("${"⭐".repeat(evalProjet.noteGlobale)} (${evalProjet.noteGlobale}/5)", style = MaterialTheme.typography.bodyMedium)
                        Text(
                            "Texture : ${evalProjet.texture} · Salinité : ${evalProjet.salinite} · Arômes : ${evalProjet.aromes}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        if (evalProjet.commentaire.isNotBlank()) {
                            Text("\"${evalProjet.commentaire}\"", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Medium)
                        }
                    }
                }
            }

            if (showEvalDialog) {
                var noteGlobale by remember { mutableIntStateOf(evalProjet?.noteGlobale ?: 5) }
                var texture by remember { mutableStateOf(evalProjet?.texture ?: "Équilibrée / Fondante") }
                var salinite by remember { mutableStateOf(evalProjet?.salinite ?: "Parfaite") }
                var aromes by remember { mutableStateOf(evalProjet?.aromes ?: "Équilibrés") }
                var comm by remember { mutableStateOf(evalProjet?.commentaire ?: "") }

                AlertDialog(
                    onDismissRequest = { showEvalDialog = false },
                    title = { Text("🍷 Évaluation · ${projetComplet.projet.nom}") },
                    text = {
                        Column(
                            modifier = Modifier.verticalScroll(rememberScrollState()),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text("Note globale : $noteGlobale / 5", fontWeight = FontWeight.Bold)
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                (1..5).forEach { n ->
                                    FilterChip(selected = noteGlobale == n, onClick = { noteGlobale = n }, label = { Text("$n★") })
                                }
                            }
                            Text("Texture", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.labelMedium)
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                listOf("Équilibrée / Fondante", "Un peu sèche", "Trop sèche").forEach { t ->
                                    FilterChip(selected = texture == t, onClick = { texture = t }, label = { Text(t, maxLines = 1) })
                                }
                            }
                            Text("Salinité", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.labelMedium)
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                listOf("Parfaite", "Un peu juste", "Trop salée").forEach { s ->
                                    FilterChip(selected = salinite == s, onClick = { salinite = s }, label = { Text(s, maxLines = 1) })
                                }
                            }
                            Text("Arômes & Fumage", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.labelMedium)
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                listOf("Équilibrés", "Subtils", "Puissants").forEach { a ->
                                    FilterChip(selected = aromes == a, onClick = { aromes = a }, label = { Text(a, maxLines = 1) })
                                }
                            }
                            OutlinedTextField(
                                value = comm,
                                onValueChange = { comm = it },
                                label = { Text("Note pour la prochaine fois") },
                                placeholder = { Text("Ex: Passer à 28g/kg de sel") },
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    },
                    confirmButton = {
                        Button(onClick = {
                            viewModel.enregistrerEvaluationProjet(projetComplet.projet, noteGlobale, texture, salinite, aromes, comm)
                            showEvalDialog = false
                        }) { Text("Enregistrer") }
                    },
                    dismissButton = {
                        TextButton(onClick = { showEvalDialog = false }) { Text("Annuler") }
                    }
                )
            }
        }
    }

    // Dialogue dédié de Pesée, Courbe de Perte & Historique
    lotPourPeseeRapide?.let { lot ->
        var poidsInitStr by remember(lot.id) { mutableStateOf(if (lot.poidsInitialGrammes > 0) lot.poidsInitialGrammes.toInt().toString() else "") }
        var poidsActStr by remember(lot.id) { mutableStateOf("") }
        var notePeseeStr by remember(lot.id) { mutableStateOf("") }

        val pInit = poidsInitStr.replace(",", ".").toDoubleOrNull() ?: 0.0
        val pAct = poidsActStr.replace(",", ".").toDoubleOrNull() ?: 0.0
        val perteCalc = if (pInit > 0 && pAct > 0) ((pInit - pAct) / pInit) * 100.0 else 0.0
        val cibleG = if (pInit > 0) pInit * (1.0 - (perteCibleRecette / 100.0)) else 0.0
        val affinageAtteint = pAct > 0 && perteCalc >= perteCibleRecette
        val analyse = remember(lot, projetComplet.pesees, perteCibleRecette) {
            CalculateurCharcuterie.analyserCourbePesees(
                lot = lot,
                pesees = projetComplet.pesees,
                perteCiblePct = perteCibleRecette,
                dateDebutProjetMillis = projetComplet.projet.dateDebutMillis
            )
        }
        val dateFmt = remember { SimpleDateFormat("dd MMM", Locale.FRANCE) }

        AlertDialog(
            onDismissRequest = { lotPourPeseeRapide = null },
            title = { Text("📈 Pesées & Courbe · ${lot.variante}") },
            text = {
                Column(
                    modifier = Modifier.verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        "Perte cible : -${perteCibleRecette.toInt()}% (${analyse.poidsCibleG.toInt()} g).",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    if (analyse.risqueCroutage) {
                        Surface(
                            color = Color(0xFFFFEBEE),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                analyse.alerteCroutageMsg,
                                color = Color(0xFFC62828),
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(8.dp)
                            )
                        }
                    }

                    if (analyse.dateEstimeeFinMillis != null) {
                        Surface(
                            color = Color(0xFFE8F5E9),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                "📅 Fin estimée (-${perteCibleRecette.toInt()}%) : ${dateFmt.format(Date(analyse.dateEstimeeFinMillis))} (~${String.format("%.2f", analyse.vitessePctParJour)}%/j)",
                                color = Color(0xFF2E7D32),
                                style = MaterialTheme.typography.bodySmall,
                                modifier = Modifier.padding(8.dp)
                            )
                        }
                    }

                    // Graphique Canvas de la courbe de perte de poids
                    if (analyse.poidsInitialG > 0 && analyse.historiqueTrie.isNotEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(130.dp)
                                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f), RoundedCornerShape(10.dp))
                                .padding(10.dp)
                        ) {
                            Canvas(modifier = Modifier.fillMaxSize()) {
                                val ptsPerte = listOf(0.0) + analyse.historiqueTrie.map {
                                    ((analyse.poidsInitialG - it.poidsGrammes) / analyse.poidsInitialG) * 100.0
                                }
                                val maxP = maxOf(perteCibleRecette + 5.0, (ptsPerte.maxOrNull() ?: 0.0) + 5.0, 40.0).toFloat()
                                val w = size.width
                                val h = size.height
                                fun toY(pct: Double) = ((pct / maxP) * h).toFloat().coerceIn(0f, h)

                                val cibleY = toY(perteCibleRecette)
                                // Courbe idéale en pointillés verts
                                drawLine(
                                    color = Color(0xFF2E7D32),
                                    start = Offset(0f, 0f),
                                    end = Offset(w, cibleY),
                                    strokeWidth = 3f,
                                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 8f))
                                )
                                // Ligne cible horizontale
                                drawLine(
                                    color = Color(0xFF2E7D32).copy(alpha = 0.45f),
                                    start = Offset(0f, cibleY),
                                    end = Offset(w, cibleY),
                                    strokeWidth = 2f
                                )
                                // Courbe réelle
                                val stepX = if (ptsPerte.size > 1) w / (ptsPerte.size - 1) else w
                                val path = Path()
                                ptsPerte.forEachIndexed { idx, pVal ->
                                    val x = idx * stepX
                                    val y = toY(pVal)
                                    if (idx == 0) path.moveTo(x, y) else path.lineTo(x, y)
                                }
                                drawPath(path, color = Color(0xFFC84B31), style = Stroke(width = 5f, cap = StrokeCap.Round))
                                ptsPerte.forEachIndexed { idx, pVal ->
                                    val pt = Offset(idx * stepX, toY(pVal))
                                    drawCircle(Color.White, radius = 7f, center = pt)
                                    drawCircle(Color(0xFFC84B31), radius = 5f, center = pt)
                                }
                            }
                        }
                    }

                    OutlinedTextField(
                        value = poidsInitStr,
                        onValueChange = { poidsInitStr = it },
                        label = { Text("Poids initial de départ (g)") },
                        placeholder = { Text("Ex: 420") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = poidsActStr,
                        onValueChange = { poidsActStr = it },
                        label = { Text("Nouvelle pesée du jour (g)") },
                        placeholder = { Text("Ex: 280") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = notePeseeStr,
                        onValueChange = { notePeseeStr = it },
                        label = { Text("Observation (fleur, fermeté...)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    if (pInit > 0 && pAct > 0) {
                        Surface(
                            color = if (affinageAtteint) MaterialTheme.colorScheme.secondaryContainer else MaterialTheme.colorScheme.primaryContainer,
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(Modifier.padding(10.dp)) {
                                Text(
                                    text = "Perte constatée : -%.1f%%".format(perteCalc),
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = if (affinageAtteint) "✨ Affinage optimal atteint !"
                                    else "Poids cible : ${cibleG.toInt()} g (encore ~${(pAct - cibleG).toInt()} g à perdre)",
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                    }

                    if (analyse.historiqueTrie.isNotEmpty()) {
                        HorizontalDivider()
                        Text("Historique (${analyse.historiqueTrie.size})", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelMedium)
                        analyse.historiqueTrie.sortedByDescending { it.dateMillis }.forEach { pes ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(Modifier.weight(1f)) {
                                    Text(
                                        "${dateFmt.format(Date(pes.dateMillis))} — ${pes.poidsGrammes.toInt()}g (-${String.format("%.1f", pes.pertePct)}%)",
                                        style = MaterialTheme.typography.bodySmall,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    if (pes.note.isNotBlank()) {
                                        Text(pes.note, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                                IconButton(
                                    onClick = { viewModel.supprimerPeseeLot(pes, lot, analyse.historiqueTrie) },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Icon(Icons.Filled.Delete, contentDescription = "Supprimer", tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(16.dp))
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.ajouterPeseeHistoriqueLot(lot, pInit, pAct, System.currentTimeMillis(), notePeseeStr)
                        lotPourPeseeRapide = null
                    },
                    enabled = pAct > 0 || pInit > 0
                ) {
                    Text("+ Ajouter la pesée")
                }
            },
            dismissButton = {
                TextButton(onClick = { lotPourPeseeRapide = null }) { Text("Fermer") }
            }
        )
    }

    // Dialogues d'édition (Lot, Ajustement Recette, Sortie Découpe)
    lotAEditer?.let { lot ->
        var qReelle by remember(lot.id) { mutableStateOf(lot.quantiteReelle.toString()) }
        var epicesG by remember(lot.id) { mutableStateOf(lot.epicesUtiliseesGrammes.toString()) }
        var salageH by remember(lot.id) { mutableStateOf(lot.dureeSalageHeures.toString()) }
        var pInit by remember(lot.id) { mutableStateOf(lot.poidsInitialGrammes.toString()) }
        var pAct by remember(lot.id) { mutableStateOf(lot.poidsActuelGrammes.toString()) }
        var comm by remember(lot.id) { mutableStateOf(lot.commentaire) }
        var note by remember(lot.id) { mutableIntStateOf(if (lot.noteSur5 == 0) 5 else lot.noteSur5) }

        AlertDialog(
            onDismissRequest = { lotAEditer = null },
            title = { Text("Lot ${lot.variante}") },
            text = {
                Column(
                    modifier = Modifier.verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = qReelle,
                            onValueChange = { qReelle = it },
                            label = { Text("Qté (${lot.unite})") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = epicesG,
                            onValueChange = { epicesG = it },
                            label = { Text("Épices (g)") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f)
                        )
                    }
                    OutlinedTextField(
                        value = salageH,
                        onValueChange = { salageH = it },
                        label = { Text("Salage (heures)") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.fillMaxWidth()
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = pInit,
                            onValueChange = { pInit = it },
                            label = { Text("Poids départ (g)") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = pAct,
                            onValueChange = { pAct = it },
                            label = { Text("Poids actuel (g)") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Text("Note : $note / 5", style = MaterialTheme.typography.labelLarge)
                    Slider(
                        value = note.toFloat(),
                        onValueChange = { note = it.toInt() },
                        valueRange = 1f..5f,
                        steps = 3
                    )
                    OutlinedTextField(
                        value = comm,
                        onValueChange = { comm = it },
                        label = { Text("Votre avis (sel, goût, séchage…)") },
                        minLines = 2,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(onClick = {
                    viewModel.mettreAJourLot(
                        lot = lot,
                        quantiteReelle = qReelle.replace(",", ".").toDoubleOrNull() ?: lot.quantiteReelle,
                        epicesGrammes = epicesG.replace(",", ".").toDoubleOrNull() ?: lot.epicesUtiliseesGrammes,
                        dureeSalageHeures = salageH.replace(",", ".").toDoubleOrNull() ?: lot.dureeSalageHeures,
                        poidsInitialG = pInit.replace(",", ".").toDoubleOrNull() ?: 0.0,
                        poidsActuelG = pAct.replace(",", ".").toDoubleOrNull() ?: 0.0,
                        commentaire = comm,
                        noteSur5 = note
                    )
                    lotAEditer = null
                }) { Text("Enregistrer") }
            },
            dismissButton = {
                TextButton(onClick = { lotAEditer = null }) { Text("Annuler") }
            }
        )
    }

    lotPourAjusterRecette?.let { lot ->
        val recComplete = recettes.find { it.recette.id == projetComplet.projet.recettePrincipaleId }
        val etapesRecette = recComplete?.etapes ?: emptyList()
        val etapeSalageDefaut = etapesRecette.find { it.titre.contains("sal", ignoreCase = true) } ?: etapesRecette.firstOrNull()
        var etapeSelectionneeId by remember(lot.id) { mutableStateOf(etapeSalageDefaut?.id ?: 0L) }
        val etapeCourante = etapesRecette.find { it.id == etapeSelectionneeId } ?: etapeSalageDefaut

        var nouvDureeHeures by remember(lot.id, etapeSelectionneeId) {
            val hDefaut = if (etapeCourante != null && etapeCourante.titre.contains("sal", ignoreCase = true) && lot.dureeSalageHeures > 0) {
                lot.dureeSalageHeures
            } else {
                (etapeCourante?.dureeMinutes ?: 1080) / 60.0
            }
            mutableStateOf(if (hDefaut % 1.0 == 0.0) hDefaut.toInt().toString() else "%.1f".format(Locale.US, hDefaut))
        }
        var nouvInstructions by remember(lot.id, etapeSelectionneeId) {
            mutableStateOf(etapeCourante?.instructions ?: "")
        }

        val qteLot = lot.quantiteReelle.coerceAtLeast(1.0)
        val epicesParUniteLot = if (lot.epicesUtiliseesGrammes > 0) lot.epicesUtiliseesGrammes / qteLot else 15.0
        var epicesParUniteStr by remember(lot.id) {
            mutableStateOf(if (epicesParUniteLot % 1.0 == 0.0) epicesParUniteLot.toInt().toString() else "%.1f".format(Locale.US, epicesParUniteLot))
        }
        var perteCibleStr by remember(lot.id) {
            mutableStateOf((recComplete?.recette?.perteCiblePct ?: 32.0).toInt().toString())
        }
        var motif by remember(lot.id) {
            mutableStateOf(
                if (lot.commentaire.isNotBlank()) "Suite au lot ${lot.variante} : ${lot.commentaire}"
                else "Ajustement suite au retour sur le lot ${lot.variante}"
            )
        }

        AlertDialog(
            onDismissRequest = { lotPourAjusterRecette = null },
            title = { Text("📖 Améliorer la recette de base") },
            text = {
                Column(
                    modifier = Modifier.verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Surface(
                        color = MaterialTheme.colorScheme.secondaryContainer,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(Modifier.padding(12.dp)) {
                            Text(
                                text = "Pourquoi cette fonction ?",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSecondaryContainer
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = "Après dégustation du lot « ${lot.variante} », enregistrez ici vos réglages idéaux (temps de salage, dosage d'épices, séchage). La fiche recette « ${projetComplet.projet.nomRecettePrincipale} » passera en v${(recComplete?.recette?.versionActuelle ?: 1) + 1} pour vos prochains projets, sans modifier vos projets passés.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSecondaryContainer
                            )
                        }
                    }

                    if (etapesRecette.size > 1) {
                        Text(
                            text = "Étape de la recette à ajuster :",
                            style = MaterialTheme.typography.labelMedium
                        )
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(etapesRecette, key = { it.id }) { et ->
                                FilterChip(
                                    selected = et.id == etapeCourante?.id,
                                    onClick = { etapeSelectionneeId = et.id },
                                    label = { Text("${et.ordre}. ${et.titre}", maxLines = 1) }
                                )
                            }
                        }
                    }

                    if (etapeCourante != null) {
                        OutlinedTextField(
                            value = nouvDureeHeures,
                            onValueChange = { nouvDureeHeures = it },
                            label = { Text("Durée « ${etapeCourante.titre} » (heures)") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = nouvInstructions,
                            onValueChange = { nouvInstructions = it },
                            label = { Text("Consignes de l'étape") },
                            minLines = 2,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = epicesParUniteStr,
                            onValueChange = { epicesParUniteStr = it },
                            label = { Text("Épices ${lot.variante} (g/u)") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = perteCibleStr,
                            onValueChange = { perteCibleStr = it },
                            label = { Text("Perte cible (%)") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f)
                        )
                    }

                    OutlinedTextField(
                        value = motif,
                        onValueChange = { motif = it },
                        label = { Text("Note de version (historique recette)") },
                        minLines = 2,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(onClick = {
                    if (recComplete != null) {
                        val h = nouvDureeHeures.replace(",", ".").toDoubleOrNull() ?: 18.0
                        val epUnit = epicesParUniteStr.replace(",", ".").toDoubleOrNull() ?: epicesParUniteLot
                        val pertePct = perteCibleStr.replace(",", ".").toDoubleOrNull() ?: recComplete.recette.perteCiblePct
                        val varianteExistante = recComplete.variantes.find { it.nom.equals(lot.variante, ignoreCase = true) }
                        val dureeSalageVar = if (etapeCourante?.titre?.contains("sal", ignoreCase = true) == true) h else (varianteExistante?.dureeSalageHeuresSpecifique ?: lot.dureeSalageHeures)
                        viewModel.ameliorerRecetteDepuisLot(
                            recette = recComplete.recette,
                            etapeModifiee = etapeCourante,
                            nouvelleDureeEtapeMinutes = (h * 60).toInt(),
                            nouvellesInstructionsEtape = nouvInstructions,
                            varianteExistante = varianteExistante,
                            nomVariante = lot.variante,
                            nouveauxEpicesGrammes = epUnit,
                            nouvelleDureeSalageHeures = dureeSalageVar,
                            nouvellePerteCiblePct = pertePct,
                            motifVersion = motif
                        )
                    }
                    lotPourAjusterRecette = null
                }) { Text("Enregistrer v${(recComplete?.recette?.versionActuelle ?: 1) + 1}") }
            },
            dismissButton = {
                TextButton(onClick = { lotPourAjusterRecette = null }) { Text("Annuler") }
            }
        )
    }

    if (showAjouterLot) {
        var nomVar by remember { mutableStateOf("") }
        var qte by remember { mutableStateOf("5") }
        var comm by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showAjouterLot = false },
            title = { Text("Ajouter un lot d'épices") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = nomVar, onValueChange = { nomVar = it }, label = { Text("Variante (ex: Romarin, Fumé…)") })
                    OutlinedTextField(
                        value = qte,
                        onValueChange = { qte = it },
                        label = { Text("Quantité") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                    )
                    OutlinedTextField(value = comm, onValueChange = { comm = it }, label = { Text("Commentaire") })
                }
            },
            confirmButton = {
                Button(onClick = {
                    if (nomVar.isNotBlank()) {
                        viewModel.ajouterLotAuProjet(
                            projetId = projetComplet.projet.id,
                            nomProduit = projetComplet.lots.firstOrNull()?.nomProduit ?: projetComplet.projet.nomRecettePrincipale,
                            variante = nomVar,
                            quantite = qte.replace(",", ".").toDoubleOrNull() ?: 1.0,
                            unite = projetComplet.lots.firstOrNull()?.unite ?: "pièce",
                            commentaire = comm
                        )
                    }
                    showAjouterLot = false
                }) { Text("Ajouter") }
            },
            dismissButton = {
                TextButton(onClick = { showAjouterLot = false }) { Text("Annuler") }
            }
        )
    }

    sortieAEditer?.let { s ->
        var qReelle by remember(s.id) { mutableStateOf(s.quantiteReelle.toString()) }
        var valRef by remember(s.id) { mutableStateOf(s.valeurRefUnitaire.toString()) }
        var prixRev by remember(s.id) {
            mutableStateOf(if (s.prixReventeUnitaire > 0.0) "%.2f".format(Locale.US, s.prixReventeUnitaire) else "")
        }
        var comm by remember(s.id) { mutableStateOf(s.commentaireSortie) }

        AlertDialog(
            onDismissRequest = { sortieAEditer = null },
            title = { Text(s.nom) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = qReelle,
                        onValueChange = { qReelle = it },
                        label = { Text("Quantité réellement obtenue (${s.unite})") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = valRef,
                        onValueChange = { valRef = it },
                        label = { Text("Valeur boutique (€ / ${s.unite})") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.fillMaxWidth()
                    )
                    if (projetComplet.projet.activerRevente) {
                        OutlinedTextField(
                            value = prixRev,
                            onValueChange = { prixRev = it },
                            label = { Text("Prix de revente (€ / ${s.unite})") },
                            placeholder = { Text("Vide = calcul auto") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    OutlinedTextField(
                        value = comm,
                        onValueChange = { comm = it },
                        label = { Text("Note") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(onClick = {
                    val nvPrixRev = if (projetComplet.projet.activerRevente) {
                        prixRev.replace(",", ".").toDoubleOrNull() ?: 0.0
                    } else s.prixReventeUnitaire
                    viewModel.mettreAJourSortieDecoupe(
                        sortie = s,
                        actif = true,
                        quantiteReelle = qReelle.replace(",", ".").toDoubleOrNull() ?: s.quantiteReelle,
                        valeurRefUnitaire = valRef.replace(",", ".").toDoubleOrNull() ?: s.valeurRefUnitaire,
                        fraisTransfoUnitaire = s.fraisTransfoUnitaire,
                        commentaire = comm,
                        prixReventeUnitaire = nvPrixRev
                    )
                    sortieAEditer = null
                }) { Text("Enregistrer") }
            },
            dismissButton = {
                TextButton(onClick = { sortieAEditer = null }) { Text("Annuler") }
            }
        )
    }
}
