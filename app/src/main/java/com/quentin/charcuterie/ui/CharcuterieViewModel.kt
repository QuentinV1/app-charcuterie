package com.quentin.charcuterie.ui

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.quentin.charcuterie.data.*
import com.quentin.charcuterie.notifications.ReminderReceiver
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class LotDraft(
    val variante: String,
    val quantite: Double,
    val epicesGrammesParUnite: Double = 15.0,
    val dureeSalageHeures: Double = 24.0
)

class CharcuterieViewModel(application: Application) : AndroidViewModel(application) {

    private val db = AppDatabase.getInstance(application)
    private val dao = db.dao()

    val recettes: StateFlow<List<RecetteComplete>> = dao.observeRecettesCompletes()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val projets: StateFlow<List<ProjetComplet>> = dao.observeProjetsComplets()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val courses: StateFlow<List<ProjetCourseEntity>> = dao.observeToutesLesCourses()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val commandes: StateFlow<List<ProjetCommandeEntity>> = dao.observeToutesLesCommandes()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val clients: StateFlow<List<ClientEntity>> = dao.observeClients()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val parametres: StateFlow<List<ParametreEntity>> = dao.observeParametres()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val ingredientsCatalogue: StateFlow<List<IngredientEntity>> = dao.observeIngredients()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val caveReleves: StateFlow<List<CaveReleveEntity>> = dao.observeCaveReleves()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val evaluations: StateFlow<List<ProjetEvaluationEntity>> = dao.observeEvaluations()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    init {
        viewModelScope.launch {
            InitialCatalogData.populateIfNeeded(dao)
        }
    }

