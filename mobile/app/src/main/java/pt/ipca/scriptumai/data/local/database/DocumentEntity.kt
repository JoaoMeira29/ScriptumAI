package pt.ipca.scriptumai.data.local.database

import androidx.room.Entity
import androidx.room.PrimaryKey
import pt.ipca.scriptumai.data.model.document.DocumentApiModel

@Entity(tableName = "documents")
data class DocumentEntity(
    @PrimaryKey val id: String,
    val organizationId: String,
    val uploadedBy: String,
    val uploadedByName: String,
    val departmentId: String?,
    val fileName: String,
    val originalName: String,
    val mimeType: String,
    val size: Long,
    val description: String?,
    val createdAt: String,
    val downloadUrl: String?,
    val aiStatus: String?,
    val aiSummary: String?,
    val aiKeywords: String?,
    val aiEntities: String?,
    val aiConfidence: Double?,
    val aiError: String?,
    val cachedAt: Long = System.currentTimeMillis(),
) {
    fun toApiModel(): DocumentApiModel = DocumentApiModel(
        id = id,
        organizationId = organizationId,
        uploadedBy = uploadedBy,
        uploadedByName = uploadedByName,
        departmentId = departmentId,
        fileName = fileName,
        originalName = originalName,
        mimeType = mimeType,
        size = size,
        description = description,
        createdAt = createdAt,
        downloadUrl = downloadUrl,
        aiStatus = aiStatus,
        aiSummary = aiSummary,
        aiKeywords = aiKeywords?.split("||")?.filter { it.isNotEmpty() },
        aiEntities = aiEntities?.split("||")?.filter { it.isNotEmpty() },
        aiConfidence = aiConfidence,
        aiError = aiError,
    )

    companion object {
        fun fromApiModel(model: DocumentApiModel) = DocumentEntity(
            id = model.id,
            organizationId = model.organizationId,
            uploadedBy = model.uploadedBy,
            uploadedByName = model.uploadedByName,
            departmentId = model.departmentId,
            fileName = model.fileName,
            originalName = model.originalName,
            mimeType = model.mimeType,
            size = model.size,
            description = model.description,
            createdAt = model.createdAt,
            downloadUrl = model.downloadUrl,
            aiStatus = model.aiStatus,
            aiSummary = model.aiSummary,
            aiKeywords = model.aiKeywords?.joinToString("||"),
            aiEntities = model.aiEntities?.joinToString("||"),
            aiConfidence = model.aiConfidence,
            aiError = model.aiError,
        )
    }
}
