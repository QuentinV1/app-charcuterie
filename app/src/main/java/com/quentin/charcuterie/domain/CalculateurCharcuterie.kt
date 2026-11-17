package com.quentin.charcuterie.domain

import com.quentin.charcuterie.data.ProjetComplet
import com.quentin.charcuterie.data.ProjetLotEntity
import com.quentin.charcuterie.data.ProjetPeseeEntity
import com.quentin.charcuterie.data.RecetteComplete
import com.quentin.charcuterie.data.RecetteEntity
import kotlin.math.ceil
import kotlin.math.max

data class EstimationPrixPlanification(
    val nomProduitPrincipal: String,
    val uniteProduitPrincipal: String,
    val coutRevientUnitaireEstime: Double,
    val prixReventeConseilleUnitaire: Double
)

data class LigneRentabiliteProduit(
    val codeSortie: String,
    val nom: String,
    val unite: String,
    val actif: Boolean,
    val quantitePrevue: Double,
    val quantiteReelle: Double,
    val valeurRefUnitaire: Double,
    val valeurRefTotale: Double,
    val partMatierePremiere: Double,
    val fraisTransfoTotaux: Double,
    val coutRevientTotal: Double,
    val coutRevientUnitaire: Double,
    val prixReventeConseilleUnitaire: Double,
    val partPourcentageMatiere: Double
)

data class BilanFinancierProjet(
    val coutMatierePremiereTotal: Double,
    val coutIngredientsEtFraisTotal: Double,
    val coutRevientGlobal: Double,
    val valeurRefBoutiqueGlobale: Double,
    val economieRealiseeVsBoutique: Double,
    val chiffreAffairesPotentielSiToutVendu: Double,
    val margePotentielleTravail: Double,
    val totalCommandesAmis: Double,
    val totalPayeParAmis: Double,
    val resteAPayerParAmis: Double,
    val lignesProduits: List<LigneRentabiliteProduit>,
    val resumeGraisse: String
)

object CalculateurCharcuterie {

