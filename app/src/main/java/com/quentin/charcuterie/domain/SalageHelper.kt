package com.quentin.charcuterie.domain

import com.quentin.charcuterie.data.RecetteComplete
import com.quentin.charcuterie.data.RecetteEtapeEntity
import kotlin.math.roundToInt

enum class ModeSalage(
    val code: String,
    val libelle: String,
    val sousTitre: String
) {
    RECOUVREMENT_SEL(
        code = "RECOUVREMENT_SEL",
        libelle = "Recouvrement au sel",
        sousTitre = "Gros sel non iodé · Salage rapide + rinçage / dessalage"
    ),
    SOUS_VIDE(
        code = "SOUS_VIDE",
        libelle = "Sous-vide",
        sousTitre = "30 g/kg sel (3 %) + 10 g/kg sucre · À l'équilibre, sans dessalage"
    );

    companion object {
        fun fromCode(code: String?): ModeSalage =
            entries.find { it.code == code } ?: RECOUVREMENT_SEL
    }
}

data class EtapeAdaptee(
    val titre: String,
    val instructions: String,
    val astuce: String,
    val offsetDebutMinutes: Int,
    val dureeMinutes: Int,
    val varianteCible: String,
    val rappelActifParDefaut: Boolean
)

object SalageHelper {

    fun modeSalageParDefaut(recetteComplete: RecetteComplete): ModeSalage {
        val aSalageSousVide = recetteComplete.etapes.any { e ->
            e.titre.contains("sous vide", ignoreCase = true) &&
                (e.titre.contains("sal", ignoreCase = true) || e.titre.contains("marin", ignoreCase = true))
        }
        return if (aSalageSousVide) ModeSalage.SOUS_VIDE else ModeSalage.RECOUVREMENT_SEL
    }

    fun formaterDureeSalage(heures: Double): String {
        val h = heures.roundToInt().coerceAtLeast(1)
        return when {
            heures < 2.0 -> {
                val mins = (heures * 60.0).roundToInt()
                val hh = mins / 60
                val mm = mins % 60
                if (hh > 0 && mm > 0) "${hh}h${mm.toString().padStart(2, '0')}" else if (hh > 0) "$hh h" else "$mm min"
            }
            h < 48 -> "$h h"
            h % 24 == 0 -> "${h / 24} jours"
            else -> {
                val jours = (heures / 24.0 * 10.0).roundToInt() / 10.0
                "$jours jours ($h h)"
            }
        }
    }

