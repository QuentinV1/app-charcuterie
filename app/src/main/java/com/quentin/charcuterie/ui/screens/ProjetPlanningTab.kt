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
import androidx.compose.foundation.horizontalScroll
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.roundToInt

// ============================================================================================
// ONGLET 1 : ÉTAPES PAS À PAS (AVEC CARTE "PROCHAINE ÉTAPE" EN HAUT)
// ============================================================================================
@Composable
internal fun OngletPlanningProjet(
    projetComplet: ProjetComplet,
    viewModel: CharcuterieViewModel,
    onAllerAuxLots: () -> Unit = {}
) {
    val etapes = projetComplet.etapes.sortedBy { it.ordre }
    val nbDone = etapes.count { it.terminee }
    val prochaineEtape = etapes.firstOrNull { !it.terminee }
    val timeFmt = remember { SimpleDateFormat("EEE dd/MM à HH'h'mm", Locale.FRANCE) }

    var etapeCiblePhotoId by remember { mutableStateOf<Long?>(null) }
    var cameraUriCible by remember { mutableStateOf<Uri?>(null) }
    var photoApercu by remember { mutableStateOf<ProjetEtapePhotoEntity?>(null) }
    var etapePourChoixDateHeure by remember { mutableStateOf<ProjetEtapeEntity?>(null) }
    var dateEtapeEnCoursMillis by remember { mutableStateOf<Long?>(null) }

    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickMultipleVisualMedia(5)
    ) { uris ->
        val etapeId = etapeCiblePhotoId
        if (etapeId != null && uris.isNotEmpty()) {
            viewModel.ajouterPhotosEtape(projetComplet.projet.id, etapeId, uris)
        }
    }

    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { ok ->
        val etapeId = etapeCiblePhotoId
        val uri = cameraUriCible
        if (ok && etapeId != null && uri != null) {
            viewModel.ajouterPhotosEtape(projetComplet.projet.id, etapeId, listOf(uri))
        }
    }

    fun estEtapeSechageOuAffinage(e: ProjetEtapeEntity): Boolean {
        return e.titre.contains("séch", ignoreCase = true) ||
            e.titre.contains("sech", ignoreCase = true) ||
            e.titre.contains("affin", ignoreCase = true) ||
            e.instructions.contains("perte", ignoreCase = true)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 18.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 90.dp)
    ) {
        // Carte mise en avant : "À faire maintenant" pour guider facilement le débutant
        if (prochaineEtape != null) {
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
                            Text(
                                text = "ÉTAPE EN COURS (${nbDone + 1}/${etapes.size})",
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.ExtraBold
                            )
                            Text(
                                text = timeFmt.format(Date(prochaineEtape.debutPrevuMillis)),
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = prochaineEtape.titre,
                            style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = prochaineEtape.instructions,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Spacer(Modifier.height(14.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Button(
                                onClick = { viewModel.basculerEtapeTerminee(prochaineEtape) },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("Marquer comme fait")
                            }
                            FilledTonalButton(
                                onClick = { viewModel.demarrerEtapeMaintenant(projetComplet.projet.id, prochaineEtape) },
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Démarrer maintenant")
                            }
                        }
                        if (estEtapeSechageOuAffinage(prochaineEtape) && projetComplet.lots.isNotEmpty()) {
                            Spacer(Modifier.height(8.dp))
                            OutlinedButton(
                                onClick = onAllerAuxLots,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Default.Scale, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("Peser mes lots (suivi du séchage)")
                            }
                        }
                    }
                }
            }
        }

        // Liste complète des étapes
        items(etapes, key = { "etape_${it.id}" }) { e ->
            val finMillis = e.debutPrevuMillis + e.dureeMinutes * 60_000L
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (e.terminee) MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                    else MaterialTheme.colorScheme.surface
                ),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Column(Modifier.padding(16.dp)) {
                    // En-tête de l'étape : Horaire + Badge Variante éventuel
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "${timeFmt.format(Date(e.debutPrevuMillis))} → ${SimpleDateFormat("HH'h'mm", Locale.FRANCE).format(Date(finMillis))} (${formatDuree(e.dureeMinutes)})",
                            style = MaterialTheme.typography.labelMedium,
                            color = if (e.terminee) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.primary,
                            modifier = Modifier.weight(1f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        if (e.varianteCible.isNotBlank()) {
                            Spacer(Modifier.width(8.dp))
                            Surface(
                                color = MaterialTheme.colorScheme.secondaryContainer,
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = e.varianteCible,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSecondaryContainer,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }
                    }

                    Spacer(Modifier.height(6.dp))

                    // Checkbox + Titre (avec weight(1f) pour éviter tout chevauchement)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { viewModel.basculerEtapeTerminee(e) },
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = e.terminee,
                            onCheckedChange = { viewModel.basculerEtapeTerminee(e) }
                        )
                        Spacer(Modifier.width(4.dp))
                        Text(
                            text = e.titre,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Text(
                        text = e.instructions,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 4.dp, bottom = 8.dp)
                    )

                    if (e.astuce.isNotBlank()) {
                        Surface(
                            color = MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.6f),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 10.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    Icons.Outlined.Lightbulb,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp),
                                    tint = MaterialTheme.colorScheme.tertiary
                                )
                                Spacer(Modifier.width(8.dp))
                                Text(
                                    text = e.astuce,
                                    style = MaterialTheme.typography.bodySmall,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }

                    // Photos de l'étape (miniatures + boutons Galerie / Caméra)
                    val photosEtape = projetComplet.photosEtapes
                        .filter { it.etapeId == e.id }
                        .sortedBy { it.dateAjoutMillis }

                    if (photosEtape.isNotEmpty()) {
                        Spacer(Modifier.height(10.dp))
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            items(photosEtape, key = { "photo_${it.id}" }) { photo ->
                                Box(
                                    modifier = Modifier
                                        .size(76.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(MaterialTheme.colorScheme.surfaceVariant)
                                        .clickable { photoApercu = photo }
                                ) {
                                    EtapePhotoImage(
                                        cheminFichier = photo.cheminFichier,
                                        sampleSize = 4,
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                }
                            }
                        }
                    }

                    Spacer(Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedButton(
                            onClick = {
                                etapeCiblePhotoId = e.id
                                galleryLauncher.launch(
                                    PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                )
                            },
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Outlined.PhotoLibrary, contentDescription = null, modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(5.dp))
                            Text(
                                if (photosEtape.isEmpty()) "Ajouter photo" else "Galerie (${photosEtape.size})",
                                style = MaterialTheme.typography.labelMedium
                            )
                        }
                        OutlinedButton(
                            onClick = {
                                etapeCiblePhotoId = e.id
                                val camUri = viewModel.creerUriPhotoCamera()
                                cameraUriCible = camUri
                                cameraLauncher.launch(camUri)
                            },
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Outlined.PhotoCamera, contentDescription = null, modifier = Modifier.size(15.dp))
                            Spacer(Modifier.width(5.dp))
                            Text("Appareil", style = MaterialTheme.typography.labelMedium)
                        }
                    }

                    // Actions d'ajustement horaire espacées proprement
                    if (!e.terminee) {
                        Spacer(Modifier.height(8.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            val decallages = listOf(
                                "-1h" to -60,
                                "-15m" to -15,
                                "+15m" to 15,
                                "+1h" to 60,
                                "+1j" to 1440
                            )
                            decallages.forEach { (libelle, delta) ->
                                OutlinedButton(
                                    onClick = { viewModel.decalerEtapeEtSuivantes(projetComplet.projet.id, e.ordre, delta) },
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text(libelle, style = MaterialTheme.typography.labelMedium)
                                }
                            }
                        }
                        Spacer(Modifier.height(6.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            FilledTonalButton(
                                onClick = { viewModel.demarrerEtapeMaintenant(projetComplet.projet.id, e) },
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("Maintenant", style = MaterialTheme.typography.labelMedium)
                            }
                            OutlinedButton(
                                onClick = {
                                    etapePourChoixDateHeure = e
                                    dateEtapeEnCoursMillis = null
                                },
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Icon(Icons.Default.Schedule, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(Modifier.width(4.dp))
                                Text("Horaire", style = MaterialTheme.typography.labelMedium)
                            }
                            if (estEtapeSechageOuAffinage(e) && projetComplet.lots.isNotEmpty()) {
                                OutlinedButton(
                                    onClick = onAllerAuxLots,
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Icon(Icons.Default.Scale, contentDescription = null, modifier = Modifier.size(14.dp))
                                    Spacer(Modifier.width(4.dp))
                                    Text("Peser", style = MaterialTheme.typography.labelMedium)
                                }
                            }
                            Spacer(Modifier.weight(1f))
                            IconButton(
                                onClick = { viewModel.programmerRappelEtape(e, projetComplet.projet.nom) },
                                modifier = Modifier.size(36.dp)
                            ) {
                                Icon(
                                    imageVector = if (e.rappelProgramme) Icons.Default.NotificationsActive else Icons.Outlined.Notifications,
                                    contentDescription = "Rappel",
                                    tint = if (e.rappelProgramme) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    photoApercu?.let { photo ->
        Dialog(
            onDismissRequest = { photoApercu = null },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                shape = RoundedCornerShape(20.dp),
                color = MaterialTheme.colorScheme.surface
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    EtapePhotoImage(
                        cheminFichier = photo.cheminFichier,
                        sampleSize = 1,
                        contentScale = ContentScale.Fit,
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 460.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.Black.copy(alpha = 0.08f))
                    )
                    Spacer(Modifier.height(10.dp))
                    val tailleKo = (photo.tailleOctets / 1024L).coerceAtLeast(1L)
                    Text(
                        text = "${timeFmt.format(Date(photo.dateAjoutMillis))} · $tailleKo Ko",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        OutlinedButton(
                            onClick = {
                                viewModel.supprimerPhotoEtape(photo)
                                photoApercu = null
                            },
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)
                        ) {
                            Icon(Icons.Outlined.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Supprimer")
                        }
                        Button(onClick = { photoApercu = null }) {
                            Text("Fermer")
                        }
                    }
                }
            }
        }
    }

    etapePourChoixDateHeure?.let { etape ->
        val dateIntermediaire = dateEtapeEnCoursMillis
        if (dateIntermediaire == null) {
            val initialUtcMillis = remember(etape.id, etape.debutPrevuMillis) {
                val calLocal = Calendar.getInstance().apply { timeInMillis = etape.debutPrevuMillis }
                Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
                    clear()
                    set(calLocal.get(Calendar.YEAR), calLocal.get(Calendar.MONTH), calLocal.get(Calendar.DAY_OF_MONTH))
                }.timeInMillis
            }
            val datePickerState = rememberDatePickerState(initialSelectedDateMillis = initialUtcMillis)
            DatePickerDialog(
                onDismissRequest = {
                    etapePourChoixDateHeure = null
                    dateEtapeEnCoursMillis = null
                },
                confirmButton = {
                    Button(onClick = {
                        val selectedUtc = datePickerState.selectedDateMillis
                        if (selectedUtc != null) {
                            val calUtc = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
                                timeInMillis = selectedUtc
                            }
                            val calLocal = Calendar.getInstance().apply {
                                timeInMillis = etape.debutPrevuMillis
                                set(Calendar.YEAR, calUtc.get(Calendar.YEAR))
                                set(Calendar.MONTH, calUtc.get(Calendar.MONTH))
                                set(Calendar.DAY_OF_MONTH, calUtc.get(Calendar.DAY_OF_MONTH))
                            }
                            dateEtapeEnCoursMillis = calLocal.timeInMillis
                        } else {
                            dateEtapeEnCoursMillis = etape.debutPrevuMillis
                        }
                    }) {
                        Text("Suivant")
                    }
                },
                dismissButton = {
                    TextButton(onClick = {
                        etapePourChoixDateHeure = null
                        dateEtapeEnCoursMillis = null
                    }) {
                        Text("Annuler")
                    }
                }
            ) {
                DatePicker(state = datePickerState)
            }
        } else {
            val calActuel = remember(dateIntermediaire) {
                Calendar.getInstance().apply { timeInMillis = dateIntermediaire }
            }
            val timePickerState = rememberTimePickerState(
                initialHour = calActuel.get(Calendar.HOUR_OF_DAY),
                initialMinute = calActuel.get(Calendar.MINUTE),
                is24Hour = true
            )
            AlertDialog(
                onDismissRequest = {
                    etapePourChoixDateHeure = null
                    dateEtapeEnCoursMillis = null
                },
                title = { Text("Heure de début · ${etape.titre}") },
                text = {
                    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                        TimePicker(state = timePickerState)
                    }
                },
                confirmButton = {
                    Button(onClick = {
                        val calFinal = Calendar.getInstance().apply {
                            timeInMillis = dateIntermediaire
                            set(Calendar.HOUR_OF_DAY, timePickerState.hour)
                            set(Calendar.MINUTE, timePickerState.minute)
                            set(Calendar.SECOND, 0)
                            set(Calendar.MILLISECOND, 0)
                        }
                        val deltaMinutes = ((calFinal.timeInMillis - etape.debutPrevuMillis) / 60_000.0).roundToInt()
                        if (deltaMinutes != 0) {
                            viewModel.decalerEtapeEtSuivantes(projetComplet.projet.id, etape.ordre, deltaMinutes)
                        }
                        etapePourChoixDateHeure = null
                        dateEtapeEnCoursMillis = null
                    }) {
                        Text("Valider")
                    }
                },
                dismissButton = {
                    TextButton(onClick = {
                        etapePourChoixDateHeure = null
                        dateEtapeEnCoursMillis = null
                    }) {
                        Text("Annuler")
                    }
                }
            )
        }
    }
}

@Composable
private fun EtapePhotoImage(
    cheminFichier: String,
    sampleSize: Int,
    contentScale: ContentScale,
    modifier: Modifier = Modifier
) {
    val bitmap by produceState<ImageBitmap?>(initialValue = null, cheminFichier, sampleSize) {
        value = withContext(Dispatchers.IO) {
            runCatching {
                val file = File(cheminFichier)
                if (!file.exists()) return@runCatching null
                val opts = BitmapFactory.Options().apply { inSampleSize = sampleSize }
                BitmapFactory.decodeFile(file.absolutePath, opts)?.asImageBitmap()
            }.getOrNull()
        }
    }
    if (bitmap != null) {
        Image(
            bitmap = bitmap!!,
            contentDescription = "Photo d'étape",
            contentScale = contentScale,
            modifier = modifier
        )
    } else {
        Box(
            modifier = modifier,
            contentAlignment = Alignment.Center
        ) {
            Icon(
                Icons.Outlined.Image,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
            )
        }
    }
}
