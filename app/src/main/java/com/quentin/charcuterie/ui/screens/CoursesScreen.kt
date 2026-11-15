@file:OptIn(ExperimentalMaterial3Api::class)

package com.quentin.charcuterie.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.outlined.DeleteSweep
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.quentin.charcuterie.ui.CharcuterieViewModel

// ============================================================================================
// ÉCRAN LISTE DE COURSES (MODERNE, REGROUPÉ PAR PROJET, MODIFIABLE & VIDABLE)
// ============================================================================================
@Composable
fun CoursesScreen(viewModel: CharcuterieViewModel) {
    val courses by viewModel.courses.collectAsState()
    val projets by viewModel.projets.collectAsState()
    val parametres by viewModel.parametres.collectAsState()
    val optionPrixActive = remember(parametres) {
        (parametres.find { it.cle == "ACTIVER_PRIX" }?.valeur ?: 1.0) >= 0.5
    }
    var showAddDialog by remember { mutableStateOf(false) }
    var courseAEditer by remember { mutableStateOf<com.quentin.charcuterie.data.ProjetCourseEntity?>(null) }
    var showConfirmDeleteAchetes by remember { mutableStateOf(false) }

    val restantAAcheter = courses.filter { !it.achete }
    val totalEstimeRestant = restantAAcheter.sumOf { it.prixEstimeTotal }
    val nbAchetes = courses.count { it.achete }

    // Regroupement par projet
    val coursesParProjet = remember(courses) {
        courses.groupBy { it.nomProjet.ifBlank { "Articles divers" } }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 20.dp, bottom = 100.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "${restantAAcheter.size} articles à acheter (${coursesParProjet.size} projets)",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = "Liste de courses",
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (nbAchetes > 0) {
                        OutlinedButton(
                            onClick = { showConfirmDeleteAchetes = true },
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Icon(Icons.Outlined.DeleteSweep, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Nettoyer ($nbAchetes)", style = MaterialTheme.typography.labelSmall)
                        }
                    }
                    Button(
                        onClick = { showAddDialog = true },
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Ajouter", style = MaterialTheme.typography.labelMedium)
                    }
                }
            }
        }

        if (optionPrixActive) {
            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                    elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
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
                                text = "Budget restant estimé",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                            Text(
                                text = "Touchez une ligne pour ajuster son prix ou sa quantité",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                            )
                        }
                        Spacer(Modifier.width(12.dp))
                        Text(
                            text = formatEuro(totalEstimeRestant),
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }

        if (courses.isEmpty()) {
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Text(
                        text = "Votre liste de courses est vide. Elle se remplira automatiquement dès que vous planifierez un projet.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(20.dp)
                    )
                }
            }
        }

        // Affichage groupé par projet
        coursesParProjet.forEach { (nomProjet, itemsDuProjet) ->
            item(key = "header_$nomProjet") {
                val totalProjet = itemsDuProjet.filter { !it.achete }.sumOf { it.prixEstimeTotal }
                val achetesProjet = itemsDuProjet.count { it.achete }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 10.dp, bottom = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        modifier = Modifier.weight(1f),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(8.dp)
                        ) {}
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = nomProjet,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                    }
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = if (optionPrixActive) "${itemsDuProjet.size - achetesProjet}/${itemsDuProjet.size} restant · ${formatEuro(totalProjet)}"
                                   else "${itemsDuProjet.size - achetesProjet}/${itemsDuProjet.size} restant",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            }

            items(itemsDuProjet, key = { "course_${it.id}" }) { c ->
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (c.achete) MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        else MaterialTheme.colorScheme.surface
                    ),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { courseAEditer = c }
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = c.achete,
                            onCheckedChange = { viewModel.basculerCourseAchetee(c) }
                        )
                        Spacer(Modifier.width(4.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = c.nomIngredient,
                                style = MaterialTheme.typography.titleSmall,
                                textDecoration = if (c.achete) TextDecoration.LineThrough else TextDecoration.None,
                                color = if (c.achete) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "${c.quantiteRequise} ${c.unite} · ${c.categorie.lowercase()}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                        Spacer(Modifier.width(8.dp))
                        Column(horizontalAlignment = Alignment.End) {
                            if (optionPrixActive) {
                                Text(
                                    text = formatEuro(if (c.achete && c.prixReelPaye > 0) c.prixReelPaye else c.prixEstimeTotal),
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = if (c.achete) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.primary
                                )
                            }
                            IconButton(
                                onClick = { courseAEditer = c },
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(Icons.Outlined.Edit, contentDescription = "Modifier", tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(15.dp))
                            }
                        }
                    }
                }
            }
        }
    }

    // Dialogue de modification d'un article (nom, quantité, prix estimé / payé)
    courseAEditer?.let { c ->
        var nom by remember(c.id) { mutableStateOf(c.nomIngredient) }
        var qte by remember(c.id) { mutableStateOf(c.quantiteRequise.toString()) }
        var unite by remember(c.id) { mutableStateOf(c.unite) }
        var prix by remember(c.id) { mutableStateOf((if (c.prixReelPaye > 0) c.prixReelPaye else c.prixEstimeTotal).toString()) }

        AlertDialog(
            onDismissRequest = { courseAEditer = null },
            title = { Text("Modifier l'article") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = nom,
                        onValueChange = { nom = it },
                        label = { Text("Nom de l'ingrédient / article") },
                        singleLine = true
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = qte,
                            onValueChange = { qte = it },
                            label = { Text("Quantité") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = unite,
                            onValueChange = { unite = it },
                            label = { Text("Unité") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    if (optionPrixActive) {
                        OutlinedTextField(
                            value = prix,
                            onValueChange = { prix = it },
                            label = { Text("Prix total (€)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true
                        )
                    }
                }
            },
            confirmButton = {
                Button(onClick = {
                    val q = qte.replace(",", ".").toDoubleOrNull() ?: c.quantiteRequise
                    val p = prix.replace(",", ".").toDoubleOrNull() ?: c.prixEstimeTotal
                    viewModel.modifierCourse(c, nom.trim(), q, unite.trim(), p)
                    courseAEditer = null
                }) { Text("Enregistrer") }
            },
            dismissButton = {
                Row {
                    TextButton(
                        onClick = {
                            viewModel.supprimerCourse(c)
                            courseAEditer = null
                        },
                        colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                    ) { Text("Supprimer") }
                    Spacer(Modifier.width(4.dp))
                    TextButton(onClick = { courseAEditer = null }) { Text("Annuler") }
                }
            }
        )
    }

    if (showConfirmDeleteAchetes) {
        AlertDialog(
            onDismissRequest = { showConfirmDeleteAchetes = false },
            title = { Text("Nettoyer la liste de courses") },
            text = { Text("Voulez-vous supprimer définitivement tous les articles déjà achetés ($nbAchetes articles) ?") },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.supprimerToutesLesCoursesAchetees()
                        showConfirmDeleteAchetes = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Supprimer les achetés")
                }
            },
            dismissButton = {
                TextButton(onClick = { showConfirmDeleteAchetes = false }) { Text("Annuler") }
            }
        )
    }

    if (showAddDialog) {
        var nom by remember { mutableStateOf("") }
        var qte by remember { mutableStateOf("1") }
        var unite by remember { mutableStateOf("kg") }
        var prix by remember { mutableStateOf("5.0") }
        var nomProjetSelectionne by remember { mutableStateOf(projets.firstOrNull()?.projet?.nom ?: "Hors projet") }
        val projetSelectionne = projets.find { it.projet.nom == nomProjetSelectionne }?.projet

        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("Ajouter un article") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (projets.isNotEmpty()) {
                        Text("Rattacher au projet :", style = MaterialTheme.typography.labelSmall)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            item(key = "hors_projet") {
                                FilterChip(
                                    selected = nomProjetSelectionne == "Hors projet",
                                    onClick = { nomProjetSelectionne = "Hors projet" },
                                    label = { Text("Hors projet") }
                                )
                            }
                            items(projets, key = { it.projet.id }) { p ->
                                FilterChip(
                                    selected = nomProjetSelectionne == p.projet.nom,
                                    onClick = { nomProjetSelectionne = p.projet.nom },
                                    label = { Text(p.projet.nom, maxLines = 1, overflow = TextOverflow.Ellipsis) }
                                )
                            }
                        }
                    }
                    OutlinedTextField(value = nom, onValueChange = { nom = it }, label = { Text("Ingrédient ou matériel") }, singleLine = true)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = qte,
                            onValueChange = { qte = it },
                            label = { Text("Quantité") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = unite,
                            onValueChange = { unite = it },
                            label = { Text("Unité") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    if (optionPrixActive) {
                        OutlinedTextField(
                            value = prix,
                            onValueChange = { prix = it },
                            label = { Text("Prix estimé (€)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true
                        )
                    }
                }
            },
            confirmButton = {
                Button(onClick = {
                    if (nom.isNotBlank()) {
                        viewModel.ajouterCourseManuelle(
                            projetId = projetSelectionne?.id,
                            nomProjet = nomProjetSelectionne,
                            nomIngredient = nom.trim(),
                            quantite = qte.replace(",", ".").toDoubleOrNull() ?: 1.0,
                            unite = unite.trim(),
                            prixEstime = prix.replace(",", ".").toDoubleOrNull() ?: 0.0
                        )
                    }
                    showAddDialog = false
                }) { Text("Ajouter") }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) { Text("Annuler") }
            }
        )
    }
}