    /**
     * Calcule la répartition du coût d'achat (ex: 10 canards à 18€ = 180€) au prorata de la valeur
     * de référence boutique des seules parties COCHÉES (actives), et utilise les quantités RÉELLES obtenues.
     */
    fun calculerBilanProjet(projetComplet: ProjetComplet): BilanFinancierProjet {
        val p = projetComplet.projet
        val qBase = if (p.quantiteBaseReelle > 0.0) p.quantiteBaseReelle else p.quantiteBasePrevue
        val coutMatierePremiere = qBase * p.prixUnitaireMatiereBase
        val margeCoef = 1.0 + (p.margeTravailPct / 100.0)

        val sortiesActives = projetComplet.sortiesDecoupe.filter { it.actif && it.quantiteReelle > 0.0 }

        if (sortiesActives.isEmpty()) {
            // Projet simple sans découpe multi-sorties
            val totalLots = projetComplet.lots.sumOf { if (it.quantiteReelle > 0) it.quantiteReelle else it.quantitePrevue }.coerceAtLeast(1.0)
            val coutCoursesHorsViande = projetComplet.courses
                .filter { it.categorie != "VIANDE" }
                .sumOf { if (it.prixReelPaye > 0) it.prixReelPaye else it.prixEstimeTotal }
            val coutTotal = coutMatierePremiere + coutCoursesHorsViande
            val coutUnit = coutTotal / totalLots
            val prixUnit = if (p.prixReventeUnitaireFixe > 0.0) p.prixReventeUnitaireFixe else (coutUnit * margeCoef)
            val refGlobale = coutTotal * 1.6

            val cmdTotal = projetComplet.commandes.sumOf { it.montantTotal }
            val cmdPaye = projetComplet.commandes.filter { it.paye }.sumOf { it.montantTotal }

            val ligneUnique = LigneRentabiliteProduit(
                codeSortie = "principal",
                nom = p.nomRecettePrincipale,
                unite = projetComplet.lots.firstOrNull()?.unite ?: "kg",
                actif = true,
                quantitePrevue = p.quantiteBasePrevue,
                quantiteReelle = totalLots,
                valeurRefUnitaire = coutUnit * 1.6,
                valeurRefTotale = refGlobale,
                partMatierePremiere = coutMatierePremiere,
                fraisTransfoTotaux = coutCoursesHorsViande,
                coutRevientTotal = coutTotal,
                coutRevientUnitaire = coutUnit,
                prixReventeConseilleUnitaire = prixUnit,
                partPourcentageMatiere = 100.0
            )
            return BilanFinancierProjet(
                coutMatierePremiereTotal = coutMatierePremiere,
                coutIngredientsEtFraisTotal = coutCoursesHorsViande,
                coutRevientGlobal = coutTotal,
                valeurRefBoutiqueGlobale = refGlobale,
                economieRealiseeVsBoutique = refGlobale - coutTotal,
                chiffreAffairesPotentielSiToutVendu = prixUnit * totalLots,
                margePotentielleTravail = (prixUnit * totalLots) - coutTotal,
                totalCommandesAmis = cmdTotal,
                totalPayeParAmis = cmdPaye,
                resteAPayerParAmis = max(0.0, cmdTotal - cmdPaye),
                lignesProduits = listOf(ligneUnique),
                resumeGraisse = ""
            )
        }

        // Calcul de la valeur de référence totale des parties cochées (actives)
        val valeurRefTotale = sortiesActives.sumOf { it.quantiteReelle * it.valeurRefUnitaire }.coerceAtLeast(0.01)

        var coutIngredientsGlobal = 0.0
        var coutRevientGlobal = 0.0
        var caPotentielGlobal = 0.0

        val lignes = projetComplet.sortiesDecoupe.map { s ->
            if (!s.actif || s.quantiteReelle <= 0.0) {
                LigneRentabiliteProduit(
                    codeSortie = s.codeSortie,
                    nom = s.nom,
                    unite = s.unite,
                    actif = s.actif,
                    quantitePrevue = s.quantitePrevue,
                    quantiteReelle = s.quantiteReelle,
                    valeurRefUnitaire = s.valeurRefUnitaire,
                    valeurRefTotale = 0.0,
                    partMatierePremiere = 0.0,
                    fraisTransfoTotaux = 0.0,
                    coutRevientTotal = 0.0,
                    coutRevientUnitaire = 0.0,
                    prixReventeConseilleUnitaire = 0.0,
                    partPourcentageMatiere = 0.0
                )
            } else {
                val refTot = s.quantiteReelle * s.valeurRefUnitaire
                val partRatio = refTot / valeurRefTotale
                val partMatiere = coutMatierePremiere * partRatio

                // Pour les magrets, frais = sel (0.5 kg/magret en recouvrement, 0.015 kg sous vide) + épices (0.015 kg/magret)
                val fraisTotaux = if (s.codeSortie == "magret") {
                    val selKgPerMagret = if (p.modeSalage == ModeSalage.SOUS_VIDE.code) 0.015 else 0.50
                    val selKg = s.quantiteReelle * selKgPerMagret
                    val epicesKg = s.quantiteReelle * 0.015
                    selKg * p.prixSelKg + epicesKg * p.prixEpicesKg
                } else {
                    s.quantiteReelle * s.fraisTransfoUnitaire
                }

                val coutRevient = partMatiere + fraisTotaux
                val coutUnit = coutRevient / s.quantiteReelle
                val prixUnit = when {
                    s.prixReventeUnitaire > 0.0 -> s.prixReventeUnitaire
                    s.codeSortie == "magret" && p.prixReventeUnitaireFixe > 0.0 -> p.prixReventeUnitaireFixe
                    else -> coutUnit * margeCoef
                }

                coutIngredientsGlobal += fraisTotaux
                coutRevientGlobal += coutRevient
                caPotentielGlobal += prixUnit * s.quantiteReelle

                LigneRentabiliteProduit(
                    codeSortie = s.codeSortie,
                    nom = s.nom,
                    unite = s.unite,
                    actif = true,
                    quantitePrevue = s.quantitePrevue,
                    quantiteReelle = s.quantiteReelle,
                    valeurRefUnitaire = s.valeurRefUnitaire,
                    valeurRefTotale = refTot,
                    partMatierePremiere = partMatiere,
                    fraisTransfoTotaux = fraisTotaux,
                    coutRevientTotal = coutRevient,
                    coutRevientUnitaire = coutUnit,
                    prixReventeConseilleUnitaire = prixUnit,
                    partPourcentageMatiere = partRatio * 100.0
                )
            }
        }

        // Budget graisse pour les projets Canard
        val graisseSortie = projetComplet.sortiesDecoupe.find { it.codeSortie == "graisse" && it.actif }
        val cuissesSortie = projetComplet.sortiesDecoupe.find { it.codeSortie == "cuisse" && it.actif }
        val rillettesSortie = projetComplet.sortiesDecoupe.find { it.codeSortie == "rillettes" && it.actif }
        val resumeGraisse = if (graisseSortie != null) {
            val gTot = graisseSortie.quantiteReelle
            val gConfit = (cuissesSortie?.quantiteReelle ?: 0.0) * 0.15
            val gRill = (rillettesSortie?.quantiteReelle ?: 0.0) * 0.40
            val surplus = max(0.0, gTot - gConfit - gRill)
            "Graisse obtenue : %.1f %s (dont ~%.1f kg utilisés pour confire les cuisses, ~%.1f kg pour les rillettes → ~%.1f %s de surplus net en pot)".format(
                gTot, graisseSortie.unite, gConfit, gRill, surplus, graisseSortie.unite
            )
        } else ""

        val cmdTotal = projetComplet.commandes.sumOf { it.montantTotal }
        val cmdPaye = projetComplet.commandes.filter { it.paye }.sumOf { it.montantTotal }

        return BilanFinancierProjet(
            coutMatierePremiereTotal = coutMatierePremiere,
            coutIngredientsEtFraisTotal = coutIngredientsGlobal,
            coutRevientGlobal = coutRevientGlobal,
            valeurRefBoutiqueGlobale = valeurRefTotale,
            economieRealiseeVsBoutique = valeurRefTotale - coutRevientGlobal,
            chiffreAffairesPotentielSiToutVendu = caPotentielGlobal,
            margePotentielleTravail = caPotentielGlobal - coutRevientGlobal,
            totalCommandesAmis = cmdTotal,
            totalPayeParAmis = cmdPaye,
            resteAPayerParAmis = max(0.0, cmdTotal - cmdPaye),
            lignesProduits = lignes,
            resumeGraisse = resumeGraisse
        )
    }

