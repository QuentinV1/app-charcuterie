package com.quentin.charcuterie.domain

import com.quentin.charcuterie.data.RecetteComplete
import com.quentin.charcuterie.data.RecetteEntity
import com.quentin.charcuterie.data.RecetteEtapeEntity
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SalageHelperTest {

    private fun fakeRecette(
        code: String,
        uniteBase: String = "kg",
        quantiteDefaut: Double = 2.0,
        etapes: List<RecetteEtapeEntity>
    ) = RecetteComplete(
        recette = RecetteEntity(
            id = 1L,
            code = code,
            nom = code,
            famille = "Gibier & Foie",
            typeRecette = "SALAISON_SECHE",
            uniteBase = uniteBase,
            quantiteDefaut = quantiteDefaut
        ),
        ingredients = emptyList(),
        etapes = etapes,
        variantes = emptyList(),
        sortiesDecoupe = emptyList()
    )

    @Test
    fun switchRecouvrementVersSousVide_adapteEtapeEtDecaleSuivantes() {
        val recette = fakeRecette(
            code = "GIGOT_SANGLIER_SECHE",
            quantiteDefaut = 3.5,
            etapes = listOf(
                RecetteEtapeEntity(recetteId = 1L, ordre = 1, titre = "Parage", instructions = "Parer", offsetDebutMinutes = 0, dureeMinutes = 45),
                RecetteEtapeEntity(recetteId = 1L, ordre = 2, titre = "Salage au gros sel par recouvrement", instructions = "Sel", offsetDebutMinutes = 45, dureeMinutes = 8640, modeDuree = "PAR_KG"),
                RecetteEtapeEntity(recetteId = 1L, ordre = 3, titre = "Rinçage & Dessalage (2 h)", instructions = "Dessaler", offsetDebutMinutes = 8685, dureeMinutes = 120),
                RecetteEtapeEntity(recetteId = 1L, ordre = 4, titre = "Séchage", instructions = "Sécher", offsetDebutMinutes = 60480, dureeMinutes = 60)
            )
        )

        val adaptees = SalageHelper.adapterEtapesPourModeSalage(
            recetteComplete = recette,
            etapesFiltrees = recette.etapes,
            modeSalage = ModeSalage.SOUS_VIDE,
            quantiteBase = 4.0
        )

        assertEquals(4, adaptees.size)
        // 4 kg * 72h = 288h = 12 jours = 17280 min
        assertTrue(adaptees[1].titre.contains("sous vide", ignoreCase = true))
        assertEquals(288 * 60, adaptees[1].dureeMinutes)
        // Rinçage sans dessalage = 20 min
        assertTrue(adaptees[2].titre.contains("sans dessalage", ignoreCase = true))
        assertEquals(20, adaptees[2].dureeMinutes)
        assertEquals(45 + 288 * 60, adaptees[2].offsetDebutMinutes)
        // Séchage décalé en conséquence
        assertTrue(adaptees[3].offsetDebutMinutes > 60480)
    }

    @Test
    fun switchSousVideVersRecouvrement_adapteEtapeEtAjouteDessalage() {
        val recette = fakeRecette(
            code = "COPPA",
            quantiteDefaut = 2.0,
            etapes = listOf(
                RecetteEtapeEntity(recetteId = 1L, ordre = 1, titre = "Parage & Salage sous vide (12 jours)", instructions = "Sous vide", offsetDebutMinutes = 0, dureeMinutes = 17280),
                RecetteEtapeEntity(recetteId = 1L, ordre = 2, titre = "Rinçage & Ficelage", instructions = "Rincer", offsetDebutMinutes = 17280, dureeMinutes = 60),
                RecetteEtapeEntity(recetteId = 1L, ordre = 3, titre = "Séchage", instructions = "Sécher", offsetDebutMinutes = 57600, dureeMinutes = 60)
            )
        )

        val adaptees = SalageHelper.adapterEtapesPourModeSalage(
            recetteComplete = recette,
            etapesFiltrees = recette.etapes,
            modeSalage = ModeSalage.RECOUVREMENT_SEL,
            quantiteBase = 2.0
        )

        assertEquals(3, adaptees.size)
        // 2 kg * 24h = 48h = 2880 min
        assertTrue(adaptees[0].titre.contains("gros sel", ignoreCase = true))
        assertEquals(48 * 60, adaptees[0].dureeMinutes)
        // Dessalage 1h = 60 min
        assertTrue(adaptees[1].titre.contains("Dessalage", ignoreCase = true))
        assertEquals(60, adaptees[1].dureeMinutes)
        assertEquals(48 * 60, adaptees[1].offsetDebutMinutes)
        // Séchage avancé (57600 - (17280 - 2880) = 43200)
        assertEquals(43200, adaptees[2].offsetDebutMinutes)
    }
}
