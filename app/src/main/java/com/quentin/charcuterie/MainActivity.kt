@file:OptIn(ExperimentalMaterial3Api::class)

package com.quentin.charcuterie

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.core.content.ContextCompat
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.quentin.charcuterie.ui.CharcuterieViewModel
import com.quentin.charcuterie.ui.screens.CaveScreen
import com.quentin.charcuterie.ui.screens.CommandesGlobalScreen
import com.quentin.charcuterie.ui.screens.CoursesScreen
import com.quentin.charcuterie.ui.screens.ParametresScreen
import com.quentin.charcuterie.ui.screens.ProjetsScreen
import com.quentin.charcuterie.ui.screens.RecettesScreen
import com.quentin.charcuterie.ui.theme.AtelierCharcuterieTheme

class MainActivity : ComponentActivity() {

    private val viewModel: CharcuterieViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AtelierCharcuterieTheme {
                val context = androidx.compose.ui.platform.LocalContext.current
                val notifPermissionLauncher = rememberLauncherForActivityResult(
                    ActivityResultContracts.RequestPermission()
                ) { }

                LaunchedEffect(Unit) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        val granted = ContextCompat.checkSelfPermission(
                            context,
                            Manifest.permission.POST_NOTIFICATIONS
                        ) == PackageManager.PERMISSION_GRANTED
                        if (!granted) {
                            notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                        }
                    }
                }

                val recettes by viewModel.recettes.collectAsState()
                var ongletPrincipal by rememberSaveable { mutableIntStateOf(0) }
                val historiqueOnglets = remember { mutableStateListOf<Int>() }
                var recetteAPreselectionnerId by rememberSaveable { mutableStateOf<Long?>(null) }
                val recetteAPreselectionner = remember(recettes, recetteAPreselectionnerId) {
                    recetteAPreselectionnerId?.let { id -> recettes.find { it.recette.id == id } }
                }

                val courses by viewModel.courses.collectAsState()
                val parametres by viewModel.parametres.collectAsState()
                val nbCoursesRestantes = courses.count { !it.achete }

                val optionPrixActive = remember(parametres) {
                    (parametres.find { it.cle == "ACTIVER_PRIX" }?.valeur ?: 1.0) >= 0.5
                }

                val optionReventeActive = remember(parametres, optionPrixActive) {
                    optionPrixActive && ((parametres.find { it.cle == "ACTIVER_REVENTE" }?.valeur ?: 1.0) >= 0.5)
                }

                fun changerOnglet(cible: Int) {
                    if (cible != ongletPrincipal) {
                        historiqueOnglets.add(ongletPrincipal)
                        ongletPrincipal = cible
                    }
                }

                LaunchedEffect(optionReventeActive) {
                    if (!optionReventeActive && ongletPrincipal == 3) {
                        ongletPrincipal = 0
                        historiqueOnglets.removeAll { it == 3 }
                    }
                }

                // Retour arrière classique entre les onglets principaux (au lieu de fermer l'application)
                BackHandler(enabled = historiqueOnglets.isNotEmpty() || ongletPrincipal != 0) {
                    if (historiqueOnglets.isNotEmpty()) {
                        val precedent = historiqueOnglets.removeAt(historiqueOnglets.lastIndex)
                        ongletPrincipal = if (!optionReventeActive && precedent == 3) 0 else precedent
                    } else {
                        ongletPrincipal = 0
                    }
                }

                Scaffold(
                    containerColor = MaterialTheme.colorScheme.background,
                    bottomBar = {
                        Column {
                            HorizontalDivider(
                                thickness = 1.dp,
                                color = MaterialTheme.colorScheme.outlineVariant
                            )
                            NavigationBar(
                                containerColor = MaterialTheme.colorScheme.surface,
                                tonalElevation = 0.dp
                            ) {
                                NavigationBarItem(
                                    selected = ongletPrincipal == 0,
                                    onClick = { changerOnglet(0) },
                                    icon = {
                                        Icon(
                                            if (ongletPrincipal == 0) Icons.Filled.CalendarMonth else Icons.Outlined.CalendarMonth,
                                            contentDescription = null
                                        )
                                    },
                                    label = {
                                        Text(
                                            "Projets",
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                            fontWeight = if (ongletPrincipal == 0) FontWeight.Bold else FontWeight.Medium
                                        )
                                    }
                                )
                                NavigationBarItem(
                                    selected = ongletPrincipal == 1,
                                    onClick = { changerOnglet(1) },
                                    icon = {
                                        Icon(
                                            if (ongletPrincipal == 1) Icons.Filled.RestaurantMenu else Icons.Outlined.RestaurantMenu,
                                            contentDescription = null
                                        )
                                    },
                                    label = {
                                        Text(
                                            "Charcuteries",
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                            fontWeight = if (ongletPrincipal == 1) FontWeight.Bold else FontWeight.Medium
                                        )
                                    }
                                )
                                NavigationBarItem(
                                    selected = ongletPrincipal == 2,
                                    onClick = { changerOnglet(2) },
                                    icon = {
                                        BadgedBox(
                                            badge = {
                                                if (nbCoursesRestantes > 0) {
                                                    Badge(containerColor = MaterialTheme.colorScheme.primary) {
                                                        Text(nbCoursesRestantes.toString())
                                                    }
                                                }
                                            }
                                        ) {
                                            Icon(
                                                if (ongletPrincipal == 2) Icons.Filled.ShoppingBag else Icons.Outlined.ShoppingBag,
                                                contentDescription = null
                                            )
                                        }
                                    },
                                    label = {
                                        Text(
                                            "Courses",
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                            fontWeight = if (ongletPrincipal == 2) FontWeight.Bold else FontWeight.Medium
                                        )
                                    }
                                )
                                if (optionReventeActive) {
                                    NavigationBarItem(
                                        selected = ongletPrincipal == 3,
                                        onClick = { changerOnglet(3) },
                                        icon = {
                                            Icon(
                                                if (ongletPrincipal == 3) Icons.Filled.Storefront else Icons.Outlined.Storefront,
                                                contentDescription = null
                                            )
                                        },
                                        label = {
                                            Text(
                                                "Revente",
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis,
                                                fontWeight = if (ongletPrincipal == 3) FontWeight.Bold else FontWeight.Medium
                                            )
                                        }
                                    )
                                }
                                NavigationBarItem(
                                    selected = ongletPrincipal == 5,
                                    onClick = { changerOnglet(5) },
                                    icon = {
                                        Icon(
                                            if (ongletPrincipal == 5) Icons.Filled.Thermostat else Icons.Outlined.Thermostat,
                                            contentDescription = null
                                        )
                                    },
                                    label = {
                                        Text(
                                            "Cave",
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                            fontWeight = if (ongletPrincipal == 5) FontWeight.Bold else FontWeight.Medium
                                        )
                                    }
                                )
                                NavigationBarItem(
                                    selected = ongletPrincipal == 4,
                                    onClick = { changerOnglet(4) },
                                    icon = {
                                        Icon(
                                            if (ongletPrincipal == 4) Icons.Filled.Tune else Icons.Outlined.Tune,
                                            contentDescription = null
                                        )
                                    },
                                    label = {
                                        Text(
                                            "Réglages",
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                            fontWeight = if (ongletPrincipal == 4) FontWeight.Bold else FontWeight.Medium
                                        )
                                    }
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        when (ongletPrincipal) {
                            0 -> ProjetsScreen(
                                viewModel = viewModel,
                                recettePreselectionnee = recetteAPreselectionner,
                                onConsommerPreselection = { recetteAPreselectionnerId = null },
                                onAllerAuxRecettes = { changerOnglet(1) },
                                onAllerAuxReglages = { changerOnglet(4) }
                            )
                            1 -> RecettesScreen(
                                viewModel = viewModel,
                                onLancerProjetDepuisRecette = { rc ->
                                    recetteAPreselectionnerId = rc.recette.id
                                    changerOnglet(0)
                                }
                            )
                            2 -> CoursesScreen(viewModel = viewModel)
                            3 -> CommandesGlobalScreen(viewModel = viewModel)
                            4 -> ParametresScreen(viewModel = viewModel)
                            5 -> CaveScreen(viewModel = viewModel)
                        }
                    }
                }
            }
        }
    }
}