    fun dureeSalageHeuresAdaptee(
        recetteComplete: RecetteComplete,
        modeSalage: ModeSalage,
        quantiteBase: Double,
        dureeVarianteHeures: Double? = null
    ): Double {
        val code = recetteComplete.recette.code
        val q = quantiteBase.coerceAtLeast(0.5)

        return when (modeSalage) {
            ModeSalage.RECOUVREMENT_SEL -> when (code) {
                "VALORISATION_CANARD", "MAGRET_SECHE_SEUL" -> dureeVarianteHeures ?: 24.0
                "LONZO" -> 12.0
                "TRUITE_SAUMON_FUME" -> 7.0
                "GRAVLAX_SAUMON" -> dureeVarianteHeures ?: 48.0
                "GRAVLAX_BOEUF" -> 30.0
                "POISSON_FUME_CHAUD" -> 2.0
                "JAMBON_CRU" -> (q * 42.0).coerceIn(168.0, 504.0) // 1,75 j/kg (min 7j, max 21j)
                "GIGOT_SANGLIER_SECHE" -> (q * 42.0).coerceIn(96.0, 240.0) // 1,75 j/kg (4 à 10j)
                "VIANDE_FUMEE_TRADI", "POITRINE_FUMEE" -> (q * 24.0).coerceIn(24.0, 48.0)
                "COPPA", "GUANCIALE", "BOEUF_SECHE", "SANGLIER_SECHE", "GIBIER_CHEVREUIL_SECHE" ->
                    (q * 24.0).coerceIn(24.0, 72.0) // 24 h/kg au gros sel
                "JAMBON_BLANC" -> 48.0
                "FOIE_GRAS" -> 12.0
                else -> dureeVarianteHeures ?: 24.0
            }
            ModeSalage.SOUS_VIDE -> when (code) {
                "VALORISATION_CANARD", "MAGRET_SECHE_SEUL" -> {
                    if (dureeVarianteHeures != null && dureeVarianteHeures < 24.0) 120.0 else 144.0 // 5j fumé, 6j autres
                }
                "LONZO" -> 144.0 // 6 jours
                "TRUITE_SAUMON_FUME" -> 48.0 // 2 jours
                "GRAVLAX_SAUMON" -> if (dureeVarianteHeures != null && dureeVarianteHeures <= 10.0) 48.0 else 72.0
                "GRAVLAX_BOEUF" -> 72.0 // 3 jours
                "POISSON_FUME_CHAUD" -> 12.0
                "JAMBON_CRU" -> (q * 60.0).coerceIn(336.0, 720.0) // 2,5 j/kg (14 à 30 jours)
                "GIGOT_SANGLIER_SECHE" -> (q * 72.0).coerceIn(288.0, 432.0) // 3 j/kg (12 à 18 jours)
                "POITRINE_FUMEE", "VIANDE_FUMEE_TRADI" -> 168.0 // 7 jours
                "GIBIER_CHEVREUIL_SECHE" -> 216.0 // 9 jours
                "BOEUF_SECHE" -> 240.0 // 10 jours
                "COPPA", "GUANCIALE", "SANGLIER_SECHE" -> 288.0 // 12 jours
                "JAMBON_BLANC" -> 120.0 // 5 jours
                else -> 24.0
            }
        }
    }