    // --- Création d'un projet complet (Recette, Parties de découpe cochables, Lots par variante, Étapes, Courses) ---
    fun creerProjet(
        nomProjet: String,
        recetteComplete: RecetteComplete,
        dateDebutMillis: Long,
        quantiteBase: Double,
        prixUnitaireMatiere: Double,
        margePct: Double,
        codesSortiesCochees: Set<String>,
        lotsChoisis: List<LotDraft>,
        activerRappels: Boolean,
        activerRevente: Boolean = true,
        prixReventeUnitaireFixe: Double = 0.0
    ) {
        viewModelScope.launch {
            val r = recetteComplete.recette
            val typeProjet = if (recetteComplete.sortiesDecoupe.isNotEmpty()) "VALORISATION_CANARD" else "RECETTE_SIMPLE"
            val params = dao.getParametresList()
            val prixSelKg = params.find { it.cle == "PRIX_SEL_KG" }?.valeur ?: 1.0
            val prixEpicesKg = params.find { it.cle == "PRIX_EPICES_KG" }?.valeur ?: 25.0

            val projetId = dao.insertProjet(
                ProjetEntity(
                    nom = nomProjet.ifBlank { "${r.nom} (${quantiteBase.toInt()} ${r.uniteBase})" },
                    recettePrincipaleId = r.id,
                    nomRecettePrincipale = r.nom,
                    typeProjet = typeProjet,
                    dateDebutMillis = dateDebutMillis,
                    quantiteBasePrevue = quantiteBase,
                    quantiteBaseReelle = quantiteBase,
                    prixUnitaireMatiereBase = prixUnitaireMatiere,
                    margeTravailPct = margePct,
                    statut = "EN_COURS",
                    versionRecetteUtilisee = r.versionActuelle,
                    activerRevente = activerRevente,
                    prixReventeUnitaireFixe = prixReventeUnitaireFixe,
                    prixSelKg = prixSelKg,
                    prixEpicesKg = prixEpicesKg
                )
            )

            // 1. Sorties de découpe (parties cochées/décochées)
            if (recetteComplete.sortiesDecoupe.isNotEmpty()) {
                val sorties = recetteComplete.sortiesDecoupe.map { s ->
                    val estActif = s.codeSortie in codesSortiesCochees
                    val qPrevue = if (estActif) quantiteBase * s.rendementParUniteBase else 0.0
                    ProjetSortieDecoupeEntity(
                        projetId = projetId,
                        codeSortie = s.codeSortie,
                        nom = s.nom,
                        unite = s.unite,
                        actif = estActif,
                        quantitePrevue = qPrevue,
                        quantiteReelle = qPrevue,
                        valeurRefUnitaire = s.valeurRefBoutiqueUnitaire,
                        fraisTransfoUnitaire = s.fraisTransfoUnitaire
                    )
                }
                dao.insertProjetSorties(sorties)
            }

            // 2. Lots par variante (ex: 10 Paprika, 3 Café, 7 Fumé)
            val lotsValides = lotsChoisis.filter { it.quantite > 0.0 }
            val uniteLot = if (r.code == "VALORISATION_CANARD") "pièce" else r.uniteBase
            val nomProdLot = if (r.code == "VALORISATION_CANARD") "Magret séché" else r.nom
            val lotsEntities = if (lotsValides.isNotEmpty()) {
                lotsValides.map { l ->
                    ProjetLotEntity(
                        projetId = projetId,
                        nomProduit = nomProdLot,
                        variante = l.variante,
                        quantitePrevue = l.quantite,
                        quantiteReelle = l.quantite,
                        unite = uniteLot,
                        epicesUtiliseesGrammes = l.quantite * l.epicesGrammesParUnite,
                        dureeSalageHeures = l.dureeSalageHeures
                    )
                }
            } else {
                listOf(
                    ProjetLotEntity(
                        projetId = projetId,
                        nomProduit = nomProdLot,
                        variante = "Standard",
                        quantitePrevue = quantiteBase,
                        quantiteReelle = quantiteBase,
                        unite = uniteLot
                    )
                )
            }
            dao.insertProjetLots(lotsEntities)

            // 3. Étapes planifiées (les étapes propres à une variante ne sont incluses que si cette variante a une quantité > 0)
            val nomsVariantesPresentes = lotsEntities.map { it.variante.lowercase() }.toSet()
            val etapesFiltrees = recetteComplete.etapes.sortedBy { it.ordre }.filter { e ->
                e.varianteCible.isBlank() || nomsVariantesPresentes.any { it.contains(e.varianteCible.lowercase()) }
            }

            val etapesPlanifiees = etapesFiltrees.mapIndexed { idx, e ->
                val dureeEffective = if (e.modeDuree == "PAR_KG") {
                    (e.dureeMinutes * (quantiteBase / r.quantiteDefaut.coerceAtLeast(1.0))).toInt()
                } else {
                    e.dureeMinutes
                }
                val debutMillis = dateDebutMillis + (e.offsetDebutMinutes * 60_000L)
                val jourNum = (e.offsetDebutMinutes / 1440) + 1
                val jourLabel = if (jourNum <= 3) "Jour $jourNum" else "J+${jourNum - 1}"

                ProjetEtapeEntity(
                    projetId = projetId,
                    ordre = idx + 1,
                    jourLibelle = jourLabel,
                    titre = e.titre,
                    instructions = e.instructions,
                    astuce = e.astuce,
                    debutPrevuMillis = debutMillis,
                    dureeMinutes = dureeEffective,
                    varianteCible = e.varianteCible,
                    terminee = false,
                    rappelProgramme = activerRappels && e.rappelActifParDefaut
                )
            }
            dao.insertProjetEtapes(etapesPlanifiees)

            if (activerRappels) {
                val ctx = getApplication<Application>()
                val savedEtapes = dao.getEtapesForProjet(projetId)
                savedEtapes.filter { it.rappelProgramme }.forEach { etape ->
                    ReminderReceiver.planifierRappel(
                        context = ctx,
                        etapeId = etape.id,
                        timestampMillis = etape.debutPrevuMillis,
                        titre = "${nomProjet.ifBlank { r.nom }} · ${etape.titre}",
                        message = etape.instructions.lines().firstOrNull() ?: etape.titre
                    )
                }
            }

            // 4. Génération automatique de la liste de courses
            val coursesGenerees = mutableListOf<ProjetCourseEntity>()
            coursesGenerees.add(
                ProjetCourseEntity(
                    projetId = projetId,
                    nomProjet = nomProjet.ifBlank { r.nom },
                    nomIngredient = "${r.nom} (Matière première)",
                    categorie = "VIANDE",
                    quantiteRequise = quantiteBase,
                    unite = r.uniteBase,
                    prixEstimeTotal = quantiteBase * prixUnitaireMatiere
                )
            )
            recetteComplete.ingredients.forEach { ing ->
                val qTotale = when (ing.modeCalcul) {
                    "PAR_PIECE", "PAR_KG_MATIERE" -> ing.quantite * quantiteBase
                    "POURCENT_POIDS" -> ing.quantite * quantiteBase // ing.quantite est en g/kg (ex: 30g pour 3%)
                    "PAR_KG_MELEE" -> ing.quantite * quantiteBase
                    else -> ing.quantite
                }
                val uniteAffichee = if (ing.unite == "g" && qTotale >= 1000.0) "kg" else ing.unite
                val qAffichee = if (ing.unite == "g" && qTotale >= 1000.0) qTotale / 1000.0 else qTotale
                val coutEstime = if (ing.unite == "g") (qTotale / 1000.0) * ing.prixKgOuUniteEstime else qTotale * ing.prixKgOuUniteEstime
                coursesGenerees.add(
                    ProjetCourseEntity(
                        projetId = projetId,
                        nomProjet = nomProjet.ifBlank { r.nom },
                        nomIngredient = ing.nomIngredient,
                        categorie = if (ing.nomIngredient.contains("sel", true) || ing.nomIngredient.contains("sucre", true)) "SEL_SUCRE" else "EPICES",
                        quantiteRequise = qAffichee,
                        unite = uniteAffichee,
                        prixEstimeTotal = coutEstime
                    )
                )
            }
            // Ajouter le détail des épices par lot de variante
            lotsEntities.forEach { lot ->
                if (lot.epicesUtiliseesGrammes > 0 && lot.variante != "Standard") {
                    coursesGenerees.add(
                        ProjetCourseEntity(
                            projetId = projetId,
                            nomProjet = nomProjet.ifBlank { r.nom },
                            nomIngredient = "Épices lot ${lot.variante} (${lot.quantitePrevue.toInt()} ${lot.unite})",
                            categorie = "EPICES",
                            quantiteRequise = lot.epicesUtiliseesGrammes,
                            unite = "g",
                            prixEstimeTotal = (lot.epicesUtiliseesGrammes / 1000.0) * prixEpicesKg
                        )
                    )
                }
            }
            dao.insertProjetCourses(coursesGenerees)
        }
    }

