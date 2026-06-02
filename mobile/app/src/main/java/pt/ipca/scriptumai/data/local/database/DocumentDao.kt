package pt.ipca.scriptumai.data.local.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface DocumentDao {

    @Query("SELECT * FROM documents WHERE organizationId = :orgId ORDER BY createdAt DESC")
    suspend fun getByOrganization(orgId: String): List<DocumentEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(documents: List<DocumentEntity>)

    @Query("DELETE FROM documents WHERE organizationId = :orgId")
    suspend fun deleteByOrganization(orgId: String)

    @Query("DELETE FROM documents WHERE id = :documentId")
    suspend fun deleteById(documentId: String)

    @Query("DELETE FROM documents")
    suspend fun deleteAll()
}