    fun adapterEtapesPourModeSalage(
        recetteComplete: RecetteComplete,
        etapesFiltrees: List<RecetteEtapeEntity>,
        modeSalage: ModeSalage,
        quantiteBase: Double
    ): List<EtapeAdaptee> {
        val r = recetteComplete.recette
        val nativeMode = modeSalageParDefaut(recetteComplete)

        fun dureeEffective(e: RecetteEtapeEntity): Int {
            return if (e.modeDuree == "PAR_KG") {
                (e.dureeMinutes * (quantiteBase / r.quantiteDefaut.coerceAtLeast(1.0))).toInt().coerceAtLeast(1)
            } else {
                e.dureeMinutes
            }
        }

        if (modeSalage == nativeMode) {
            return etapesFiltrees.map { e ->
                EtapeAdaptee(
                    titre = e.titre,
                    instructions = e.instructions,
                    astuce = e.astuce,
                    offsetDebutMinutes = e.offsetDebutMinutes,
                    dureeMinutes = dureeEffective(e),
                    varianteCible = e.varianteCible,
                    rappelActifParDefaut = e.rappelActifParDefaut
                )
            }
        }

        // Cas particulier : Week-end Canard (VALORISATION_CANARD) basculé en Sous-vide
        if (r.code == "VALORISATION_CANARD" && modeSalage == ModeSalage.SOUS_VIDE) {
            return adapterCanardEnSousVide(etapesFiltrees, ::dureeEffective)
        }

        // Recherche de l'étape principale de salage / saumurage / marinade
        val salageIdx = etapesFiltrees.indexOfFirst { e ->
            val t = e.titre.lowercase()
            t.contains("salage") ||
                t.contains("salaison") ||
                t.contains("mise au sel") ||
                t.contains("marinade") ||
                t.contains("saumurage") ||
                (t.contains("enrobage") && t.contains("sel"))
        }

        if (salageIdx == -1) {
            // Recettes sans étape de salage par recouvrement (pâté, rillettes, saucisses, foie gras)
            return etapesFiltrees.mapIndexed { idx, e ->
                val instr = if (idx == 0 && modeSalage == ModeSalage.SOUS_VIDE) {
                    "${e.instructions}\n• Option sous-vide activée : mettre la préparation sous vide au réfrigérateur (2-4 °C, 24 h) pour une maturation homogène."
                } else {
                    e.instructions
                }
                EtapeAdaptee(
                    titre = e.titre,
                    instructions = instr,
                    astuce = e.astuce,
                    offsetDebutMinutes = e.offsetDebutMinutes,
                    dureeMinutes = dureeEffective(e),
                    varianteCible = e.varianteCible,
                    rappelActifParDefaut = e.rappelActifParDefaut
                )
            }
        }

        val salageEtape = etapesFiltrees[salageIdx]
        val oldSalageDur = dureeEffective(salageEtape)
        val newSalageHours = dureeSalageHeuresAdaptee(recetteComplete, modeSalage, quantiteBase)
        val newSalageDur = (newSalageHours * 60.0).roundToInt()
        val dureeLibelle = formaterDureeSalage(newSalageHours)

        // Vérifier si l'étape suivante est un rinçage / dessalage
        val nextIdx = salageIdx + 1
        val hasRinseStep = nextIdx < etapesFiltrees.size && etapesFiltrees[nextIdx].titre.lowercase().let {
            it.contains("dessal") || it.contains("rinç") || it.contains("rinc") || it.contains("sortie")
        }

        val oldRinseDur = if (hasRinseStep) dureeEffective(etapesFiltrees[nextIdx]) else 0
        val newRinseDur = if (!hasRinseStep) {
            0
        } else if (modeSalage == ModeSalage.SOUS_VIDE) {
            20
        } else {
            if (newSalageHours >= 72.0) 120 else 60
        }

        val deltaSalage = newSalageDur - oldSalageDur
        val deltaTotal = if (hasRinseStep) {
            (salageEtape.offsetDebutMinutes + newSalageDur + newRinseDur) -
                (etapesFiltrees[nextIdx].offsetDebutMinutes + oldRinseDur)
        } else {
            deltaSalage
        }

        return etapesFiltrees.mapIndexed { idx, e ->
            when {
                idx == salageIdx -> {
                    val titreAdapte = if (modeSalage == ModeSalage.SOUS_VIDE) {
                        "Salage à l'équilibre sous vide ($dureeLibelle)"
                    } else {
                        "Salage par recouvrement au gros sel ($dureeLibelle)"
                    }
                    val instrAdaptees = if (modeSalage == ModeSalage.SOUS_VIDE) {
                        "• Peser la pièce au gramme près.\n• Frotter avec 30 g/kg de sel fin non iodé (ou sel nitrité 3 %), 10 g/kg de sucre (1 %) et les aromates.\n• Mettre sous vide et placer au réfrigérateur (2-4 °C) pendant $dureeLibelle en retournant tous les 2 jours."
                    } else {
                        "• Frotter la pièce avec du gros sel non iodé.\n• Enfouir complètement dans un bac de gros sel au réfrigérateur (2-4 °C) pendant $dureeLibelle.\n• Retourner régulièrement et compléter le sel si nécessaire."
                    }
                    EtapeAdaptee(
                        titre = titreAdapte,
                        instructions = instrAdaptees,
                        astuce = e.astuce,
                        offsetDebutMinutes = e.offsetDebutMinutes,
                        dureeMinutes = newSalageDur,
                        varianteCible = e.varianteCible,
                        rappelActifParDefaut = e.rappelActifParDefaut
                    )
                }
                hasRinseStep && idx == nextIdx -> {
                    val titreRincage = if (modeSalage == ModeSalage.SOUS_VIDE) {
                        "Sortie du sac sous vide & Rinçage rapide (sans dessalage)"
                    } else {
                        "Sortie du sel, Rinçage & Dessalage (${newRinseDur / 60} h)"
                    }
                    val instrRincage = if (modeSalage == ModeSalage.SOUS_VIDE) {
                        "• Sortir la viande du sac sous vide.\n• Rincer brièvement à l'eau froide (ne pas faire tremper : le sel est déjà à l'équilibre).\n• Sécher méticuleusement au torchon propre."
                    } else {
                        "• Sortir la viande du gros sel et rincer abondamment à l'eau froide.\n• Dessaler ${newRinseDur / 60} h dans un grand volume d'eau froide en changeant l'eau à mi-parcours.\n• Essuyer et sécher parfaitement au torchon propre."
                    }
                    EtapeAdaptee(
                        titre = titreRincage,
                        instructions = instrRincage,
                        astuce = e.astuce,
                        offsetDebutMinutes = salageEtape.offsetDebutMinutes + newSalageDur,
                        dureeMinutes = newRinseDur,
                        varianteCible = e.varianteCible,
                        rappelActifParDefaut = e.rappelActifParDefaut
                    )
                }
                idx > salageIdx -> {
                    EtapeAdaptee(
                        titre = e.titre,
                        instructions = e.instructions,
                        astuce = e.astuce,
                        offsetDebutMinutes = (e.offsetDebutMinutes + deltaTotal).coerceAtLeast(0),
                        dureeMinutes = dureeEffective(e),
                        varianteCible = e.varianteCible,
                        rappelActifParDefaut = e.rappelActifParDefaut
                    )
                }
                else -> {
                    EtapeAdaptee(
                        titre = e.titre,
                        instructions = e.instructions,
                        astuce = e.astuce,
                        offsetDebutMinutes = e.offsetDebutMinutes,
                        dureeMinutes = dureeEffective(e),
                        varianteCible = e.varianteCible,
                        rappelActifParDefaut = e.rappelActifParDefaut
                    )
                }
            }
        }
    }