    // --- Actions sur les étapes du planning (cocher, décaler horaires, rappel) ---
    fun basculerEtapeTerminee(etape: ProjetEtapeEntity) {
        viewModelScope.launch {
            val nouvelleTerminee = !etape.terminee
            dao.updateProjetEtape(etape.copy(terminee = nouvelleTerminee))
            val ctx = getApplication<Application>()
            if (nouvelleTerminee) {
                ReminderReceiver.annulerRappel(ctx, etape.id)
            } else if (etape.rappelProgramme && etape.debutPrevuMillis > System.currentTimeMillis()) {
                val nomProjet = dao.getProjetComplet(etape.projetId)?.projet?.nom ?: "L'Affinoir"
                ReminderReceiver.planifierRappel(
                    context = ctx,
                    etapeId = etape.id,
                    timestampMillis = etape.debutPrevuMillis,
                    titre = "$nomProjet · ${etape.titre}",
                    message = etape.instructions.lines().firstOrNull() ?: etape.titre
                )
            }
        }
    }

    /**
     * Décale l'étape sélectionnée et TOUTES les étapes suivantes du projet (comme dans Planning Week-end Canard v2.html)
     */
    fun decalerEtapeEtSuivantes(projetId: Long, ordreDepart: Int, deltaMinutes: Int) {
        viewModelScope.launch {
            val toutes = dao.getEtapesForProjet(projetId)
            val modifiees = toutes.map { e ->
                if (e.ordre >= ordreDepart) {
                    e.copy(debutPrevuMillis = e.debutPrevuMillis + deltaMinutes * 60_000L)
                } else e
            }
            dao.insertProjetEtapes(modifiees)

            val ctx = getApplication<Application>()
            val nomProjet = dao.getProjetComplet(projetId)?.projet?.nom ?: "L'Affinoir"
            val now = System.currentTimeMillis()
            modifiees.filter { it.ordre >= ordreDepart && it.rappelProgramme && !it.terminee }.forEach { e ->
                if (e.debutPrevuMillis > now) {
                    ReminderReceiver.planifierRappel(
                        context = ctx,
                        etapeId = e.id,
                        timestampMillis = e.debutPrevuMillis,
                        titre = "$nomProjet · ${e.titre}",
                        message = e.instructions.lines().firstOrNull() ?: e.titre
                    )
                } else {
                    ReminderReceiver.annulerRappel(ctx, e.id)
                }
            }
        }
    }

    fun demarrerEtapeMaintenant(projetId: Long, etape: ProjetEtapeEntity) {
        val diffMin = ((System.currentTimeMillis() - etape.debutPrevuMillis) / 60_000L).toInt()
        decalerEtapeEtSuivantes(projetId, etape.ordre, diffMin)
    }

    fun programmerRappelEtape(etape: ProjetEtapeEntity, nomProjet: String) {
        viewModelScope.launch {
            val misAJour = etape.copy(rappelProgramme = true)
            dao.updateProjetEtape(misAJour)
            ReminderReceiver.planifierRappel(
                context = getApplication(),
                etapeId = etape.id,
                timestampMillis = etape.debutPrevuMillis,
                titre = "$nomProjet · ${etape.titre}",
                message = etape.instructions.lines().firstOrNull() ?: etape.titre
            )
        }
    }

    // --- Sorties de découpe (cocher/décocher dispo + saisir quantités réellement obtenues) ---
    fun mettreAJourSortieDecoupe(
        sortie: ProjetSortieDecoupeEntity,
        actif: Boolean,
        quantiteReelle: Double,
        valeurRefUnitaire: Double,
        fraisTransfoUnitaire: Double,
        commentaire: String,
        prixReventeUnitaire: Double = sortie.prixReventeUnitaire
    ) {
        viewModelScope.launch {
            dao.updateProjetSortie(
                sortie.copy(
                    actif = actif,
                    quantiteReelle = quantiteReelle,
                    valeurRefUnitaire = valeurRefUnitaire,
                    fraisTransfoUnitaire = fraisTransfoUnitaire,
                    commentaireSortie = commentaire,
                    prixReventeUnitaire = prixReventeUnitaire
                )
            )
        }
    }

    fun mettreAJourSortiesDecoupeListe(sorties: List<ProjetSortieDecoupeEntity>) {
        viewModelScope.launch {
            sorties.forEach { s ->
                dao.updateProjetSortie(s)
            }
        }
    }

    // --- Lots / Variantes (quantités réelles, commentaires par type de magret, notes, pesées) ---
    fun mettreAJourLot(
        lot: ProjetLotEntity,
        quantiteReelle: Double,
        epicesGrammes: Double,
        dureeSalageHeures: Double,
        poidsInitialG: Double,
        poidsActuelG: Double,
        commentaire: String,
        noteSur5: Int
    ) {
        viewModelScope.launch {
            dao.updateProjetLot(
                lot.copy(
                    quantiteReelle = quantiteReelle,
                    epicesUtiliseesGrammes = epicesGrammes,
                    dureeSalageHeures = dureeSalageHeures,
                    poidsInitialGrammes = poidsInitialG,
                    poidsActuelGrammes = poidsActuelG,
                    commentaire = commentaire,
                    noteSur5 = noteSur5
                )
            )
            if (poidsInitialG > 0 && poidsActuelG > 0) {
                val perte = ((poidsInitialG - poidsActuelG) / poidsInitialG) * 100.0
                dao.insertProjetPesee(
                    ProjetPeseeEntity(
                        lotId = lot.id,
                        projetId = lot.projetId,
                        dateMillis = System.currentTimeMillis(),
                        poidsGrammes = poidsActuelG,
                        pertePct = perte,
                        note = commentaire
                    )
                )
            }
        }
    }

