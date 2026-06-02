package pt.ipca.scriptumai.data.local.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [DocumentEntity::class], version = 1, exportSchema = false)
abstract class ScriptumDatabase : RoomDatabase() {

    abstract fun documentDao(): DocumentDao

    companion object {
        @Volatile
        private var instance: ScriptumDatabase? = null

        @Suppress("DEPRECATION")
        fun getInstance(context: Context): ScriptumDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    ScriptumDatabase::class.java,
                    "scriptumai.db"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                    .also { instance = it }
            }
    }
}
