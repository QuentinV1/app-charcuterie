package com.quentin.charcuterie.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(
    entities = [
        ParametreEntity::class,
        IngredientEntity::class,
        RecetteEntity::class,
        RecetteIngredientEntity::class,
        RecetteEtapeEntity::class,
        RecetteVarianteEntity::class,
        RecetteSortieDecoupeEntity::class,
        ProjetEntity::class,
        ProjetSortieDecoupeEntity::class,
        ProjetLotEntity::class,
        ProjetEtapeEntity::class,
        ProjetCourseEntity::class,
        ProjetPeseeEntity::class,
        ProjetCommandeEntity::class,
        ClientEntity::class,
        ProjetEtapePhotoEntity::class,
        CaveReleveEntity::class,
        ProjetEvaluationEntity::class
    ],
    version = 10,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun dao(): CharcuterieDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE projets ADD COLUMN activerRevente INTEGER NOT NULL DEFAULT 1")
                db.execSQL("ALTER TABLE projets ADD COLUMN prixReventeUnitaireFixe REAL NOT NULL DEFAULT 0.0")
                db.execSQL("ALTER TABLE projet_sorties_decoupe ADD COLUMN prixReventeUnitaire REAL NOT NULL DEFAULT 0.0")
                db.execSQL(
                    "INSERT OR IGNORE INTO parametres (cle, libelle, categorie, valeur, unite, description) " +
                        "VALUES ('ACTIVER_REVENTE', 'Activer l''option Revente', 'GENERAL', 1.0, 'option', 'Afficher ou masquer les éléments liés à la revente')"
                )
                db.execSQL(
                    "UPDATE parametres SET libelle = 'Majoration par défaut (prix de revente conseillé)', " +
                        "description = 'Appliquée au coût de revient pour suggérer un prix de revente conseillé' " +
                        "WHERE cle = 'MARGE_AMIS_PCT'"
                )
            }
        }

        private val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE recettes ADD COLUMN masquee INTEGER NOT NULL DEFAULT 0")
            }
        }

        private val MIGRATION_3_4 = object : Migration(3, 4) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE projet_commandes ADD COLUMN detailsLignes TEXT NOT NULL DEFAULT ''")
            }
        }

        private val MIGRATION_4_5 = object : Migration(4, 5) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, nom TEXT NOT NULL)")
                db.execSQL(
                    "INSERT INTO clients (nom) " +
                        "SELECT DISTINCT TRIM(nomAcheteur) FROM projet_commandes " +
                        "WHERE TRIM(nomAcheteur) != ''"
                )
            }
        }

        private val MIGRATION_5_6 = object : Migration(5, 6) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "CREATE TABLE IF NOT EXISTS projet_etape_photos (" +
                        "id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, " +
                        "etapeId INTEGER NOT NULL, " +
                        "projetId INTEGER NOT NULL, " +
                        "cheminFichier TEXT NOT NULL, " +
                        "legende TEXT NOT NULL DEFAULT '', " +
                        "tailleOctets INTEGER NOT NULL DEFAULT 0, " +
                        "dateAjoutMillis INTEGER NOT NULL DEFAULT 0, " +
                        "FOREIGN KEY(etapeId) REFERENCES projet_etapes(id) ON DELETE CASCADE, " +
                        "FOREIGN KEY(projetId) REFERENCES projets(id) ON DELETE CASCADE)"
                )
                db.execSQL("CREATE INDEX IF NOT EXISTS index_projet_etape_photos_etapeId ON projet_etape_photos(etapeId)")
                db.execSQL("CREATE INDEX IF NOT EXISTS index_projet_etape_photos_projetId ON projet_etape_photos(projetId)")
            }
        }

        private val MIGRATION_6_7 = object : Migration(6, 7) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "CREATE TABLE IF NOT EXISTS cave_releves (" +
                        "id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, " +
                        "dateMillis INTEGER NOT NULL, " +
                        "temperature REAL NOT NULL, " +
                        "hygrometrie REAL NOT NULL, " +
                        "note TEXT NOT NULL DEFAULT '')"
                )
                db.execSQL(
                    "CREATE TABLE IF NOT EXISTS projet_evaluations (" +
                        "id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, " +
                        "projetId INTEGER NOT NULL, " +
                        "recetteId INTEGER NOT NULL, " +
                        "nomRecette TEXT NOT NULL, " +
                        "dateMillis INTEGER NOT NULL, " +
                        "noteGlobale INTEGER NOT NULL DEFAULT 5, " +
                        "texture TEXT NOT NULL DEFAULT 'Équilibrée / Fondante', " +
                        "salinite TEXT NOT NULL DEFAULT 'Parfaite', " +
                        "aromes TEXT NOT NULL DEFAULT 'Équilibrés', " +
                        "commentaire TEXT NOT NULL DEFAULT '')"
                )
            }
        }

        private val MIGRATION_7_8 = object : Migration(7, 8) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "CREATE TABLE IF NOT EXISTS `projet_courses_new` (" +
                        "`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, " +
                        "`projetId` INTEGER, " +
                        "`nomProjet` TEXT NOT NULL, " +
                        "`nomIngredient` TEXT NOT NULL, " +
                        "`categorie` TEXT NOT NULL, " +
                        "`quantiteRequise` REAL NOT NULL, " +
                        "`unite` TEXT NOT NULL, " +
                        "`prixEstimeTotal` REAL NOT NULL, " +
                        "`prixReelPaye` REAL NOT NULL, " +
                        "`achete` INTEGER NOT NULL, " +
                        "FOREIGN KEY(`projetId`) REFERENCES `projets`(`id`) ON DELETE CASCADE)"
                )
                db.execSQL(
                    "INSERT INTO `projet_courses_new` (`id`, `projetId`, `nomProjet`, `nomIngredient`, `categorie`, `quantiteRequise`, `unite`, `prixEstimeTotal`, `prixReelPaye`, `achete`) " +
                        "SELECT `id`, CASE WHEN `projetId` <= 0 THEN NULL ELSE `projetId` END, `nomProjet`, `nomIngredient`, `categorie`, `quantiteRequise`, `unite`, `prixEstimeTotal`, `prixReelPaye`, `achete` FROM `projet_courses`"
                )
                db.execSQL("DROP TABLE `projet_courses`")
                db.execSQL("ALTER TABLE `projet_courses_new` RENAME TO `projet_courses`")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_projet_courses_projetId` ON `projet_courses`(`projetId`)")
            }
        }

        private val MIGRATION_8_9 = object : Migration(8, 9) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE projets ADD COLUMN modeSalage TEXT NOT NULL DEFAULT 'RECOUVREMENT_SEL'")
            }
        }

        private val MIGRATION_9_10 = object : Migration(9, 10) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "CREATE TABLE IF NOT EXISTS `projet_evaluations_new` (" +
                        "`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, " +
                        "`projetId` INTEGER NOT NULL, " +
                        "`recetteId` INTEGER NOT NULL, " +
                        "`nomRecette` TEXT NOT NULL, " +
                        "`dateMillis` INTEGER NOT NULL, " +
                        "`noteGlobale` INTEGER NOT NULL DEFAULT 5, " +
                        "`texture` TEXT NOT NULL DEFAULT 'Équilibrée / Fondante', " +
                        "`salinite` TEXT NOT NULL DEFAULT 'Parfaite', " +
                        "`aromes` TEXT NOT NULL DEFAULT 'Équilibrés', " +
                        "`commentaire` TEXT NOT NULL DEFAULT '', " +
                        "FOREIGN KEY(`projetId`) REFERENCES `projets`(`id`) ON DELETE CASCADE)"
                )
                db.execSQL(
                    "INSERT INTO `projet_evaluations_new` (`id`, `projetId`, `recetteId`, `nomRecette`, `dateMillis`, `noteGlobale`, `texture`, `salinite`, `aromes`, `commentaire`) " +
                        "SELECT `id`, `projetId`, `recetteId`, `nomRecette`, `dateMillis`, `noteGlobale`, `texture`, `salinite`, `aromes`, `commentaire` FROM `projet_evaluations` " +
                        "WHERE `projetId` IN (SELECT `id` FROM `projets`)"
                )
                db.execSQL("DROP TABLE `projet_evaluations`")
                db.execSQL("ALTER TABLE `projet_evaluations_new` RENAME TO `projet_evaluations`")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_projet_evaluations_projetId` ON `projet_evaluations`(`projetId`)")
            }
        }

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "atelier_charcuterie.db"
                )
                    .addMigrations(MIGRATION_1_2, MIGRATION_2_3, MIGRATION_3_4, MIGRATION_4_5, MIGRATION_5_6, MIGRATION_6_7, MIGRATION_7_8, MIGRATION_8_9, MIGRATION_9_10)
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