    fun ajouterLotAuProjet(
        projetId: Long,
        nomProduit: String,
        variante: String,
        quantite: Double,
        unite: String,
        commentaire: String
    ) {
        viewModelScope.launch {
            dao.insertProjetLot(
                ProjetLotEntity(
                    projetId = projetId,
                    nomProduit = nomProduit,
                    variante = variante,
                    quantitePrevue = quantite,
                    quantiteReelle = quantite,
                    unite = unite,
                    epicesUtiliseesGrammes = quantite * 15.0,
                    commentaire = commentaire
                )
            )
        }
    }

    fun supprimerLot(lot: ProjetLotEntity) {
        viewModelScope.launch { dao.deleteProjetLot(lot) }
    }

    // --- Paramètres financiers du projet ---
    fun mettreAJourParametresProjet(
        projet: ProjetEntity,
        quantiteBaseReelle: Double,
        prixUnitaireMatiere: Double,
        margePct: Double,
        prixSelKg: Double,
        prixEpicesKg: Double,
        statut: String,
        activerRevente: Boolean = projet.activerRevente,
        prixReventeUnitaireFixe: Double = projet.prixReventeUnitaireFixe
    ) {
        viewModelScope.launch {
            dao.updateProjet(
                projet.copy(
                    quantiteBaseReelle = quantiteBaseReelle,
                    prixUnitaireMatiereBase = prixUnitaireMatiere,
                    margeTravailPct = margePct,
                    prixSelKg = prixSelKg,
                    prixEpicesKg = prixEpicesKg,
                    statut = statut,
                    activerRevente = activerRevente,
                    prixReventeUnitaireFixe = prixReventeUnitaireFixe
                )
            )
        }
    }

    fun basculerReventeProjet(projet: ProjetEntity, activer: Boolean) {
        viewModelScope.launch {
            dao.updateProjet(projet.copy(activerRevente = activer))
        }
    }

    fun basculerOptionPrixGlobale(activer: Boolean) {
        viewModelScope.launch {
            dao.insertParametres(
                listOf(
                    ParametreEntity(
                        cle = "ACTIVER_PRIX",
                        libelle = "Gestion des prix & coûts",
                        categorie = "GENERAL",
                        valeur = if (activer) 1.0 else 0.0,
                        unite = "option",
                        description = "Afficher ou masquer tout ce qui concerne les prix, coûts et budgets"
                    )
                )
            )
        }
    }

    fun basculerOptionReventeGlobale(activer: Boolean) {
        viewModelScope.launch {
            dao.insertParametres(
                listOf(
                    ParametreEntity(
                        cle = "ACTIVER_REVENTE",
                        libelle = "Activer l'option Revente",
                        categorie = "GENERAL",
                        valeur = if (activer) 1.0 else 0.0,
                        unite = "option",
                        description = "Afficher ou masquer les éléments liés à la revente"
                    )
                )
            )
        }
    }

    fun masquerGuideDebutant() {
        viewModelScope.launch {
            dao.insertParametres(
                listOf(
                    ParametreEntity(
                        cle = "MASQUER_GUIDE_DEBUTANT",
                        libelle = "Masquer le guide débutant",
                        categorie = "INTERNE",
                        valeur = 1.0,
                        unite = "bool",
                        description = "1 si le guide de démarrage a été fermé"
                    )
                )
            )
        }
    }

    fun supprimerProjet(projet: ProjetEntity) {
        viewModelScope.launch {
            val ctx = getApplication<Application>()
            val etapes = dao.getEtapesForProjet(projet.id)
            etapes.forEach { ReminderReceiver.annulerRappel(ctx, it.id) }
            withContext(Dispatchers.IO) {
                dao.getPhotosForProjet(projet.id).forEach { photo ->
                    PhotoStorageHelper.supprimerFichierPhoto(photo.cheminFichier)
                }
            }
            dao.deleteProjet(projet)
        }
    }

    // --- Photos par étape ---
    fun creerUriPhotoCamera(): Uri = PhotoStorageHelper.creerUriPhotoCamera(getApplication())

    fun ajouterPhotosEtape(projetId: Long, etapeId: Long, uris: List<Uri>) {
        if (uris.isEmpty()) return
        viewModelScope.launch {
            withContext(Dispatchers.IO) {
                val app = getApplication<Application>()
                uris.forEach { uri ->
                    val savedFile = PhotoStorageHelper.compresserEtEnregistrerPhoto(app, etapeId, uri)
                    if (savedFile != null) {
                        dao.insertProjetEtapePhoto(
                            ProjetEtapePhotoEntity(
                                etapeId = etapeId,
                                projetId = projetId,
                                cheminFichier = savedFile.absolutePath,
                                tailleOctets = savedFile.length(),
                                dateAjoutMillis = System.currentTimeMillis()
                            )
                        )
                    }
                }
            }
        }
    }