    /**
     * Estime le coût de revient unitaire et le prix de revente conseillé lors de la planification d'un projet.
     */
    fun estimerPrixUnitairePlanification(
        recetteComplete: RecetteComplete,
        quantiteBase: Double,
        prixUnitaireMatiere: Double,
        codesSortiesCochees: Set<String>,
        majorationDefautPct: Double = 10.0,
        prixSelKg: Double = 1.0,
        prixEpicesKg: Double = 25.0,
        modeSalage: ModeSalage = ModeSalage.RECOUVREMENT_SEL
    ): EstimationPrixPlanification {
        val qBase = quantiteBase.coerceAtLeast(0.1)
        val coutMatiere = qBase * prixUnitaireMatiere
        val coef = 1.0 + (majorationDefautPct / 100.0)

        val sortiesActives = recetteComplete.sortiesDecoupe.filter { it.codeSortie in codesSortiesCochees }
        if (sortiesActives.isNotEmpty()) {
            val valeurRefTot = sortiesActives.sumOf { (qBase * it.rendementParUniteBase) * it.valeurRefBoutiqueUnitaire }.coerceAtLeast(0.01)
            val cible = sortiesActives.find { it.codeSortie == "magret" } ?: sortiesActives.first()
            val qProduit = (qBase * cible.rendementParUniteBase).coerceAtLeast(0.1)
            val refTotCible = qProduit * cible.valeurRefBoutiqueUnitaire
            val partMatiere = coutMatiere * (refTotCible / valeurRefTot)
            val selKgPerMagret = if (modeSalage == ModeSalage.SOUS_VIDE) 0.015 else 0.50
            val fraisTot = if (cible.codeSortie == "magret") {
                qProduit * (selKgPerMagret * prixSelKg + 0.015 * prixEpicesKg)
            } else {
                qProduit * cible.fraisTransfoUnitaire
            }
            val coutUnit = (partMatiere + fraisTot) / qProduit
            return EstimationPrixPlanification(
                nomProduitPrincipal = cible.nom,
                uniteProduitPrincipal = cible.unite,
                coutRevientUnitaireEstime = coutUnit,
                prixReventeConseilleUnitaire = coutUnit * coef
            )
        }

        val poidsKgParUnite = poidsUnitaireKgPourRecette(recetteComplete.recette)
        val coutIngredients = recetteComplete.ingredients.sumOf { ing ->
            val qTot = when (ing.modeCalcul) {
                "POURCENT_POIDS" -> {
                    val facteurPct = if (ing.unite == "%") 10.0 else 1.0
                    ing.quantite * facteurPct * qBase * poidsKgParUnite
                }
                "PAR_PIECE", "PAR_KG_MATIERE", "PAR_KG_MELEE" -> ing.quantite * qBase
                else -> ing.quantite
            }
            val uniteCalc = if (ing.modeCalcul == "POURCENT_POIDS" && ing.unite == "%") "g" else ing.unite
            if (uniteCalc == "g") (qTot / 1000.0) * ing.prixKgOuUniteEstime else qTot * ing.prixKgOuUniteEstime
        }
        val coutUnit = (coutMatiere + coutIngredients) / qBase
        return EstimationPrixPlanification(
            nomProduitPrincipal = recetteComplete.recette.nom,
            uniteProduitPrincipal = recetteComplete.recette.uniteBase,
            coutRevientUnitaireEstime = coutUnit,
            prixReventeConseilleUnitaire = coutUnit * coef
        )
    }