    private fun adapterCanardEnSousVide(
        etapesFiltrees: List<RecetteEtapeEntity>,
        dureeEffective: (RecetteEtapeEntity) -> Int
    ): List<EtapeAdaptee> {
        val offsetSousVideFume = 5 * 1440 // J+5 (120 h)
        val offsetSousVideStandard = 6 * 1440 // J+6 (144 h)

        return (etapesFiltrees.map { e ->
            when (e.ordre) {
                2 -> EtapeAdaptee(
                    titre = "Samedi · Tri des Gras & Salage sous vide (Magrets à fumer - 5 j)",
                    instructions = "• Séparez le gras pur (cubes) du gras avec peau/viande (pour les grattons).\n• Salage sous vide à l'équilibre des magrets à fumer : frottez avec 30 g/kg de sel et 10 g/kg de sucre, puis scellez sous vide au réfrigérateur (5 jours).",
                    astuce = e.astuce,
                    offsetDebutMinutes = e.offsetDebutMinutes,
                    dureeMinutes = 45,
                    varianteCible = e.varianteCible,
                    rappelActifParDefaut = e.rappelActifParDefaut
                )
                3 -> EtapeAdaptee(
                    titre = "Samedi · Salage sous vide des Magrets (6 j) & Sel Cuisses",
                    instructions = "• Frottez les autres magrets avec 30 g/kg de sel et 10 g/kg de sucre, puis mettez-les sous vide au réfrigérateur pour 6 jours.\n• Mettez les cuisses et cous destinés au confit au gros sel (24 h) ou sous vide.\n• Mettez sous vide les aiguillettes (congélateur / rillettes).",
                    astuce = e.astuce,
                    offsetDebutMinutes = e.offsetDebutMinutes,
                    dureeMinutes = 45,
                    varianteCible = e.varianteCible,
                    rappelActifParDefaut = e.rappelActifParDefaut
                )
                8 -> EtapeAdaptee(
                    titre = "J+5 · Sortie sous vide & Rinçage rapide (Magrets Fumés)",
                    instructions = "• Sortez les magrets à fumer de leur sachet sous vide (après 5 jours).\n• Rincez brièvement à l'eau froide (sans dessalage) et séchez parfaitement.",
                    astuce = e.astuce,
                    offsetDebutMinutes = offsetSousVideFume,
                    dureeMinutes = 20,
                    varianteCible = e.varianteCible,
                    rappelActifParDefaut = e.rappelActifParDefaut
                )
                9 -> EtapeAdaptee(
                    titre = "J+5 · Lancement du Fumage à froid (Magrets)",
                    instructions = e.instructions,
                    astuce = e.astuce,
                    offsetDebutMinutes = offsetSousVideFume + 20,
                    dureeMinutes = dureeEffective(e),
                    varianteCible = e.varianteCible,
                    rappelActifParDefaut = e.rappelActifParDefaut
                )
                10 -> EtapeAdaptee(
                    titre = "Dimanche · Dessalage des Cuisses & Cous (24 h)",
                    instructions = "• Sortez les cuisses et cous du gros sel (après 24 h) et dessalez 1 heure dans l'eau froide.\n• (Les magrets restent sous vide jusqu'à J+6).",
                    astuce = e.astuce,
                    offsetDebutMinutes = e.offsetDebutMinutes,
                    dureeMinutes = 60,
                    varianteCible = e.varianteCible,
                    rappelActifParDefaut = e.rappelActifParDefaut
                )
                11 -> EtapeAdaptee(
                    titre = "Dimanche · Immersion des Cuisses au confit",
                    instructions = "• Séchez les cuisses et plongez-les dans la graisse fondue chaude (complètement immergées).",
                    astuce = e.astuce,
                    offsetDebutMinutes = e.offsetDebutMinutes,
                    dureeMinutes = 30,
                    varianteCible = e.varianteCible,
                    rappelActifParDefaut = e.rappelActifParDefaut
                )
                16 -> EtapeAdaptee(
                    titre = "Dimanche soir · Filtrage du bouillon",
                    instructions = "• Filtrez le bouillon de carcasse (retirez le disque de graisse figée en surface).\n• (Les magrets sont en cours de salage sous vide jusqu'à J+5 / J+6).",
                    astuce = e.astuce,
                    offsetDebutMinutes = e.offsetDebutMinutes,
                    dureeMinutes = dureeEffective(e),
                    varianteCible = e.varianteCible,
                    rappelActifParDefaut = e.rappelActifParDefaut
                )
                17 -> EtapeAdaptee(
                    titre = "J+27 à J+48 · Contrôle séchage des Magrets (3 à 6 semaines)",
                    instructions = e.instructions,
                    astuce = e.astuce,
                    offsetDebutMinutes = offsetSousVideStandard + 30240,
                    dureeMinutes = dureeEffective(e),
                    varianteCible = e.varianteCible,
                    rappelActifParDefaut = e.rappelActifParDefaut
                )
                else -> EtapeAdaptee(
                    titre = e.titre,
                    instructions = e.instructions,
                    astuce = e.astuce,
                    offsetDebutMinutes = e.offsetDebutMinutes,
                    dureeMinutes = dureeEffective(e),
                    varianteCible = e.varianteCible,
                    rappelActifParDefaut = e.rappelActifParDefaut
                )
            }
        } + listOf(
            EtapeAdaptee(
                titre = "J+6 · Sortie sous vide, Épiçage des Magrets & Mise en torchon",
                instructions = "• Sortez les magrets du sous vide (après 6 jours), rincez brièvement sans dessaler et séchez.\n• Appliquez les épices selon chaque lot (Paprika, Café, Poivre...), roulez dans des torchons propres et placez en bas du frigo (3 à 6 semaines).",
                astuce = "Pesez chaque magret avant la mise en torchon pour suivre la perte de poids (~32%).",
                offsetDebutMinutes = offsetSousVideStandard,
                dureeMinutes = 45,
                varianteCible = "",
                rappelActifParDefaut = true
            )
        )).sortedBy { it.offsetDebutMinutes }
    }
}