    fun supprimerPhotoEtape(photo: ProjetEtapePhotoEntity) {
        viewModelScope.launch {
            withContext(Dispatchers.IO) {
                PhotoStorageHelper.supprimerFichierPhoto(photo.cheminFichier)
            }
            dao.deleteProjetEtapePhoto(photo)
        }
    }

    // --- Commandes & Paiements Amis ---
    fun enregistrerCommandeDetaillee(
        projetId: Long,
        nomAcheteur: String,
        lignes: List<LigneCommandeItem>,
        paye: Boolean,
        moyenPaiement: String,
        livre: Boolean,
        commentaire: String
    ) {
        val lignesValides = lignes.filter { it.produit.isNotBlank() && it.quantite > 0.0 }
        if (lignesValides.isEmpty()) return
        val totalQte = lignesValides.sumOf { it.quantite }
        val totalMontant = lignesValides.sumOf { it.sousTotal }
        val resumeProd = if (lignesValides.size == 1) {
            lignesValides.first().produit.trim()
        } else {
            formaterResumeLignesCommande(lignesValides)
        }
        val unitePrincipale = if (lignesValides.size == 1) lignesValides.first().unite else "articles"
        val prixUnitMoyen = if (lignesValides.size == 1) lignesValides.first().prixUnitaire else (totalMontant / totalQte.coerceAtLeast(1.0))

        viewModelScope.launch {
            enregistrerClientSiNouveau(nomAcheteur)
            dao.insertProjetCommande(
                ProjetCommandeEntity(
                    projetId = projetId,
                    nomAcheteur = nomAcheteur.trim(),
                    produit = resumeProd,
                    quantite = totalQte,
                    unite = unitePrincipale,
                    prixUnitaire = prixUnitMoyen,
                    montantTotal = totalMontant,
                    paye = paye,
                    moyenPaiement = moyenPaiement.trim(),
                    livre = livre,
                    commentaire = commentaire.trim(),
                    detailsLignes = encoderLignesCommande(lignesValides)
                )
            )
        }
    }

    fun modifierCommandeDetaillee(
        commandeOrigine: ProjetCommandeEntity,
        projetId: Long = commandeOrigine.projetId,
        nomAcheteur: String,
        lignes: List<LigneCommandeItem>,
        paye: Boolean,
        moyenPaiement: String,
        livre: Boolean,
        commentaire: String
    ) {
        val lignesValides = lignes.filter { it.produit.isNotBlank() && it.quantite > 0.0 }
        if (lignesValides.isEmpty()) return
        val totalQte = lignesValides.sumOf { it.quantite }
        val totalMontant = lignesValides.sumOf { it.sousTotal }
        val resumeProd = if (lignesValides.size == 1) {
            lignesValides.first().produit.trim()
        } else {
            formaterResumeLignesCommande(lignesValides)
        }
        val unitePrincipale = if (lignesValides.size == 1) lignesValides.first().unite else "articles"
        val prixUnitMoyen = if (lignesValides.size == 1) lignesValides.first().prixUnitaire else (totalMontant / totalQte.coerceAtLeast(1.0))

        viewModelScope.launch {
            enregistrerClientSiNouveau(nomAcheteur)
            dao.updateProjetCommande(
                commandeOrigine.copy(
                    projetId = projetId,
                    nomAcheteur = nomAcheteur.trim(),
                    produit = resumeProd,
                    quantite = totalQte,
                    unite = unitePrincipale,
                    prixUnitaire = prixUnitMoyen,
                    montantTotal = totalMontant,
                    paye = paye,
                    moyenPaiement = moyenPaiement.trim(),
                    livre = livre,
                    commentaire = commentaire.trim(),
                    detailsLignes = encoderLignesCommande(lignesValides)
                )
            )
        }
    }

    fun basculerCommandePayee(cmd: ProjetCommandeEntity) {
        viewModelScope.launch { dao.updateProjetCommande(cmd.copy(paye = !cmd.paye)) }
    }

    fun basculerCommandeLivree(cmd: ProjetCommandeEntity) {
        viewModelScope.launch { dao.updateProjetCommande(cmd.copy(livre = !cmd.livre)) }
    }

    fun supprimerCommande(cmd: ProjetCommandeEntity) {
        viewModelScope.launch { dao.deleteProjetCommande(cmd) }
    }

    // --- Clients ---
    private suspend fun enregistrerClientSiNouveau(nom: String) {
        val nomPropre = nom.trim()
        if (nomPropre.isBlank()) return
        val existants = dao.getAllClientsOnce()
        if (existants.none { it.nom.trim().equals(nomPropre, ignoreCase = true) }) {
            dao.insertClient(ClientEntity(nom = nomPropre))
        }
    }

    fun ajouterClient(nom: String) {
        val nomPropre = nom.trim()
        if (nomPropre.isBlank()) return
        viewModelScope.launch {
            enregistrerClientSiNouveau(nomPropre)
        }
    }

    fun modifierClient(client: ClientEntity, nouveauNom: String) {
        val nomPropre = nouveauNom.trim()
        if (nomPropre.isBlank()) return
        viewModelScope.launch {
            val ancienNom = client.nom.trim()
            dao.updateClient(client.copy(nom = nomPropre))
            if (ancienNom.isNotBlank() && ancienNom != nomPropre) {
                dao.renommerAcheteurDansCommandes(ancienNom, nomPropre)
            }
        }
    }

