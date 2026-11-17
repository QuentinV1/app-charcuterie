package com.quentin.charcuterie.data

import android.app.Application
import android.net.Uri
import androidx.room.withTransaction
import com.google.gson.GsonBuilder
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import kotlin.math.abs

object BackupManager {

    data class RecetteCompleteBackup(
        val recette: RecetteEntity,
        val ingredients: List<RecetteIngredientEntity> = emptyList(),
        val etapes: List<RecetteEtapeEntity> = emptyList(),
        val variantes: List<RecetteVarianteEntity> = emptyList(),
        val sortiesDecoupe: List<RecetteSortieDecoupeEntity> = emptyList()
    )

    data class BackupMobilePayload(
        val schemaVersion: Int = 4,
        val source: String = "L_AFFINOIR_ANDROID",
        val exportedAt: Long = System.currentTimeMillis(),
        val parametres: List<ParametreEntity> = emptyList(),
        val ingredients: List<IngredientEntity> = emptyList(),
        val recettes: List<RecetteCompleteBackup> = emptyList(),
        val clients: List<ClientEntity> = emptyList(),
        val caveReleves: List<CaveReleveEntity> = emptyList(),
        val evaluations: List<ProjetEvaluationEntity> = emptyList(),
        val projets: List<ProjetCompletBackup> = emptyList(),
        val courses: List<ProjetCourseEntity> = emptyList(),
        val commandes: List<ProjetCommandeEntity> = emptyList()
    )

    data class ProjetCompletBackup(
        val projet: ProjetEntity,
        val sortiesDecoupe: List<ProjetSortieDecoupeEntity> = emptyList(),
        val lots: List<ProjetLotEntity> = emptyList(),
        val etapes: List<ProjetEtapeEntity> = emptyList(),
        val pesees: List<ProjetPeseeEntity> = emptyList(),
        val photosEtapes: List<ProjetEtapePhotoEntity> = emptyList()
    )

    private fun JsonObject.str(key: String, default: String = ""): String {
        val el = get(key) ?: return default
        if (el.isJsonNull) return default
        return runCatching { el.asString }.getOrDefault(default)
    }

    private fun JsonObject.dbl(key: String, default: Double = 0.0): Double {
        val el = get(key) ?: return default
        if (el.isJsonNull) return default
        return runCatching { el.asDouble }.getOrDefault(default)
    }

    private fun JsonObject.lng(key: String, default: Long = 0L): Long {
        val el = get(key) ?: return default
        if (el.isJsonNull) return default
        return runCatching { el.asLong }.getOrDefault(default)
    }

    private fun JsonObject.intVal(key: String, default: Int = 0): Int {
        val el = get(key) ?: return default
        if (el.isJsonNull) return default
        return runCatching { el.asInt }.getOrDefault(default)
    }

    private fun JsonObject.bool(key: String, default: Boolean = false): Boolean {
        val el = get(key) ?: return default
        if (el.isJsonNull) return default
        return runCatching { el.asBoolean }.getOrDefault(default)
    }

    private fun parseDateToMillis(dateStr: String?, fallback: Long = System.currentTimeMillis()): Long {
        val s = dateStr?.trim().orEmpty()
        if (s.isBlank()) return fallback
        return runCatching { Instant.parse(s).toEpochMilli() }.getOrNull()
            ?: runCatching {
                LocalDateTime.parse(s.take(19)).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
            }.getOrNull()
            ?: runCatching {
                LocalDate.parse(s.take(10)).atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
            }.getOrNull()
            ?: fallback
    }

    suspend fun exporterDonneesJson(app: Application, dao: CharcuterieDao, uri: Uri): String {
        val recettesComplets = dao.getAllRecettesCompletesOnce().map { rc ->
            RecetteCompleteBackup(
                recette = rc.recette,
                ingredients = rc.ingredients,
                etapes = rc.etapes,
                variantes = rc.variantes,
                sortiesDecoupe = rc.sortiesDecoupe
            )
        }
        val projetsComplets = dao.getAllProjetsCompletsOnce().map { pc ->
            ProjetCompletBackup(
                projet = pc.projet,
                sortiesDecoupe = pc.sortiesDecoupe,
                lots = pc.lots,
                etapes = pc.etapes,
                pesees = pc.pesees,
                photosEtapes = pc.photosEtapes
            )
        }
        val payload = BackupMobilePayload(
            parametres = dao.getParametresList(),
            ingredients = dao.getAllIngredientsOnce(),
            recettes = recettesComplets,
            clients = dao.getAllClientsOnce(),
            caveReleves = dao.getAllCaveRelevesOnce(),
            evaluations = dao.getAllEvaluationsOnce(),
            projets = projetsComplets,
            courses = dao.getAllCoursesOnce(),
            commandes = dao.getAllCommandesOnce()
        )
        val json = GsonBuilder().setPrettyPrinting().create().toJson(payload)
        app.contentResolver.openOutputStream(uri)?.use { out ->
            out.write(json.toByteArray(Charsets.UTF_8))
        } ?: throw IllegalStateException("Impossible d'ouvrir le fichier en écriture")
        return "Sauvegarde JSON exportée avec succès !"
    }

