package com.quentin.charcuterie.data

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "parametres")
data class ParametreEntity(
    @PrimaryKey val cle: String,
    val libelle: String,
    val categorie: String, // "GENERAL", "CANARD", "PRIX_REF", "FRAIS_TRANSFO"
    val valeur: Double,
    val unite: String,
    val description: String = ""
)

@Entity(tableName = "ingredients")
data class IngredientEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val nom: String,
    val categorie: String, // "VIANDE", "SEL_SUCRE", "EPICES", "CONSOMMABLES", "LIQUIDES"
    val unite: String, // "kg", "g", "L", "cl", "pièce", "m"
    val prixUnitaire: Double, // prix par 'unite'
    val stockActuel: Double = 0.0
)

@Entity(tableName = "recettes")
data class RecetteEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val code: String, // ex: "DEC_CANARD", "MAGRET_SECHE"
    val nom: String,
    val famille: String, // "Canard", "Porc", "Bœuf", "Poisson", "Gibier & Foie"
    val typeRecette: String, // "DECOUPE", "SALAISON_SECHE", "CUIT", "FUME", "MELEE"
    val uniteBase: String, // "pièce", "kg"
    val quantiteDefaut: Double = 1.0,
    val perteCiblePct: Double = 0.0, // ex: 35.0 pour 35%
    val tempCoeurCible: Double = 0.0, // ex: 68.0 pour jambon blanc
    val conditionsConservation: String = "",
    val pointsVigilance: String = "",
    val description: String = "",
    val versionActuelle: Int = 1,
    val historiqueVersions: String = "v1 : Recette initiale",
    val masquee: Boolean = false
)