    fun supprimerClient(client: ClientEntity) {
        viewModelScope.launch { dao.deleteClient(client) }
    }

    // --- Courses ---
    fun basculerCourseAchetee(course: ProjetCourseEntity, prixReel: Double? = null) {
        viewModelScope.launch {
            dao.updateProjetCourse(
                course.copy(
                    achete = !course.achete,
                    prixReelPaye = prixReel ?: course.prixReelPaye
                )
            )
        }
    }

    fun modifierCourse(course: ProjetCourseEntity, nomIngredient: String, quantite: Double, unite: String, prixEstime: Double) {
        viewModelScope.launch {
            dao.updateProjetCourse(
                course.copy(
                    nomIngredient = nomIngredient,
                    quantiteRequise = quantite,
                    unite = unite,
                    prixEstimeTotal = prixEstime
                )
            )
        }
    }

    fun supprimerCourse(course: ProjetCourseEntity) {
        viewModelScope.launch {
            dao.deleteProjetCourse(course)
        }
    }

    fun supprimerToutesLesCoursesAchetees() {
        viewModelScope.launch {
            dao.deleteCoursesAchetees()
        }
    }

    fun supprimerCoursesAcheteesProjet(projetId: Long) {
        viewModelScope.launch {
            dao.deleteCoursesAcheteesPourProjet(projetId)
        }
    }

    fun ajouterCourseManuelle(projetId: Long?, nomProjet: String, nomIngredient: String, quantite: Double, unite: String, prixEstime: Double) {
        viewModelScope.launch {
            dao.insertProjetCourse(
                ProjetCourseEntity(
                    projetId = projetId,
                    nomProjet = nomProjet,
                    nomIngredient = nomIngredient,
                    categorie = "AUTRE",
                    quantiteRequise = quantite,
                    unite = unite,
                    prixEstimeTotal = prixEstime
                )
            )
        }
    }

    // --- Évolution et ajustement des Recettes (ex: Salage 24h -> 18h suite à un retour d'expérience) ---
    fun ajusterEtapeRecette(recette: RecetteEntity, etape: RecetteEtapeEntity, nouveauTitre: String, nouvelleDureeMinutes: Int, nouvellesInstructions: String, motifVersion: String) {
        viewModelScope.launch {
            dao.updateRecetteEtape(
                etape.copy(
                    titre = nouveauTitre,
                    dureeMinutes = nouvelleDureeMinutes,
                    instructions = nouvellesInstructions
                )
            )
            if (motifVersion.isNotBlank()) {
                val nextVer = recette.versionActuelle + 1
                val nouvelHistorique = "${recette.historiqueVersions}\nv$nextVer : $motifVersion"
                dao.updateRecette(recette.copy(versionActuelle = nextVer, historiqueVersions = nouvelHistorique))
            }
        }
    }

    fun ameliorerRecetteDepuisLot(
        recette: RecetteEntity,
        etapeModifiee: RecetteEtapeEntity?,
        nouvelleDureeEtapeMinutes: Int?,
        nouvellesInstructionsEtape: String?,
        varianteExistante: RecetteVarianteEntity?,
        nomVariante: String,
        nouveauxEpicesGrammes: Double,
        nouvelleDureeSalageHeures: Double,
        nouvellePerteCiblePct: Double,
        motifVersion: String
    ) {
        viewModelScope.launch {
            if (etapeModifiee != null && nouvelleDureeEtapeMinutes != null) {
                dao.updateRecetteEtape(
                    etapeModifiee.copy(
                        dureeMinutes = nouvelleDureeEtapeMinutes,
                        instructions = nouvellesInstructionsEtape ?: etapeModifiee.instructions
                    )
                )
            }
            if (varianteExistante != null) {
                dao.updateRecetteVariante(
                    varianteExistante.copy(
                        epicesGrammesParUnite = nouveauxEpicesGrammes,
                        dureeSalageHeuresSpecifique = nouvelleDureeSalageHeures
                    )
                )
            } else if (nomVariante.isNotBlank()) {
                dao.insertRecetteVariante(
                    RecetteVarianteEntity(
                        recetteId = recette.id,
                        nom = nomVariante.trim(),
                        descriptionEpices = "Assaisonnement lot $nomVariante",
                        epicesGrammesParUnite = nouveauxEpicesGrammes,
                        dureeSalageHeuresSpecifique = nouvelleDureeSalageHeures
                    )
                )
            }
            val nextVer = recette.versionActuelle + 1
            val notePropre = motifVersion.ifBlank { "Retour d'expérience lot $nomVariante" }
            val nouvelHistorique = "${recette.historiqueVersions}\nv$nextVer : $notePropre"
            dao.updateRecette(
                recette.copy(
                    perteCiblePct = if (nouvellePerteCiblePct > 0.0) nouvellePerteCiblePct else recette.perteCiblePct,
                    versionActuelle = nextVer,
                    historiqueVersions = nouvelHistorique
                )
            )
        }
    }

