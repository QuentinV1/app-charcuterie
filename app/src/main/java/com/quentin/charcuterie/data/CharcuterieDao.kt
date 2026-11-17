package com.quentin.charcuterie.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

data class RecetteComplete(
    @Embedded val recette: RecetteEntity,
    @Relation(parentColumn = "id", entityColumn = "recetteId")
    val ingredients: List<RecetteIngredientEntity>,
    @Relation(parentColumn = "id", entityColumn = "recetteId")
    val etapes: List<RecetteEtapeEntity>,
    @Relation(parentColumn = "id", entityColumn = "recetteId")
    val variantes: List<RecetteVarianteEntity>,
    @Relation(parentColumn = "id", entityColumn = "recetteId")
    val sortiesDecoupe: List<RecetteSortieDecoupeEntity>
)

data class ProjetComplet(
    @Embedded val projet: ProjetEntity,
    @Relation(parentColumn = "id", entityColumn = "projetId")
    val sortiesDecoupe: List<ProjetSortieDecoupeEntity>,
    @Relation(parentColumn = "id", entityColumn = "projetId")
    val lots: List<ProjetLotEntity>,
    @Relation(parentColumn = "id", entityColumn = "projetId")
    val etapes: List<ProjetEtapeEntity>,
    @Relation(parentColumn = "id", entityColumn = "projetId")
    val courses: List<ProjetCourseEntity>,
    @Relation(parentColumn = "id", entityColumn = "projetId")
    val commandes: List<ProjetCommandeEntity>,
    @Relation(parentColumn = "id", entityColumn = "projetId")
    val pesees: List<ProjetPeseeEntity>,
    @Relation(parentColumn = "id", entityColumn = "projetId")
    val photosEtapes: List<ProjetEtapePhotoEntity>
)

@Dao
interface CharcuterieDao {

    // --- Paramètres ---
    @Query("SELECT * FROM parametres ORDER BY categorie, cle")
    fun observeParametres(): Flow<List<ParametreEntity>>

    @Query("SELECT * FROM parametres")
    suspend fun getParametresList(): List<ParametreEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertParametres(params: List<ParametreEntity>)

    @Update
    suspend fun updateParametre(param: ParametreEntity)

    // --- Ingrédients ---
    @Query("SELECT * FROM ingredients ORDER BY categorie, nom")
    fun observeIngredients(): Flow<List<IngredientEntity>>

    @Query("SELECT * FROM ingredients ORDER BY categorie, nom")
    suspend fun getAllIngredientsOnce(): List<IngredientEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertIngredients(items: List<IngredientEntity>)

    @Update
    suspend fun updateIngredient(item: IngredientEntity)

    // --- Recettes ---
    @Transaction
    @Query("SELECT * FROM recettes ORDER BY famille, nom")
    fun observeRecettesCompletes(): Flow<List<RecetteComplete>>

    @Transaction
    @Query("SELECT * FROM recettes WHERE id = :id")
    fun observeRecetteComplete(id: Long): Flow<RecetteComplete?>

    @Transaction
    @Query("SELECT * FROM recettes WHERE id = :id")
    suspend fun getRecetteComplete(id: Long): RecetteComplete?

    @Transaction
    @Query("SELECT * FROM recettes WHERE code = :code LIMIT 1")
    suspend fun getRecetteByCode(code: String): RecetteComplete?

