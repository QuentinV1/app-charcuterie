@file:OptIn(ExperimentalMaterial3Api::class)

package com.quentin.charcuterie.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Thermostat
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.quentin.charcuterie.data.CaveReleveEntity
import com.quentin.charcuterie.ui.CharcuterieViewModel
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

private val MOIS_COURTS = listOf("Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc")
private val COULEURS_ANNEES = listOf(
    Color(0xFFC84B31),
    Color(0xFF1565C0),
    Color(0xFF2E7D32),
    Color(0xFF8E24AA),
    Color(0xFFEF6C00),
    Color(0xFF00838F)
)

@Composable
fun CaveScreen(viewModel: CharcuterieViewModel) {
    val releves by viewModel.caveReleves.collectAsState()
    var tempText by rememberSaveable { mutableStateOf("") }
    var hygroText by rememberSaveable { mutableStateOf("") }
    var noteText by rememberSaveable { mutableStateOf("") }
    var metrique by rememberSaveable { mutableStateOf("BOTH") } // "BOTH", "TEMP", "HYGRO"
    var dateReleveMillis by rememberSaveable { mutableLongStateOf(System.currentTimeMillis()) }
    var showDatePicker by rememberSaveable { mutableStateOf(false) }
    var erreurMsg by remember { mutableStateOf<String?>(null) }

    val dateFormatter = remember { SimpleDateFormat("dd MMM yyyy", Locale.FRANCE) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 32.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Column {
                Text(
                    "Journal de Cave",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.ExtraBold
                )
                Text(
                    "Suivez température & hygrométrie année par année",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // Formulaire rapide de saisie
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Nouveau relevé", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedTextField(
                            value = tempText,
                            onValueChange = { tempText = it; erreurMsg = null },
                            label = { Text("Température (°C)") },
                            placeholder = { Text("12.5") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = hygroText,
                            onValueChange = { hygroText = it; erreurMsg = null },
                            label = { Text("Hygrométrie (%)") },
                            placeholder = { Text("75") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    OutlinedTextField(
                        value = noteText,
                        onValueChange = { noteText = it },
                        label = { Text("Note (optionnel)") },
                        placeholder = { Text("Ex: Fenêtre entrebâillée la nuit") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "📅 Relevé du : ${dateFormatter.format(Date(dateReleveMillis))}",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.weight(1f),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        TextButton(
                            onClick = { dateReleveMillis = System.currentTimeMillis() },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text("Maintenant", style = MaterialTheme.typography.labelMedium)
                        }
                        OutlinedButton(
                            onClick = { showDatePicker = true },
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text("Choisir date", style = MaterialTheme.typography.labelMedium)
                        }
                    }
                    if (erreurMsg != null) {
                        Text(erreurMsg!!, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    }
                    Button(
                        onClick = {
                            val t = tempText.replace(',', '.').toDoubleOrNull()
                            val h = hygroText.replace(',', '.').toDoubleOrNull()
                            if (t == null || h == null || h < 0.0 || h > 100.0) {
                                erreurMsg = "Saisissez une température (°C) et une hygrométrie (0-100%) valides."
                            } else {
                                viewModel.ajouterReleveCave(t, h, dateReleveMillis, noteText)
                                tempText = ""
                                hygroText = ""
                                noteText = ""
                                dateReleveMillis = System.currentTimeMillis()
                                erreurMsg = null
                            }
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Filled.Add, contentDescription = null)
                        Spacer(Modifier.width(6.dp))
                        Text("Enregistrer le relevé")
                    }
                }
            }
        }

        // Dernier relevé & statut
        val dernier = releves.firstOrNull()
        if (dernier != null) {
            item {
                val tempOk = dernier.temperature in 10.0..14.0
                val hygroOk = dernier.hygrometrie in 70.0..80.0
                val statusColor = when {
                    tempOk && hygroOk -> Color(0xFF2E7D32)
                    dernier.temperature > 17.0 || dernier.hygrometrie < 60.0 || dernier.hygrometrie > 88.0 -> Color(0xFFC62828)
                    else -> Color(0xFFEF6C00)
                }
                val statusLabel = when {
                    tempOk && hygroOk -> "✅ Conditions idéales"
                    !tempOk && !hygroOk -> "⚠️ T° & HR hors cible"
                    !tempOk -> "⚠️ T° hors cible (10-14°C)"
                    else -> "⚠️ HR hors cible (70-80%)"
                }

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp).fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                "Dernier relevé (${dateFormatter.format(Date(dernier.dateMillis))})",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                "${dernier.temperature}°C  ·  ${dernier.hygrometrie}% HR",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.ExtraBold
                            )
                        }
                        Surface(
                            color = statusColor.copy(alpha = 0.14f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                statusLabel,
                                color = statusColor,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
            }
        }

        // Graphiques comparatifs année par année
        if (releves.isNotEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Évolution annuelle", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                FilterChip(selected = metrique == "BOTH", onClick = { metrique = "BOTH" }, label = { Text("Les 2") })
                                FilterChip(selected = metrique == "TEMP", onClick = { metrique = "TEMP" }, label = { Text("T°") })
                                FilterChip(selected = metrique == "HYGRO", onClick = { metrique = "HYGRO" }, label = { Text("HR%") })
                            }
                        }

                        val meilleursMois = remember(releves) { calculerMeilleursMois(releves) }
                        if (meilleursMois.isNotEmpty()) {
                            Surface(
                                color = Color(0xFF2E7D32).copy(alpha = 0.12f),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    "🏆 Meilleurs mois observés : ${meilleursMois.joinToString(", ")}",
                                    color = Color(0xFF2E7D32),
                                    style = MaterialTheme.typography.bodySmall,
                                    fontWeight = FontWeight.SemiBold,
                                    modifier = Modifier.padding(8.dp)
                                )
                            }
                        }

                        if (metrique == "BOTH" || metrique == "TEMP") {
                            GraphiqueAnnuelCave(releves = releves, isTemp = true)
                        }
                        if (metrique == "BOTH" || metrique == "HYGRO") {
                            GraphiqueAnnuelCave(releves = releves, isTemp = false)
                        }
                    }
                }
            }

            item {
                Text(
                    "Historique (${releves.size})",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
            }

            items(releves, key = { it.id }) { rel ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp).fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                "${dateFormatter.format(Date(rel.dateMillis))} — ${rel.temperature}°C · ${rel.hygrometrie}%",
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.bodyMedium
                            )
                            if (rel.note.isNotBlank()) {
                                Text(
                                    rel.note,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                        IconButton(onClick = { viewModel.supprimerReleveCave(rel) }) {
                            Icon(Icons.Filled.Delete, contentDescription = "Supprimer", tint = MaterialTheme.colorScheme.error)
                        }
                    }
                }
            }
        } else {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp).fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Filled.Thermostat, contentDescription = null, modifier = Modifier.size(36.dp), tint = MaterialTheme.colorScheme.primary)
                        Spacer(Modifier.height(8.dp))
                        Text("Aucun relevé de cave", fontWeight = FontWeight.Bold)
                        Text(
                            "Ajoutez votre premier relevé pour visualiser l'évolution de votre cave année par année.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }

    if (showDatePicker) {
        val datePickerState = rememberDatePickerState(initialSelectedDateMillis = dateReleveMillis)
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        datePickerState.selectedDateMillis?.let { selectedUtc ->
                            val calSelected = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
                                timeInMillis = selectedUtc
                            }
                            val calNow = Calendar.getInstance().apply { timeInMillis = dateReleveMillis }
                            calNow.set(
                                calSelected.get(Calendar.YEAR),
                                calSelected.get(Calendar.MONTH),
                                calSelected.get(Calendar.DAY_OF_MONTH)
                            )
                            dateReleveMillis = calNow.timeInMillis
                        }
                        showDatePicker = false
                    }
                ) {
                    Text("Valider")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text("Annuler")
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }
}