@Entity(
    tableName = "recette_ingredients",
    foreignKeys = [
        ForeignKey(
            entity = RecetteEntity::class,
            parentColumns = ["id"],
            childColumns = ["recetteId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("recetteId")]
)
data class RecetteIngredientEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val recetteId: Long,
    val nomIngredient: String,
    val modeCalcul: String, // "PAR_PIECE", "PAR_KG_MATIERE", "PAR_KG_MELEE", "POURCENT_POIDS", "PAR_LITRE_SAUMURE", "AU_GOUT"
    val quantite: Double,
    val unite: String, // "g", "kg", "pièce", "cl", "%"
    val prixKgOuUniteEstime: Double = 0.0,
    val varianteCible: String = "" // vide = tronc commun, sinon nom de la variante
)

@Entity(
    tableName = "recette_etapes",
    foreignKeys = [
        ForeignKey(
            entity = RecetteEntity::class,
            parentColumns = ["id"],
            childColumns = ["recetteId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("recetteId")]
)
data class RecetteEtapeEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val recetteId: Long,
    val ordre: Int,
    val titre: String,
    val instructions: String,
    val astuce: String = "",
    val offsetDebutMinutes: Int = 0, // décalage depuis le début du projet (ou fin étape préc.)
    val dureeMinutes: Int = 60,
    val modeDuree: String = "FIXE", // "FIXE", "PAR_KG", "PAR_CM", "SECHAGE"
    val varianteCible: String = "", // vide = commun à tous les lots, sinon ex: "Fumé"
    val facultative: Boolean = false,
    val rappelActifParDefaut: Boolean = true
)

@Entity(
    tableName = "recette_variantes",
    foreignKeys = [
        ForeignKey(
            entity = RecetteEntity::class,
            parentColumns = ["id"],
            childColumns = ["recetteId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("recetteId")]
)
data class RecetteVarianteEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val recetteId: Long,
    val nom: String,
    val descriptionEpices: String,
    val epicesGrammesParUnite: Double = 15.0,
    val dureeSalageHeuresSpecifique: Double? = null,
    val ajouteEtapeFumage: Boolean = false
)

@Entity(
    tableName = "recette_sorties_decoupe",
    foreignKeys = [
        ForeignKey(
            entity = RecetteEntity::class,
            parentColumns = ["id"],
            childColumns = ["recetteId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("recetteId")]
)
data class RecetteSortieDecoupeEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val recetteId: Long,
    val codeSortie: String, // "magret", "cuisse", "rillettes", "bouillon", "gratton", "graisse", "gesier", "foie"
    val nom: String,
    val unite: String, // "pièce", "kg", "bocal 50cl", "L"
    val rendementParUniteBase: Double, // ex: 2.0 magrets par canard
    val valeurRefBoutiqueUnitaire: Double, // ex: 14.0 € / magret
    val fraisTransfoUnitaire: Double, // ex: 0.60 € / cuisse
    val cocheParDefaut: Boolean = true,
    val codeRecetteAval: String = "" // ex: "MAGRET_SECHE"
)

// ==================== PROJETS & RÉALISATIONS ====================

@Entity(tableName = "projets")
data class ProjetEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val nom: String,
    val recettePrincipaleId: Long,
    val nomRecettePrincipale: String,
    val typeProjet: String, // "VALORISATION_CANARD", "RECETTE_SIMPLE"
    val dateDebutMillis: Long, // timestamp du début (ex: Samedi 11h00)
    val quantiteBasePrevue: Double, // ex: 10 canards, ou 20 magrets, ou 3 kg sanglier
    val quantiteBaseReelle: Double = 0.0,
    val prixUnitaireMatiereBase: Double = 18.0, // ex: 18 € le canard
    val margeTravailPct: Double = 10.0,
    val prixSelKg: Double = 1.0,
    val prixEpicesKg: Double = 25.0,
    val statut: String = "EN_COURS", // "PLANIFIE", "EN_COURS", "AFFINAGE", "TERMINE"
    val commentaireGeneral: String = "",
    val versionRecetteUtilisee: Int = 1,
    val activerRevente: Boolean = true,
    val prixReventeUnitaireFixe: Double = 0.0,
    val modeSalage: String = "RECOUVREMENT_SEL" // "RECOUVREMENT_SEL" ou "SOUS_VIDE"
)

/**
 * Parties issues d'une découpe (ex: Canard entier -> Magrets, Cuisses, Rillettes, Bouillons, Grattons, Graisse, Gésiers, Foie)
 * Permet de cocher/décocher chaque partie et de saisir ce qu'on a RÉELLEMENT obtenu (ex: 10L de gras, 20 cuisses, 20 magrets).
 */
@Entity(
    tableName = "projet_sorties_decoupe",
    foreignKeys = [
        ForeignKey(
            entity = ProjetEntity::class,
            parentColumns = ["id"],
            childColumns = ["projetId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("projetId")]
)
data class ProjetSortieDecoupeEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val projetId: Long,
    val codeSortie: String,
    val nom: String,
    val unite: String,
    val actif: Boolean = true, // coché ou décoché selon dispo (ex: sans foie gras)
    val quantitePrevue: Double,
    val quantiteReelle: Double, // modifiable : ce qu'on a réellement obtenu !
    val valeurRefUnitaire: Double,
    val fraisTransfoUnitaire: Double,
    val commentaireSortie: String = "",
    val prixReventeUnitaire: Double = 0.0
)

/**
 * Lots / Variantes au sein d'un même projet :
 * Exemple : sur 20 magrets -> 10 Paprika, 3 Café, 7 Fumé avec commentaire et note sur chaque lot !
 */
@Entity(
    tableName = "projet_lots",
    foreignKeys = [
        ForeignKey(
            entity = ProjetEntity::class,
            parentColumns = ["id"],
            childColumns = ["projetId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("projetId")]
)
data class ProjetLotEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val projetId: Long,
    val nomProduit: String, // ex: "Magret séché" ou "Saucisse fraîche"
    val variante: String, // ex: "Paprika", "Café", "Fumé"
    val quantitePrevue: Double, // ex: 10, 3, 7
    val quantiteReelle: Double, // ex: 10, 3, 7
    val unite: String = "pièce",
    val epicesUtiliseesGrammes: Double = 0.0,
    val dureeSalageHeures: Double = 24.0,
    val poidsInitialGrammes: Double = 0.0,
    val poidsActuelGrammes: Double = 0.0,
    val commentaire: String = "", // Commentaire spécifique à ce type de magret / lot !
    val noteSur5: Int = 0 // 0 = non noté, 1..5 étoiles
)

@Entity(
    tableName = "projet_etapes",
    foreignKeys = [
        ForeignKey(
            entity = ProjetEntity::class,
            parentColumns = ["id"],
            childColumns = ["projetId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("projetId")]
)
data class ProjetEtapeEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val projetId: Long,
    val ordre: Int,
    val jourLibelle: String, // ex: "Jour 1", "Jour 2", "Affinage"
    val titre: String,
    val instructions: String,
    val astuce: String = "",
    val debutPrevuMillis: Long,
    val dureeMinutes: Int,
    val varianteCible: String = "",
    val terminee: Boolean = false,
    val rappelProgramme: Boolean = false,
    val noteEtape: String = ""
)

@Entity(
    tableName = "projet_etape_photos",
    foreignKeys = [
        ForeignKey(
            entity = ProjetEtapeEntity::class,
            parentColumns = ["id"],
            childColumns = ["etapeId"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = ProjetEntity::class,
            parentColumns = ["id"],
            childColumns = ["projetId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("etapeId"), Index("projetId")]
)
data class ProjetEtapePhotoEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val etapeId: Long,
    val projetId: Long,
    val cheminFichier: String,
    val legende: String = "",
    val tailleOctets: Long = 0L,
    val dateAjoutMillis: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "projet_courses",
    foreignKeys = [
        ForeignKey(
            entity = ProjetEntity::class,
            parentColumns = ["id"],
            childColumns = ["projetId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("projetId")]
)
data class ProjetCourseEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val projetId: Long? = null,
    val nomProjet: String,
    val nomIngredient: String,
    val categorie: String,
    val quantiteRequise: Double,
    val unite: String,
    val prixEstimeTotal: Double,
    val prixReelPaye: Double = 0.0,
    val achete: Boolean = false
)

@Entity(
    tableName = "projet_pesees",
    foreignKeys = [
        ForeignKey(
            entity = ProjetLotEntity::class,
            parentColumns = ["id"],
            childColumns = ["lotId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("lotId")]
)
data class ProjetPeseeEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val lotId: Long,
    val projetId: Long,
    val dateMillis: Long,
    val poidsGrammes: Double,
    val pertePct: Double,
    val note: String = ""
)

// ==================== COMMANDES & PAIEMENTS AMIS ====================

data class LigneCommandeItem(
    val produit: String,
    val quantite: Double,
    val unite: String = "pièce",
    val prixUnitaire: Double
) {
    val sousTotal: Double
        get() = quantite * prixUnitaire
}

@Entity(
    tableName = "projet_commandes",
    foreignKeys = [
        ForeignKey(
            entity = ProjetEntity::class,
            parentColumns = ["id"],
            childColumns = ["projetId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("projetId")]
)
data class ProjetCommandeEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val projetId: Long,
    val nomAcheteur: String, // Qui a acheté (ex: "Baptiste et Pauline")
    val produit: String, // Résumé ex: "2 Magret Paprika, 2 Magret Herbes, 4 Cuisses confites"
    val quantite: Double,
    val unite: String,
    val prixUnitaire: Double,
    val montantTotal: Double,
    val paye: Boolean = false, // Qui a payé !
    val moyenPaiement: String = "", // "Espèces", "Wero / Paylib", "Lydia", "Virement"
    val livre: Boolean = false,
    val commentaire: String = "",
    val detailsLignes: String = "" // Détail structuré multi-produits avec prix par produit
)

@Entity(tableName = "clients")
data class ClientEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val nom: String
)

// ==================== JOURNAL DE CAVE & ÉVALUATIONS ====================

@Entity(tableName = "cave_releves")
data class CaveReleveEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val dateMillis: Long,
    val temperature: Double,
    val hygrometrie: Double,
    val note: String = ""
)

@Entity(tableName = "projet_evaluations")
data class ProjetEvaluationEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val projetId: Long,
    val recetteId: Long,
    val nomRecette: String,
    val dateMillis: Long,
    val noteGlobale: Int = 5,
    val texture: String = "Équilibrée / Fondante",
    val salinite: String = "Parfaite",
    val aromes: String = "Équilibrés",
    val commentaire: String = ""
)

fun encoderLignesCommande(lignes: List<LigneCommandeItem>): String {
    return lignes.joinToString("||") { l ->
        val safeProd = l.produit.replace("|", "/").replace(";", ",").trim()
        val safeUnite = l.unite.replace("|", "/").replace(";", ",").trim().ifBlank { "pièce" }
        "$safeProd;;${l.quantite};;$safeUnite;;${l.prixUnitaire}"
    }
}

fun formaterResumeLignesCommande(lignes: List<LigneCommandeItem>): String {
    return lignes.joinToString(", ") { l ->
        val qStr = if (l.quantite % 1.0 == 0.0) l.quantite.toInt().toString() else l.quantite.toString()
        "$qStr ${l.produit}"
    }
}

fun ProjetCommandeEntity.extraireLignes(): List<LigneCommandeItem> {
    if (detailsLignes.isNotBlank()) {
        val parsed = detailsLignes.split("||").mapNotNull { row ->
            val parts = row.split(";;")
            if (parts.size >= 4) {
                val prod = parts[0].trim()
                val qte = parts[1].toDoubleOrNull() ?: 0.0
                val unite = parts[2].trim().ifBlank { "pièce" }
                val pu = parts[3].toDoubleOrNull() ?: 0.0
                if (prod.isNotBlank() && qte > 0.0) {
                    LigneCommandeItem(
                        produit = prod,
                        quantite = qte,
                        unite = unite,
                        prixUnitaire = pu
                    )
                } else null
            } else null
        }
        if (parsed.isNotEmpty()) return parsed
    }
    val qSafe = if (quantite > 0.0) quantite else 1.0
    val puSafe = if (prixUnitaire > 0.0) prixUnitaire else (montantTotal / qSafe)
    return listOf(
        LigneCommandeItem(
            produit = produit.ifBlank { "Charcuterie" },
            quantite = qSafe,
            unite = unite.ifBlank { "pièce" },
            prixUnitaire = puSafe
        )
    )
}