    @Query("SELECT COUNT(*) FROM recettes")
    suspend fun countRecettes(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecette(recette: RecetteEntity): Long

    @Update
    suspend fun updateRecette(recette: RecetteEntity)

    @Delete
    suspend fun deleteRecette(recette: RecetteEntity)

    @Query("DELETE FROM recettes WHERE id = :id")
    suspend fun deleteRecetteById(id: Long)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecetteIngredients(items: List<RecetteIngredientEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecetteingredient(item: RecetteIngredientEntity): Long

    @Update
    suspend fun updateRecetteIngredient(item: RecetteIngredientEntity)

    @Delete
    suspend fun deleteRecetteIngredient(item: RecetteIngredientEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecetteEtapes(items: List<RecetteEtapeEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecetteEtape(item: RecetteEtapeEntity): Long

    @Update
    suspend fun updateRecetteEtape(item: RecetteEtapeEntity)

    @Delete
    suspend fun deleteRecetteEtape(item: RecetteEtapeEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecetteVariantes(items: List<RecetteVarianteEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecetteVariante(item: RecetteVarianteEntity): Long

    @Update
    suspend fun updateRecetteVariante(item: RecetteVarianteEntity)

    @Delete
    suspend fun deleteRecetteVariante(item: RecetteVarianteEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecetteSorties(items: List<RecetteSortieDecoupeEntity>)

    // --- Projets ---
    @Transaction
    @Query("SELECT * FROM projets ORDER BY dateDebutMillis DESC")
    fun observeProjetsComplets(): Flow<List<ProjetComplet>>

    @Transaction
    @Query("SELECT * FROM projets WHERE id = :id")
    fun observeProjetComplet(id: Long): Flow<ProjetComplet?>

    @Transaction
    @Query("SELECT * FROM projets WHERE id = :id")
    suspend fun getProjetComplet(id: Long): ProjetComplet?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProjet(projet: ProjetEntity): Long

    @Update
    suspend fun updateProjet(projet: ProjetEntity)

    @Delete
    suspend fun deleteProjet(projet: ProjetEntity)

    @Query("DELETE FROM projets WHERE nom LIKE '%(Exemple)%' OR nom LIKE 'Week-end 10 Canards%'")
    suspend fun deleteDemoProjets()

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProjetSorties(items: List<ProjetSortieDecoupeEntity>)

    @Update
    suspend fun updateProjetSortie(item: ProjetSortieDecoupeEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProjetLots(items: List<ProjetLotEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProjetLot(item: ProjetLotEntity): Long

    @Update
    suspend fun updateProjetLot(item: ProjetLotEntity)

    @Delete
    suspend fun deleteProjetLot(item: ProjetLotEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProjetEtapes(items: List<ProjetEtapeEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProjetEtape(item: ProjetEtapeEntity): Long

    @Update
    suspend fun updateProjetEtape(item: ProjetEtapeEntity)

    @Query("SELECT * FROM projet_etapes WHERE projetId = :projetId ORDER BY ordre")
    suspend fun getEtapesForProjet(projetId: Long): List<ProjetEtapeEntity>

    @Query("SELECT * FROM projet_etapes WHERE rappelProgramme = 1 AND terminee = 0")
    suspend fun getEtapesAvecRappelActif(): List<ProjetEtapeEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProjetEtapePhoto(photo: ProjetEtapePhotoEntity): Long

    @Delete
    suspend fun deleteProjetEtapePhoto(photo: ProjetEtapePhotoEntity)

    @Query("SELECT * FROM projet_etape_photos WHERE projetId = :projetId")
    suspend fun getPhotosForProjet(projetId: Long): List<ProjetEtapePhotoEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProjetCourses(items: List<ProjetCourseEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProjetCourse(item: ProjetCourseEntity): Long

    @Update
    suspend fun updateProjetCourse(item: ProjetCourseEntity)

    @Delete
    suspend fun deleteProjetCourse(item: ProjetCourseEntity)

    @Query("SELECT * FROM projet_courses ORDER BY achete ASC, categorie ASC, nomIngredient ASC")
    fun observeToutesLesCourses(): Flow<List<ProjetCourseEntity>>

    @Query("DELETE FROM projet_courses WHERE achete = 1")
    suspend fun deleteCoursesAchetees()

    @Query("DELETE FROM projet_courses WHERE projetId = :projetId AND achete = 1")
    suspend fun deleteCoursesAcheteesPourProjet(projetId: Long)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProjetPesee(item: ProjetPeseeEntity): Long

    @Delete
    suspend fun deleteProjetPesee(item: ProjetPeseeEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProjetCommande(item: ProjetCommandeEntity): Long

    @Update
    suspend fun updateProjetCommande(item: ProjetCommandeEntity)

    @Delete
    suspend fun deleteProjetCommande(item: ProjetCommandeEntity)

    @Query("SELECT * FROM projet_commandes ORDER BY paye ASC, id DESC")
    fun observeToutesLesCommandes(): Flow<List<ProjetCommandeEntity>>

    // --- Clients ---
    @Query("SELECT * FROM clients ORDER BY nom COLLATE NOCASE ASC")
    fun observeClients(): Flow<List<ClientEntity>>

    @Query("SELECT * FROM clients ORDER BY nom COLLATE NOCASE ASC")
    suspend fun getAllClientsOnce(): List<ClientEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertClient(client: ClientEntity): Long

    @Update
    suspend fun updateClient(client: ClientEntity)

    @Delete
    suspend fun deleteClient(client: ClientEntity)

    @Query("UPDATE projet_commandes SET nomAcheteur = :nouveauNom WHERE LOWER(TRIM(nomAcheteur)) = LOWER(TRIM(:ancienNom))")
    suspend fun renommerAcheteurDansCommandes(ancienNom: String, nouveauNom: String)

    // --- Journal de Cave ---
    @Query("SELECT * FROM cave_releves ORDER BY dateMillis DESC")
    fun observeCaveReleves(): Flow<List<CaveReleveEntity>>

    @Query("SELECT * FROM cave_releves ORDER BY dateMillis DESC")
    suspend fun getAllCaveRelevesOnce(): List<CaveReleveEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCaveReleve(item: CaveReleveEntity): Long

    @Delete
    suspend fun deleteCaveReleve(item: CaveReleveEntity)

    // --- Évaluations ---
    @Query("SELECT * FROM projet_evaluations ORDER BY dateMillis DESC")
    fun observeEvaluations(): Flow<List<ProjetEvaluationEntity>>

    @Query("SELECT * FROM projet_evaluations ORDER BY dateMillis DESC")
    suspend fun getAllEvaluationsOnce(): List<ProjetEvaluationEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvaluation(item: ProjetEvaluationEntity): Long

    @Query("DELETE FROM projet_evaluations WHERE projetId = :projetId")
    suspend fun deleteEvaluationForProjet(projetId: Long)

    // --- Helpers Export/Import ---
    @Transaction
    @Query("SELECT * FROM recettes ORDER BY famille, nom")
    suspend fun getAllRecettesCompletesOnce(): List<RecetteComplete>

    @Transaction
    @Query("SELECT * FROM projets ORDER BY dateDebutMillis DESC")
    suspend fun getAllProjetsCompletsOnce(): List<ProjetComplet>

    @Query("SELECT * FROM projet_courses")
    suspend fun getAllCoursesOnce(): List<ProjetCourseEntity>

    @Query("SELECT * FROM projets")
    suspend fun getAllProjetsOnce(): List<ProjetEntity>

    @Query("SELECT * FROM projet_lots")
    suspend fun getAllLotsOnce(): List<ProjetLotEntity>

    @Query("SELECT * FROM projet_pesees")
    suspend fun getAllPeseesOnce(): List<ProjetPeseeEntity>

    @Query("SELECT * FROM projet_commandes")
    suspend fun getAllCommandesOnce(): List<ProjetCommandeEntity>
}