@Composable
private fun GraphiqueAnnuelCave(releves: List<CaveReleveEntity>, isTemp: Boolean) {
    val minVal = if (isTemp) 0f else 30f
    val maxVal = if (isTemp) 30f else 100f
    val idealMin = if (isTemp) 10f else 70f
    val idealMax = if (isTemp) 14f else 80f
    val unite = if (isTemp) "°C" else "%"

    val parAnnee = remember(releves, isTemp) {
        val map = sortedMapOf<Int, Array<MutableList<Float>>>()
        val cal = Calendar.getInstance()
        releves.forEach { r ->
            cal.timeInMillis = r.dateMillis
            val yr = cal.get(Calendar.YEAR)
            val m = cal.get(Calendar.MONTH)
            val arr = map.getOrPut(yr) { Array(12) { mutableListOf() } }
            arr[m].add(if (isTemp) r.temperature.toFloat() else r.hygrometrie.toFloat())
        }
        map
    }

    val annees = parAnnee.keys.toList()

    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                if (isTemp) "🌡️ Température (°C)" else "💧 Hygrométrie (%)",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                annees.forEachIndexed { idx, yr ->
                    Text(
                        "● $yr",
                        color = COULEURS_ANNEES[idx % COULEURS_ANNEES.size],
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(170.dp)
                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                .padding(8.dp)
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val padL = 70f
                val padR = 16f
                val padT = 16f
                val padB = 42f
                val plotW = (size.width - padL - padR).coerceAtLeast(1f)
                val plotH = (size.height - padT - padB).coerceAtLeast(1f)

                fun toX(mIdx: Int): Float = padL + (mIdx / 11f) * plotW
                fun toY(v: Float): Float {
                    val c = v.coerceIn(minVal, maxVal)
                    return padT + plotH - ((c - minVal) / (maxVal - minVal)) * plotH
                }

                // Zone idéale verte
                val yTop = toY(idealMax)
                val yBot = toY(idealMin)
                drawRect(
                    color = Color(0xFF2E7D32).copy(alpha = 0.16f),
                    topLeft = Offset(padL, yTop),
                    size = Size(plotW, (yBot - yTop).coerceAtLeast(2f))
                )

                val textPaint = android.graphics.Paint().apply {
                    color = android.graphics.Color.GRAY
                    textSize = 24f
                    isAntiAlias = true
                }

                // Ticks Y
                val ticks = if (isTemp) listOf(0f, 10f, 14f, 20f, 30f) else listOf(40f, 60f, 70f, 80f, 100f)
                ticks.forEach { t ->
                    val y = toY(t)
                    drawLine(
                        color = Color.Gray.copy(alpha = 0.25f),
                        start = Offset(padL, y),
                        end = Offset(padL + plotW, y),
                        strokeWidth = 1.5f
                    )
                    drawContext.canvas.nativeCanvas.drawText("${t.toInt()}$unite", 4f, y + 8f, textPaint)
                }

                // Labels X (mois)
                MOIS_COURTS.forEachIndexed { idx, mois ->
                    if (idx % 2 == 0 || idx == 11) {
                        val x = toX(idx)
                        drawContext.canvas.nativeCanvas.drawText(mois, x - 16f, size.height - 8f, textPaint)
                    }
                }

                // Courbes par année
                annees.forEachIndexed { idxAn, yr ->
                    val col = COULEURS_ANNEES[idxAn % COULEURS_ANNEES.size]
                    val arr = parAnnee[yr]!!
                    val pts = mutableListOf<Offset>()
                    for (m in 0 until 12) {
                        if (arr[m].isNotEmpty()) {
                            val avg = arr[m].average().toFloat()
                            pts.add(Offset(toX(m), toY(avg)))
                        }
                    }
                    if (pts.size > 1) {
                        val path = Path().apply {
                            moveTo(pts.first().x, pts.first().y)
                            for (i in 1 until pts.size) lineTo(pts[i].x, pts[i].y)
                        }
                        drawPath(path, color = col, style = Stroke(width = 5f, cap = StrokeCap.Round))
                    }
                    pts.forEach { pt ->
                        drawCircle(color = Color.White, radius = 8f, center = pt)
                        drawCircle(color = col, radius = 6f, center = pt)
                    }
                }
            }
        }
    }
}

private fun calculerMeilleursMois(releves: List<CaveReleveEntity>): List<String> {
    val parMoisT = Array(12) { mutableListOf<Double>() }
    val parMoisH = Array(12) { mutableListOf<Double>() }
    val cal = Calendar.getInstance()
    releves.forEach { r ->
        cal.timeInMillis = r.dateMillis
        val m = cal.get(Calendar.MONTH)
        parMoisT[m].add(r.temperature)
        parMoisH[m].add(r.hygrometrie)
    }
    val res = mutableListOf<String>()
    for (m in 0 until 12) {
        if (parMoisT[m].isNotEmpty()) {
            val avgT = parMoisT[m].average()
            val avgH = parMoisH[m].average()
            if (avgT in 10.0..14.0 && avgH in 70.0..80.0) {
                res.add("${MOIS_COURTS[m]} (${String.format("%.1f", avgT)}°C, ${avgH.toInt()}%)")
            }
        }
    }
    return res
}