    fun ajusterIngredientRecette(recette: RecetteEntity, ingredient: RecetteIngredientEntity, nouvelleQuantite: Double, motifVersion: String) {
        viewModelScope.launch {
            dao.updateRecetteIngredient(ingredient.copy(quantite = nouvelleQuantite))
            if (motifVersion.isNotBlank()) {
                val nextVer = recette.versionActuelle + 1
                val nouvelHistorique = "${recette.historiqueVersions}\nv$nextVer : $motifVersion"
                dao.updateRecette(recette.copy(versionActuelle = nextVer, historiqueVersions = nouvelHistorique))
            }
        }
    }

    fun ajouterVarianteRecette(recetteId: Long, nom: String, description: String, epicesG: Double, salageH: Double?, fumage: Boolean) {
        viewModelScope.launch {
            dao.insertRecetteVariante(
                RecetteVarianteEntity(
                    recetteId = recetteId,
                    nom = nom,
                    descriptionEpices = description,
                    epicesGrammesParUnite = epicesG,
                    dureeSalageHeuresSpecifique = salageH,
                    ajouteEtapeFumage = fumage
                )
            )
        }
    }

    fun modifierVarianteRecette(variante: RecetteVarianteEntity) {
        viewModelScope.launch {
            dao.updateRecetteVariante(variante)
        }
    }

    fun supprimerVarianteRecette(variante: RecetteVarianteEntity) {
        viewModelScope.launch {
            dao.deleteRecetteVariante(variante)
        }
    }

    fun basculerMasquageRecette(recette: RecetteEntity) {
        viewModelScope.launch {
            dao.updateRecette(recette.copy(masquee = !recette.masquee))
        }
    }

    fun supprimerRecette(recette: RecetteEntity) {
        viewModelScope.launch {
            dao.deleteRecette(recette)
        }
    }

    data class DraftIngredient(
        val nom: String,
        val quantite: Double,
        val unite: String,
        val prixEstime: Double = 0.0
    )

    data class DraftEtape(
        val titre: String,
        val instructions: String,
        val dureeHeures: Double
    )

    fun creerRecetteCompletePersonnalisee(
        nom: String,
        famille: String,
        typeRecette: String,
        uniteBase: String,
        quantiteDefaut: Double,
        perteCiblePct: Double,
        tempCoeurCible: Double,
        conditionsConservation: String,
        pointsVigilance: String,
        description: String,
        ingredients: List<DraftIngredient>,
        etapes: List<DraftEtape>,
        variantes: List<String>
    ) {
        viewModelScope.launch {
            val codeUnique = "CUSTOM_${System.currentTimeMillis()}"
            val recetteId = dao.insertRecette(
                RecetteEntity(
                    code = codeUnique,
                    nom = nom.trim(),
                    famille = famille,
                    typeRecette = typeRecette,
                    uniteBase = uniteBase.ifBlank { "kg" },
                    quantiteDefaut = quantiteDefaut.coerceAtLeast(1.0),
                    perteCiblePct = perteCiblePct,
                    tempCoeurCible = tempCoeurCible,
                    conditionsConservation = conditionsConservation.trim(),
                    pointsVigilance = pointsVigilance.trim(),
                    description = description.trim(),
                    versionActuelle = 1,
                    historiqueVersions = "v1 : Création personnalisée",
                    masquee = false
                )
            )

            // Ingrédients
            val ingsEntities = if (ingredients.isNotEmpty()) {
                ingredients.map { ing ->
                    RecetteIngredientEntity(
                        recetteId = recetteId,
                        nomIngredient = ing.nom.trim(),
                        modeCalcul = if (ing.unite == "%") "POURCENT_POIDS" else "PAR_KG_MATIERE",
                        quantite = ing.quantite,
                        unite = ing.unite,
                        prixKgOuUniteEstime = ing.prixEstime
                    )
                }
            } else {
                listOf(
                    RecetteIngredientEntity(
                        recetteId = recetteId,
                        nomIngredient = "Sel de salaison",
                        modeCalcul = "POURCENT_POIDS",
                        quantite = 30.0,
                        unite = "g",
                        prixKgOuUniteEstime = 1.5
                    )
                )
            }
            dao.insertRecetteIngredients(ingsEntities)

            // Variantes
            val varsEntities = if (variantes.isNotEmpty()) {
                variantes.map { vNom ->
                    RecetteVarianteEntity(
                        recetteId = recetteId,
                        nom = vNom.trim(),
                        descriptionEpices = "Assaisonnement lot $vNom",
                        epicesGrammesParUnite = 15.0,
                        dureeSalageHeuresSpecifique = 24.0,
                        ajouteEtapeFumage = vNom.contains("fum", ignoreCase = true)
                    )
                }
            } else {
                listOf(
                    RecetteVarianteEntity(
                        recetteId = recetteId,
                        nom = "Traditionnelle",
                        descriptionEpices = "Assaisonnement classique",
                        epicesGrammesParUnite = 15.0,
                        dureeSalageHeuresSpecifique = 24.0
                    )
                )
            }
            dao.insertRecetteVariantes(varsEntities)

            // Étapes
            val etapesEntities = if (etapes.isNotEmpty()) {
                etapes.mapIndexed { idx, et ->
                    RecetteEtapeEntity(
                        recetteId = recetteId,
                        ordre = idx + 1,
                        titre = et.titre.trim(),
                        instructions = et.instructions.trim(),
                        offsetDebutMinutes = if (idx == 0) 0 else idx * 1440,
                        dureeMinutes = (et.dureeHeures * 60).toInt().coerceAtLeast(15)
                    )
                }
            } else {
                listOf(
                    RecetteEtapeEntity(
                        recetteId = recetteId,
                        ordre = 1,
                        titre = "1. Salage et assaisonnement",
                        instructions = "Saler uniformément la matière première et laisser reposer au frais.",
                        offsetDebutMinutes = 0,
                        dureeMinutes = 1440
                    ),
                    RecetteEtapeEntity(
                        recetteId = recetteId,
                        ordre = 2,
                        titre = "2. Séchage et affinage",
                        instructions = "Placer au séchoir ventilé ou en torchon sec jusqu'à la perte de poids cible.",
                        offsetDebutMinutes = 1440,
                        dureeMinutes = 30240
                    )
                )
            }
            dao.insertRecetteEtapes(etapesEntities)
        }
    }

