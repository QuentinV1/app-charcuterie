@file:OptIn(ExperimentalMaterial3Api::class)

package com.quentin.charcuterie.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.quentin.charcuterie.data.ClientEntity
import com.quentin.charcuterie.ui.CharcuterieViewModel

@Composable
fun ClientsScreen(
    viewModel: CharcuterieViewModel,
    onRetour: () -> Unit
) {
    val clients by viewModel.clients.collectAsState()
    val commandes by viewModel.commandes.collectAsState()
    var recherche by rememberSaveable { mutableStateOf("") }
    var showAddDialog by remember { mutableStateOf(false) }
    var clientAEditer by remember { mutableStateOf<ClientEntity?>(null) }
    var clientASupprimer by remember { mutableStateOf<ClientEntity?>(null) }

    val clientsFiltres = remember(clients, recherche) {
        val q = recherche.trim()
        if (q.isBlank()) clients else clients.filter { it.nom.contains(q, ignoreCase = true) }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 100.dp)
    ) {
        item(key = "clients_header") {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    IconButton(onClick = onRetour) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Retour à Revente")
                    }
                    Column {
                        Text(
                            text = "Carnet d'adresses",
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = "Clients (${clients.size})",
                            style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                    }
                }
                Button(
                    onClick = { showAddDialog = true },
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Ajouter", style = MaterialTheme.typography.labelMedium)
                }
            }
        }

        if (clients.isNotEmpty()) {
            item(key = "clients_search") {
                OutlinedTextField(
                    value = recherche,
                    onValueChange = { recherche = it },
                    placeholder = { Text("Rechercher un client...") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    trailingIcon = {
                        if (recherche.isNotEmpty()) {
                            IconButton(onClick = { recherche = "" }) {
                                Icon(Icons.Default.Close, contentDescription = "Effacer")
                            }
                        }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        if (clientsFiltres.isEmpty()) {
            item(key = "clients_empty") {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Text(
                        text = if (clients.isEmpty()) {
                            "Aucun client enregistré. Ajoutez-en un ici ou créez une commande : le nom sera enregistré automatiquement."
                        } else {
                            "Aucun client ne correspond à « $recherche »."
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(20.dp)
                    )
                }
            }
        }

        items(clientsFiltres, key = { "client_${it.id}" }) { client ->
            val cmdClient = commandes.filter { it.nomAcheteur.trim().equals(client.nom.trim(), ignoreCase = true) }
            val nbCmd = cmdClient.size
            val totalClient = cmdClient.sumOf { it.montantTotal }

            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primaryContainer),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = client.nom.trim().firstOrNull()?.uppercase() ?: "?",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = client.nom,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = if (nbCmd == 0) {
                                "Aucune commande"
                            } else {
                                "$nbCmd commande${if (nbCmd > 1) "s" else ""} • ${formatEuro(totalClient)}"
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    IconButton(onClick = { clientAEditer = client }) {
                        Icon(
                            Icons.Default.Edit,
                            contentDescription = "Modifier",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                    IconButton(onClick = { clientASupprimer = client }) {
                        Icon(
                            Icons.Default.Delete,
                            contentDescription = "Supprimer",
                            tint = MaterialTheme.colorScheme.error
                        )
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        ClientNomDialog(
            titre = "Nouveau client",
            nomInitial = "",
            onDismiss = { showAddDialog = false },
            onValider = { nom ->
                viewModel.ajouterClient(nom)
                showAddDialog = false
            }
        )
    }

    clientAEditer?.let { client ->
        ClientNomDialog(
            titre = "Modifier le client",
            nomInitial = client.nom,
            onDismiss = { clientAEditer = null },
            onValider = { nouveauNom ->
                viewModel.modifierClient(client, nouveauNom)
                clientAEditer = null
            }
        )
    }

    clientASupprimer?.let { client ->
        AlertDialog(
            onDismissRequest = { clientASupprimer = null },
            title = { Text("Supprimer ce client ?") },
            text = {
                Text("« ${client.nom} » sera retiré de votre liste de clients enregistrés. Ses commandes passées seront conservées.")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.supprimerClient(client)
                        clientASupprimer = null
                    }
                ) {
                    Text("Supprimer", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { clientASupprimer = null }) { Text("Annuler") }
            }
        )
    }
}

@Composable
private fun ClientNomDialog(
    titre: String,
    nomInitial: String,
    onDismiss: () -> Unit,
    onValider: (String) -> Unit
) {
    var nom by remember(nomInitial) { mutableStateOf(nomInitial) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(titre) },
        text = {
            OutlinedTextField(
                value = nom,
                onValueChange = { nom = it },
                label = { Text("Nom du client") },
                placeholder = { Text("Ex: Baptiste et Pauline") },
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            )
        },
        confirmButton = {
            Button(
                onClick = { onValider(nom) },
                enabled = nom.isNotBlank()
            ) {
                Text("Enregistrer")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Annuler") }
        }
    )
}