    fun estUnitePiece(unite: String?): Boolean {
        val u = unite?.trim()?.lowercase().orEmpty()
        return u == "pièce" || u == "piece" || u == "pièces" || u == "pieces"
    }

    fun poidsUnitaireKgPourRecette(recette: RecetteEntity): Double {
        return if (estUnitePiece(recette.uniteBase)) 0.5 else 1.0
    }

    data class AnalyseCourbePesees(
        val poidsInitialG: Double,
        val dernierPoidsG: Double,
        val poidsCibleG: Double,
        val perteCiblePct: Double,
        val perteActuellePct: Double,
        val resteAPerdreG: Double,
        val historiqueTrie: List<ProjetPeseeEntity>,
        val risqueCroutage: Boolean,
        val alerteCroutageMsg: String,
        val vitessePctParJour: Double,
        val dateEstimeeFinMillis: Long?
    )

    fun analyserCourbePesees(
        lot: ProjetLotEntity,
        pesees: List<ProjetPeseeEntity>,
        perteCiblePct: Double = 35.0,
        dateDebutProjetMillis: Long = 0L
    ): AnalyseCourbePesees {
        val cible = if (perteCiblePct > 0.0) perteCiblePct else 35.0
        val pInit = lot.poidsInitialGrammes
        val hist = pesees.filter { it.lotId == lot.id }.sortedBy { it.dateMillis }
        val dernierPoids = hist.lastOrNull()?.poidsGrammes ?: lot.poidsActuelGrammes.takeIf { it > 0.0 } ?: pInit
        val poidsCible = if (pInit > 0.0) pInit * (1.0 - cible / 100.0) else 0.0
        val perteActuelle = if (pInit > 0.0 && dernierPoids > 0.0) ((pInit - dernierPoids) / pInit) * 100.0 else 0.0
        val resteG = if (pInit > 0.0 && dernierPoids > 0.0) max(0.0, dernierPoids - poidsCible) else 0.0

        var risqueCroutage = false
        var alerteMsg = ""
        var vitesse = 0.0
        var estFinMillis: Long? = null

        if (pInit > 0.0 && hist.isNotEmpty()) {
            val t0 = if (dateDebutProjetMillis > 0L) dateDebutProjetMillis else hist.first().dateMillis
            val dayMs = 86_400_000.0
            for (pes in hist) {
                val jours = max(0.0, (pes.dateMillis - t0) / dayMs)
                val perte = ((pInit - pes.poidsGrammes) / pInit) * 100.0
                if (jours <= 7.0 && perte > 15.0) {
                    risqueCroutage = true
                    alerteMsg = "⚠️ Risque de croûtage : -${String.format("%.1f", perte)}% en ${max(1, jours.toInt())} j (>15% en 1re semaine). Augmentez l'HR% (75-80%) ou passez sous vide 3-5 jours."
                    break
                }
            }
            val first = hist.first()
            val last = hist.last()
            val tStartRate = if (hist.size >= 2) first.dateMillis else t0
            val perteStart = if (hist.size >= 2) max(0.0, ((pInit - first.poidsGrammes) / pInit) * 100.0) else 0.0
            val joursTotaux = max(1.0, (last.dateMillis - tStartRate) / dayMs)
            val deltaPerte = max(0.0, perteActuelle - perteStart)
            if (perteActuelle > 0.5 && deltaPerte > 0.0) {
                vitesse = deltaPerte / joursTotaux
                if (perteActuelle < cible && vitesse > 0.0) {
                    val joursRestants = ceil((cible - perteActuelle) / vitesse).toLong()
                    estFinMillis = last.dateMillis + joursRestants * 86_400_000L
                }
            }
        }

        return AnalyseCourbePesees(
            poidsInitialG = pInit,
            dernierPoidsG = dernierPoids,
            poidsCibleG = poidsCible,
            perteCiblePct = cible,
            perteActuellePct = perteActuelle,
            resteAPerdreG = resteG,
            historiqueTrie = hist,
            risqueCroutage = risqueCroutage,
            alerteCroutageMsg = alerteMsg,
            vitessePctParJour = vitesse,
            dateEstimeeFinMillis = estFinMillis
        )
    }
}