    // --- Paramètres de base modifiables ---
    fun modifierParametreBase(param: ParametreEntity, nouvelleValeur: Double) {
        viewModelScope.launch {
            dao.updateParametre(param.copy(valeur = nouvelleValeur))
        }
    }

    fun modifierPrixIngredientCatalogue(ing: IngredientEntity, nouveauPrix: Double) {
        viewModelScope.launch {
            dao.updateIngredient(ing.copy(prixUnitaire = nouveauPrix))
        }
    }

    // --- Pesées historiques ---
    fun ajouterPeseeHistoriqueLot(
        lot: ProjetLotEntity,
        poidsInitialG: Double,
        poidsActuelG: Double,
        dateMillis: Long = System.currentTimeMillis(),
        note: String = ""
    ) {
        viewModelScope.launch {
            val pInit = if (poidsInitialG > 0.0) poidsInitialG else lot.poidsInitialGrammes
            dao.updateProjetLot(
                lot.copy(
                    poidsInitialGrammes = pInit,
                    poidsActuelGrammes = poidsActuelG,
                    commentaire = if (note.isNotBlank()) note else lot.commentaire
                )
            )
            if (pInit > 0.0 && poidsActuelG > 0.0) {
                val perte = ((pInit - poidsActuelG) / pInit) * 100.0
                dao.insertProjetPesee(
                    ProjetPeseeEntity(
                        lotId = lot.id,
                        projetId = lot.projetId,
                        dateMillis = dateMillis,
                        poidsGrammes = poidsActuelG,
                        pertePct = perte,
                        note = note
                    )
                )
            }
        }
    }

    fun supprimerPeseeLot(pesee: ProjetPeseeEntity, lot: ProjetLotEntity, restantes: List<ProjetPeseeEntity>) {
        viewModelScope.launch {
            dao.deleteProjetPesee(pesee)
            val dernierPoids = restantes.filter { it.id != pesee.id }.maxByOrNull { it.dateMillis }?.poidsGrammes ?: 0.0
            dao.updateProjetLot(lot.copy(poidsActuelGrammes = dernierPoids))
        }
    }

    // --- Journal de Cave ---
    fun ajouterReleveCave(temperature: Double, hygrometrie: Double, dateMillis: Long, note: String) {
        viewModelScope.launch {
            dao.insertCaveReleve(
                CaveReleveEntity(
                    dateMillis = dateMillis,
                    temperature = temperature,
                    hygrometrie = hygrometrie,
                    note = note.trim()
                )
            )
        }
    }

    fun supprimerReleveCave(releve: CaveReleveEntity) {
        viewModelScope.launch {
            dao.deleteCaveReleve(releve)
        }
    }

    // --- Fiche d'évaluation & Dégustation ---
    fun enregistrerEvaluationProjet(
        projet: ProjetEntity,
        noteGlobale: Int,
        texture: String,
        salinite: String,
        aromes: String,
        commentaire: String
    ) {
        viewModelScope.launch {
            dao.deleteEvaluationForProjet(projet.id)
            dao.insertEvaluation(
                ProjetEvaluationEntity(
                    projetId = projet.id,
                    recetteId = projet.recettePrincipaleId,
                    nomRecette = projet.nomRecettePrincipale,
                    dateMillis = System.currentTimeMillis(),
                    noteGlobale = noteGlobale.coerceIn(1, 5),
                    texture = texture,
                    salinite = salinite,
                    aromes = aromes,
                    commentaire = commentaire.trim()
                )
            )
        }
    }

    fun getDerniereEvaluationRecette(recetteId: Long, nomRecette: String): ProjetEvaluationEntity? {
        return evaluations.value
            .filter { it.recetteId == recetteId || it.nomRecette.equals(nomRecette, ignoreCase = true) }
            .maxByOrNull { it.dateMillis }
    }

    // --- Export / Import JSON Mobile (Compatible Android & PWA) ---
    fun exporterDonneesJson(uri: Uri, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            try {
                val message = withContext(Dispatchers.IO) {
                    BackupManager.exporterDonneesJson(getApplication(), dao, uri)
                }
                onResult(true, message)
            } catch (e: Exception) {
                onResult(false, "Erreur d'export : ${e.message}")
            }
        }
    }

    fun importerDonneesJson(uri: Uri, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            try {
                val message = withContext(Dispatchers.IO) {
                    BackupManager.importerDonneesJson(getApplication(), db, dao, uri)
                }
                onResult(true, message)
            } catch (e: Exception) {
                onResult(false, "Erreur d'import : ${e.message}")
            }
        }
    }
}