    suspend fun importerDonneesJson(
        app: Application,
        db: AppDatabase,
        dao: CharcuterieDao,
        uri: Uri
    ): String {
        val content = app.contentResolver.openInputStream(uri)?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }
            ?: throw IllegalStateException("Impossible de lire le fichier")
        val root = JsonParser.parseString(content).asJsonObject
        var importedRecettes = 0
        var importedProjets = 0
        var importedCave = 0
        var importedCourses = 0
        var importedCommandes = 0

        db.withTransaction {
            // 1. Paramètres
            if (root.has("parametres") && root.get("parametres").isJsonArray) {
                val existingParams = dao.getParametresList().associateBy { it.cle }
                val toUpsert = mutableListOf<ParametreEntity>()
                root.getAsJsonArray("parametres").forEach { el ->
                    if (!el.isJsonObject) return@forEach
                    val obj = el.asJsonObject
                    val cle = obj.str("cle").trim()
                    if (cle.isBlank()) return@forEach
                    val prev = existingParams[cle]
                    toUpsert.add(
                        ParametreEntity(
                            cle = cle,
                            libelle = obj.str("libelle", prev?.libelle ?: cle),
                            categorie = obj.str("categorie", prev?.categorie ?: "GENERAL"),
                            valeur = obj.dbl("valeur", prev?.valeur ?: 0.0),
                            unite = obj.str("unite", prev?.unite ?: ""),
                            description = obj.str("description", prev?.description ?: "")
                        )
                    )
                }
                if (toUpsert.isNotEmpty()) dao.insertParametres(toUpsert)
            }

            // 1b. Ingrédients personnalisés (sans doublons)
            if (root.has("ingredients") && root.get("ingredients").isJsonArray) {
                val existingIngs = dao.getAllIngredientsOnce().map { it.nom.trim().lowercase() }.toMutableSet()
                val toInsert = mutableListOf<IngredientEntity>()
                root.getAsJsonArray("ingredients").forEach { el ->
                    if (!el.isJsonObject) return@forEach
                    val obj = el.asJsonObject
                    val nom = obj.str("nom").trim()
                    if (nom.isBlank() || !existingIngs.add(nom.lowercase())) return@forEach
                    toInsert.add(
                        IngredientEntity(
                            id = 0,
                            nom = nom,
                            categorie = obj.str("categorie", "AUTRE"),
                            unite = obj.str("unite", "kg"),
                            prixUnitaire = obj.dbl("prixUnitaire", 0.0),
                            stockActuel = obj.dbl("stockActuel", 0.0)
                        )
                    )
                }
                if (toInsert.isNotEmpty()) dao.insertIngredients(toInsert)
            }

            // 2. Recettes (Android nested ou PWA plat)
            val recetteIdMap = mutableMapOf<String, Long>()
            val existingRecettes = dao.getAllRecettesCompletesOnce().toMutableList()
            existingRecettes.forEach { rc ->
                recetteIdMap[rc.recette.id.toString()] = rc.recette.id
                if (rc.recette.code.isNotBlank()) recetteIdMap[rc.recette.code] = rc.recette.id
            }
            if (root.has("recettes") && root.get("recettes").isJsonArray) {
                root.getAsJsonArray("recettes").forEach { el ->
                    if (!el.isJsonObject) return@forEach
                    val obj = el.asJsonObject
                    val recObj = if (obj.has("recette") && obj.get("recette").isJsonObject) {
                        obj.getAsJsonObject("recette")
                    } else {
                        obj
                    }
                    val oldIdStr = recObj.str("id")
                    val code = recObj.str("code").ifBlank { oldIdStr }
                    val nom = recObj.str("nom").trim()
                    if (nom.isBlank()) return@forEach

                    val existing = existingRecettes.find {
                        (code.isNotBlank() && it.recette.code.equals(code, ignoreCase = true)) ||
                            it.recette.nom.trim().equals(nom, ignoreCase = true)
                    }
                    if (existing != null) {
                        if (oldIdStr.isNotBlank()) recetteIdMap[oldIdStr] = existing.recette.id
                        if (code.isNotBlank()) recetteIdMap[code] = existing.recette.id
                    } else {
                        val newRec = RecetteEntity(
                            id = 0,
                            code = code.ifBlank { "REC_${System.currentTimeMillis()}" },
                            nom = nom,
                            famille = recObj.str("famille", "Porc"),
                            typeRecette = recObj.str("typeRecette", recObj.str("type", "SALAISON_SECHE")),
                            uniteBase = recObj.str("uniteBase", recObj.str("unite", "kg")),
                            quantiteDefaut = recObj.dbl("quantiteDefaut", 1.0),
                            perteCiblePct = recObj.dbl("perteCiblePct", recObj.dbl("perteCible", 0.0)),
                            tempCoeurCible = recObj.dbl("tempCoeurCible", 0.0),
                            conditionsConservation = recObj.str("conditionsConservation"),
                            pointsVigilance = recObj.str("pointsVigilance"),
                            description = recObj.str("description"),
                            versionActuelle = recObj.intVal("versionActuelle", 1),
                            historiqueVersions = recObj.str("historiqueVersions", "v1 : Importée"),
                            masquee = recObj.bool("masquee", false)
                        )
                        val newRecId = dao.insertRecette(newRec)
                        if (oldIdStr.isNotBlank()) recetteIdMap[oldIdStr] = newRecId
                        if (code.isNotBlank()) recetteIdMap[code] = newRecId

                        if (obj.has("ingredients") && obj.get("ingredients").isJsonArray) {
                            val ings = obj.getAsJsonArray("ingredients").mapNotNull { ie ->
                                if (!ie.isJsonObject) return@mapNotNull null
                                val io = ie.asJsonObject
                                val ingNom = io.str("nomIngredient", io.str("nom")).trim()
                                if (ingNom.isBlank()) return@mapNotNull null
                                RecetteIngredientEntity(
                                    recetteId = newRecId,
                                    nomIngredient = ingNom,
                                    modeCalcul = io.str("modeCalcul", "PAR_KG_MATIERE"),
                                    quantite = io.dbl("quantite", io.dbl("qte", 0.0)),
                                    unite = io.str("unite", "g"),
                                    prixKgOuUniteEstime = io.dbl("prixKgOuUniteEstime", io.dbl("prix", 0.0)),
                                    varianteCible = io.str("varianteCible")
                                )
                            }
                            if (ings.isNotEmpty()) dao.insertRecetteIngredients(ings)
                        }
                        if (obj.has("etapes") && obj.get("etapes").isJsonArray) {
                            val ets = obj.getAsJsonArray("etapes").mapIndexedNotNull { idx, ee ->
                                if (!ee.isJsonObject) return@mapIndexedNotNull null
                                val eo = ee.asJsonObject
                                val titre = eo.str("titre").trim()
                                if (titre.isBlank()) return@mapIndexedNotNull null
                                RecetteEtapeEntity(
                                    recetteId = newRecId,
                                    ordre = eo.intVal("ordre", idx + 1),
                                    titre = titre,
                                    instructions = eo.str("instructions"),
                                    astuce = eo.str("astuce"),
                                    offsetDebutMinutes = eo.intVal("offsetDebutMinutes", 0),
                                    dureeMinutes = eo.intVal("dureeMinutes", (eo.dbl("dureeH", 1.0) * 60).toInt()),
                                    modeDuree = eo.str("modeDuree", "FIXE"),
                                    varianteCible = eo.str("varianteCible"),
                                    facultative = eo.bool("facultative", false),
                                    rappelActifParDefaut = eo.bool("rappelActifParDefaut", true)
                                )
                            }
                            if (ets.isNotEmpty()) dao.insertRecetteEtapes(ets)
                        }
                        if (obj.has("variantes") && obj.get("variantes").isJsonArray) {
                            val vars = obj.getAsJsonArray("variantes").mapNotNull { ve ->
                                if (!ve.isJsonObject) return@mapNotNull null
                                val vo = ve.asJsonObject
                                val vNom = vo.str("nom").trim()
                                if (vNom.isBlank()) return@mapNotNull null
                                RecetteVarianteEntity(
                                    recetteId = newRecId,
                                    nom = vNom,
                                    descriptionEpices = vo.str("descriptionEpices"),
                                    epicesGrammesParUnite = vo.dbl("epicesGrammesParUnite", 15.0),
                                    dureeSalageHeuresSpecifique = vo.get("dureeSalageHeuresSpecifique")?.takeIf { !it.isJsonNull }?.let { runCatching { it.asDouble }.getOrNull() },
                                    ajouteEtapeFumage = vo.bool("ajouteEtapeFumage", false)
                                )
                            }
                            if (vars.isNotEmpty()) dao.insertRecetteVariantes(vars)
                        }
                        if (obj.has("sortiesDecoupe") && obj.get("sortiesDecoupe").isJsonArray) {
                            val sorties = obj.getAsJsonArray("sortiesDecoupe").mapNotNull { se ->
                                if (!se.isJsonObject) return@mapNotNull null
                                val so = se.asJsonObject
                                val sNom = so.str("nom").trim()
                                if (sNom.isBlank()) return@mapNotNull null
                                RecetteSortieDecoupeEntity(
                                    recetteId = newRecId,
                                    codeSortie = so.str("codeSortie"),
                                    nom = sNom,
                                    unite = so.str("unite", "pièce"),
                                    rendementParUniteBase = so.dbl("rendementParUniteBase", 1.0),
                                    valeurRefBoutiqueUnitaire = so.dbl("valeurRefBoutiqueUnitaire", 0.0),
                                    fraisTransfoUnitaire = so.dbl("fraisTransfoUnitaire", 0.0),
                                    cocheParDefaut = so.bool("cocheParDefaut", true),
                                    codeRecetteAval = so.str("codeRecetteAval")
                                )
                            }
                            if (sorties.isNotEmpty()) dao.insertRecetteSorties(sorties)
                        }
                        existingRecettes.add(
                            RecetteComplete(newRec.copy(id = newRecId), emptyList(), emptyList(), emptyList(), emptyList())
                        )
                        importedRecettes++
                    }
                }
            }

            // 3. Clients (sans doublons)
            if (root.has("clients") && root.get("clients").isJsonArray) {
                val existingClients = dao.getAllClientsOnce().map { it.nom.trim().lowercase() }.toMutableSet()
                root.getAsJsonArray("clients").forEach { el ->
                    if (!el.isJsonObject) return@forEach
                    val nom = el.asJsonObject.str("nom").trim()
                    if (nom.isNotBlank() && existingClients.add(nom.lowercase())) {
                        dao.insertClient(ClientEntity(nom = nom))
                    }
                }
            }

            // 4. Relevés de cave (Android dateMillis ou PWA date ISO, sans doublons)
            if (root.has("caveReleves") && root.get("caveReleves").isJsonArray) {
                val existingCave = dao.getAllCaveRelevesOnce().toMutableList()
                root.getAsJsonArray("caveReleves").forEach { el ->
                    if (!el.isJsonObject) return@forEach
                    val obj = el.asJsonObject
                    if (!obj.has("temperature") || !obj.has("hygrometrie")) return@forEach
                    val temp = obj.dbl("temperature", Double.NaN)
                    val hygro = obj.dbl("hygrometrie", Double.NaN)
                    if (temp.isNaN() || hygro.isNaN()) return@forEach
                    val dateMillis = if (obj.has("dateMillis") && !obj.get("dateMillis").isJsonNull) {
                        obj.lng("dateMillis")
                    } else {
                        parseDateToMillis(obj.str("date"))
                    }
                    val note = obj.str("note").trim()
                    val dejaPresent = existingCave.any {
                        abs(it.dateMillis - dateMillis) < 60_000L &&
                            abs(it.temperature - temp) < 0.01 &&
                            abs(it.hygrometrie - hygro) < 0.01
                    }
                    if (!dejaPresent) {
                        val rel = CaveReleveEntity(dateMillis = dateMillis, temperature = temp, hygrometrie = hygro, note = note)
                        dao.insertCaveReleve(rel)
                        existingCave.add(rel)
                        importedCave++
                    }
                }
            }

            // 5. Projets (Android nested BackupMobilePayload OU PWA plat, sans doublons)
            val projetIdMap = mutableMapOf<String, Long>()
            val existingProjets = dao.getAllProjetsCompletsOnce().toMutableList()
            existingProjets.forEach { pc ->
                projetIdMap[pc.projet.id.toString()] = pc.projet.id
            }

            if (root.has("projets") && root.get("projets").isJsonArray) {
                root.getAsJsonArray("projets").forEach { el ->
                    if (!el.isJsonObject) return@forEach
                    val obj = el.asJsonObject
                    val isNestedAndroid = obj.has("projet") && obj.get("projet").isJsonObject
                    val pObj = if (isNestedAndroid) obj.getAsJsonObject("projet") else obj

                    val oldProjId = pObj.str("id")
                    val nom = pObj.str("nom").trim()
                    if (nom.isBlank()) return@forEach

                    val dateDebutMillis = if (pObj.has("dateDebutMillis") && !pObj.get("dateDebutMillis").isJsonNull) {
                        pObj.lng("dateDebutMillis")
                    } else {
                        parseDateToMillis(pObj.str("dateDebut"))
                    }

                    val existant = existingProjets.find {
                        it.projet.nom.trim().equals(nom, ignoreCase = true) &&
                            abs(it.projet.dateDebutMillis - dateDebutMillis) < 60_000L
                    }
                    if (existant != null) {
                        if (oldProjId.isNotBlank()) projetIdMap[oldProjId] = existant.projet.id
                        return@forEach
                    }

                    val oldRecIdKey = pObj.str("recettePrincipaleId", pObj.str("recetteId"))
                    val resolvedRecId = recetteIdMap[oldRecIdKey]
                        ?: existingRecettes.find {
                            it.recette.nom.equals(pObj.str("nomRecettePrincipale"), ignoreCase = true)
                        }?.recette?.id
                        ?: oldRecIdKey.toLongOrNull()
                        ?: 0L

                    val newProjEntity = ProjetEntity(
                        id = 0,
                        nom = nom,
                        recettePrincipaleId = resolvedRecId,
                        nomRecettePrincipale = pObj.str("nomRecettePrincipale", nom),
                        typeProjet = pObj.str("typeProjet", "RECETTE_SIMPLE"),
                        dateDebutMillis = dateDebutMillis,
                        quantiteBasePrevue = pObj.dbl("quantiteBasePrevue", pObj.dbl("quantite", 1.0)),
                        quantiteBaseReelle = pObj.dbl("quantiteBaseReelle", pObj.dbl("quantiteBasePrevue", 1.0)),
                        prixUnitaireMatiereBase = pObj.dbl("prixUnitaireMatiereBase", 18.0),
                        margeTravailPct = pObj.dbl("margeTravailPct", 10.0),
                        prixSelKg = pObj.dbl("prixSelKg", 1.0),
                        prixEpicesKg = pObj.dbl("prixEpicesKg", 25.0),
                        statut = pObj.str("statut", "EN_COURS"),
                        commentaireGeneral = pObj.str("commentaireGeneral"),
                        versionRecetteUtilisee = pObj.intVal("versionRecetteUtilisee", 1),
                        activerRevente = pObj.bool("activerRevente", true),
                        prixReventeUnitaireFixe = pObj.dbl("prixReventeUnitaireFixe", 0.0),
                        modeSalage = pObj.str("modeSalage", "RECOUVREMENT_SEL")
                    )
                    val newProjId = dao.insertProjet(newProjEntity)
                    if (oldProjId.isNotBlank()) projetIdMap[oldProjId] = newProjId

                    // Sorties découpe
                    if (obj.has("sortiesDecoupe") && obj.get("sortiesDecoupe").isJsonArray) {
                        val sorties = obj.getAsJsonArray("sortiesDecoupe").mapNotNull { se ->
                            if (!se.isJsonObject) return@mapNotNull null
                            val so = se.asJsonObject
                            ProjetSortieDecoupeEntity(
                                id = 0,
                                projetId = newProjId,
                                codeSortie = so.str("codeSortie"),
                                nom = so.str("nom"),
                                unite = so.str("unite", "pièce"),
                                actif = so.bool("actif", true),
                                quantitePrevue = so.dbl("quantitePrevue"),
                                quantiteReelle = so.dbl("quantiteReelle"),
                                valeurRefUnitaire = so.dbl("valeurRefUnitaire"),
                                fraisTransfoUnitaire = so.dbl("fraisTransfoUnitaire"),
                                commentaireSortie = so.str("commentaireSortie"),
                                prixReventeUnitaire = so.dbl("prixReventeUnitaire")
                            )
                        }
                        if (sorties.isNotEmpty()) dao.insertProjetSorties(sorties)
                    }

                    // Lots (+ historiquePesees si issu de PWA)
                    val lotIdMap = mutableMapOf<Long, Long>()
                    if (obj.has("lots") && obj.get("lots").isJsonArray) {
                        obj.getAsJsonArray("lots").forEach { le ->
                            if (!le.isJsonObject) return@forEach
                            val lo = le.asJsonObject
                            val oldLotId = lo.lng("id", -1L)
                            val newLotId = dao.insertProjetLot(
                                ProjetLotEntity(
                                    id = 0,
                                    projetId = newProjId,
                                    nomProduit = lo.str("nomProduit", newProjEntity.nomRecettePrincipale),
                                    variante = lo.str("variante", "Standard"),
                                    quantitePrevue = lo.dbl("quantitePrevue", 1.0),
                                    quantiteReelle = lo.dbl("quantiteReelle", 1.0),
                                    unite = lo.str("unite", "pièce"),
                                    epicesUtiliseesGrammes = lo.dbl("epicesUtiliseesGrammes"),
                                    dureeSalageHeures = lo.dbl("dureeSalageHeures", 24.0),
                                    poidsInitialGrammes = lo.dbl("poidsInitialGrammes"),
                                    poidsActuelGrammes = lo.dbl("poidsActuelGrammes"),
                                    commentaire = lo.str("commentaire"),
                                    noteSur5 = lo.intVal("noteSur5", 0)
                                )
                            )
                            if (oldLotId > 0L) lotIdMap[oldLotId] = newLotId

                            if (lo.has("historiquePesees") && lo.get("historiquePesees").isJsonArray) {
                                lo.getAsJsonArray("historiquePesees").forEach { pe ->
                                    if (!pe.isJsonObject) return@forEach
                                    val po = pe.asJsonObject
                                    dao.insertProjetPesee(
                                        ProjetPeseeEntity(
                                            id = 0,
                                            lotId = newLotId,
                                            projetId = newProjId,
                                            dateMillis = if (po.has("dateMillis")) po.lng("dateMillis") else parseDateToMillis(po.str("date")),
                                            poidsGrammes = po.dbl("poidsGrammes"),
                                            pertePct = po.dbl("pertePct"),
                                            note = po.str("note")
                                        )
                                    )
                                }
                            }
                        }
                    }

                    // Étapes
                    val etapeIdMap = mutableMapOf<Long, Long>()
                    if (obj.has("etapes") && obj.get("etapes").isJsonArray) {
                        obj.getAsJsonArray("etapes").forEachIndexed { idx, ee ->
                            if (!ee.isJsonObject) return@forEachIndexed
                            val eo = ee.asJsonObject
                            val titre = eo.str("titre").trim()
                            if (titre.isBlank()) return@forEachIndexed
                            val oldEtapeId = eo.lng("id", -1L)
                            val newEtapeId = dao.insertProjetEtape(
                                ProjetEtapeEntity(
                                    id = 0,
                                    projetId = newProjId,
                                    ordre = eo.intVal("ordre", idx + 1),
                                    jourLibelle = eo.str("jourLibelle", "Jour 1"),
                                    titre = titre,
                                    instructions = eo.str("instructions"),
                                    astuce = eo.str("astuce"),
                                    debutPrevuMillis = eo.lng("debutPrevuMillis", dateDebutMillis),
                                    dureeMinutes = eo.intVal("dureeMinutes", 60),
                                    varianteCible = eo.str("varianteCible"),
                                    terminee = eo.bool("terminee", eo.bool("fait", false)),
                                    rappelProgramme = false,
                                    noteEtape = eo.str("noteEtape")
                                )
                            )
                            if (oldEtapeId > 0L) etapeIdMap[oldEtapeId] = newEtapeId
                        }
                    }

                    // Photos d'étapes
                    if (obj.has("photosEtapes") && obj.get("photosEtapes").isJsonArray) {
                        obj.getAsJsonArray("photosEtapes").forEach { phe ->
                            if (!phe.isJsonObject) return@forEach
                            val pho = phe.asJsonObject
                            val chemin = pho.str("cheminFichier").trim()
                            if (chemin.isBlank()) return@forEach
                            val mappedEtapeId = etapeIdMap[pho.lng("etapeId", -1L)] ?: etapeIdMap.values.firstOrNull()
                            if (mappedEtapeId != null) {
                                dao.insertProjetEtapePhoto(
                                    ProjetEtapePhotoEntity(
                                        id = 0,
                                        etapeId = mappedEtapeId,
                                        projetId = newProjId,
                                        cheminFichier = chemin,
                                        legende = pho.str("legende"),
                                        tailleOctets = pho.lng("tailleOctets", 0L),
                                        dateAjoutMillis = pho.lng("dateAjoutMillis", System.currentTimeMillis())
                                    )
                                )
                            }
                        }
                    }

                    // Pesées (format Android)
                    if (obj.has("pesees") && obj.get("pesees").isJsonArray) {
                        obj.getAsJsonArray("pesees").forEach { pe ->
                            if (!pe.isJsonObject) return@forEach
                            val po = pe.asJsonObject
                            val mappedLotId = lotIdMap[po.lng("lotId", -1L)] ?: lotIdMap.values.firstOrNull()
                            if (mappedLotId != null) {
                                dao.insertProjetPesee(
                                    ProjetPeseeEntity(
                                        id = 0,
                                        lotId = mappedLotId,
                                        projetId = newProjId,
                                        dateMillis = po.lng("dateMillis", System.currentTimeMillis()),
                                        poidsGrammes = po.dbl("poidsGrammes"),
                                        pertePct = po.dbl("pertePct"),
                                        note = po.str("note")
                                    )
                                )
                            }
                        }
                    }

                    existingProjets.add(
                        ProjetComplet(newProjEntity.copy(id = newProjId), emptyList(), emptyList(), emptyList(), emptyList(), emptyList(), emptyList(), emptyList())
                    )
                    importedProjets++
                }
            }

            // 6. Courses (Android & PWA, sans doublons, projetId nullable)
            if (root.has("courses") && root.get("courses").isJsonArray) {
                val existingCourses = dao.getAllCoursesOnce().toMutableList()
                root.getAsJsonArray("courses").forEach { el ->
                    if (!el.isJsonObject) return@forEach
                    val obj = el.asJsonObject
                    val nomIng = obj.str("nomIngredient", obj.str("nom")).trim()
                    if (nomIng.isBlank()) return@forEach

                    val rawProjId = obj.str("projetId")
                    val nomProjet = obj.str("nomProjet", obj.str("projetNom", "Hors projet")).ifBlank { "Hors projet" }
                    val targetProjId = if (rawProjId.isBlank() || rawProjId == "null" || rawProjId == "0") {
                        null
                    } else {
                        projetIdMap[rawProjId] ?: existingProjets.find {
                            it.projet.nom.trim().equals(nomProjet, ignoreCase = true)
                        }?.projet?.id
                    }

                    val qte = obj.dbl("quantiteRequise", obj.dbl("qte", 1.0))
                    val unite = obj.str("unite", "pièce")
                    val prixEst = obj.dbl("prixEstimeTotal", obj.dbl("prix", 0.0))
                    val prixPaye = obj.dbl("prixReelPaye", 0.0)
                    val achete = obj.bool("achete", false)
                    val categorie = obj.str("categorie", "AUTRE")

                    val dejaPresent = existingCourses.any {
                        it.projetId == targetProjId &&
                            it.nomProjet.equals(nomProjet, ignoreCase = true) &&
                            it.nomIngredient.equals(nomIng, ignoreCase = true) &&
                            abs(it.quantiteRequise - qte) < 0.01 &&
                            it.unite.equals(unite, ignoreCase = true)
                    }
                    if (!dejaPresent) {
                        val c = ProjetCourseEntity(
                            id = 0,
                            projetId = targetProjId,
                            nomProjet = nomProjet,
                            nomIngredient = nomIng,
                            categorie = categorie,
                            quantiteRequise = qte,
                            unite = unite,
                            prixEstimeTotal = prixEst,
                            prixReelPaye = prixPaye,
                            achete = achete
                        )
                        dao.insertProjetCourse(c)
                        existingCourses.add(c)
                        importedCourses++
                    }
                }
            }

            // 7. Commandes (Android & PWA, sans doublons)
            if (root.has("commandes") && root.get("commandes").isJsonArray) {
                val existingCommandes = dao.getAllCommandesOnce().toMutableList()
                root.getAsJsonArray("commandes").forEach { el ->
                    if (!el.isJsonObject) return@forEach
                    val obj = el.asJsonObject
                    val nomAcheteur = obj.str("nomAcheteur", obj.str("client")).trim()
                    val produit = obj.str("produit", "Charcuterie").trim()
                    if (nomAcheteur.isBlank()) return@forEach

                    val rawProjId = obj.str("projetId")
                    val projetNom = obj.str("projetNom")
                    val targetProjId = projetIdMap[rawProjId]
                        ?: existingProjets.find {
                            projetNom.isNotBlank() && it.projet.nom.trim().equals(projetNom, ignoreCase = true)
                        }?.projet?.id

                    if (targetProjId == null) return@forEach

                    val quantite = obj.dbl("quantite", 1.0)
                    val unite = obj.str("unite", "pièce")
                    val prixUnit = obj.dbl("prixUnitaire", 0.0)
                    val montantTotal = obj.dbl("montantTotal", obj.dbl("prix", quantite * prixUnit))
                    val paye = obj.bool("paye", false)
                    val moyenPaiement = obj.str("moyenPaiement")
                    val livre = obj.bool("livre", false)
                    val commentaire = obj.str("commentaire")
                    val detailsLignes = obj.str("detailsLignes")

                    val dejaPresent = existingCommandes.any {
                        it.projetId == targetProjId &&
                            it.nomAcheteur.trim().equals(nomAcheteur, ignoreCase = true) &&
                            it.produit.trim().equals(produit, ignoreCase = true) &&
                            abs(it.montantTotal - montantTotal) < 0.01 &&
                            abs(it.quantite - quantite) < 0.01
                    }
                    if (!dejaPresent) {
                        val cmd = ProjetCommandeEntity(
                            id = 0,
                            projetId = targetProjId,
                            nomAcheteur = nomAcheteur,
                            produit = produit,
                            quantite = quantite,
                            unite = unite,
                            prixUnitaire = prixUnit,
                            montantTotal = montantTotal,
                            paye = paye,
                            moyenPaiement = moyenPaiement,
                            livre = livre,
                            commentaire = commentaire,
                            detailsLignes = detailsLignes
                        )
                        dao.insertProjetCommande(cmd)
                        existingCommandes.add(cmd)
                        importedCommandes++
                    }
                }
            }

            // 8. Évaluations (Android & PWA, sans doublons)
            if (root.has("evaluations") && root.get("evaluations").isJsonArray) {
                root.getAsJsonArray("evaluations").forEach { el ->
                    if (!el.isJsonObject) return@forEach
                    val obj = el.asJsonObject
                    val rawProjId = obj.str("projetId")
                    val nomRec = obj.str("nomRecette").trim()
                    val targetProjId = projetIdMap[rawProjId] ?: rawProjId.toLongOrNull() ?: return@forEach
                    val rawRecId = obj.str("recetteId", obj.str("recetteCode"))
                    val targetRecId = recetteIdMap[rawRecId]
                        ?: existingRecettes.find { it.recette.nom.trim().equals(nomRec, ignoreCase = true) }?.recette?.id
                        ?: rawRecId.toLongOrNull()
                        ?: 0L

                    val dateMillis = if (obj.has("dateMillis") && !obj.get("dateMillis").isJsonNull) {
                        obj.lng("dateMillis")
                    } else {
                        parseDateToMillis(obj.str("date"))
                    }
                    dao.deleteEvaluationForProjet(targetProjId)
                    dao.insertEvaluation(
                        ProjetEvaluationEntity(
                            id = 0,
                            projetId = targetProjId,
                            recetteId = targetRecId,
                            nomRecette = nomRec,
                            dateMillis = dateMillis,
                            noteGlobale = obj.intVal("noteGlobale", 5).coerceIn(1, 5),
                            texture = obj.str("texture", "Équilibrée / Fondante"),
                            salinite = obj.str("salinite", "Parfaite"),
                            aromes = obj.str("aromes", "Équilibrés"),
                            commentaire = obj.str("commentaire").trim()
                        )
                    )
                }
            }
        }
        return "Import terminé : $importedProjets session(s), $importedRecettes recette(s), $importedCourses course(s), $importedCommandes commande(s), $importedCave relevé(s) de cave."
    }
}
