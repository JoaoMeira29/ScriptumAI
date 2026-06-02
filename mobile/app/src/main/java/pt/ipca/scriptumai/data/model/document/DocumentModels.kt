package pt.ipca.scriptumai.data.model.document

import com.google.gson.annotations.SerializedName

data class DocumentApiModel(
    val id: String,
    @SerializedName("organizationId") val organizationId: String,
    @SerializedName("uploadedBy") val uploadedBy: String,
    @SerializedName("uploadedByName") val uploadedByName: String,
    @SerializedName("departmentId") val departmentId: String?,
    @SerializedName("fileName") val fileName: String,
    @SerializedName("originalName") val originalName: String,
    @SerializedName("mimeType") val mimeType: String,
    val size: Long,
    val description: String?,
    @SerializedName("createdAt") val createdAt: String,
    @SerializedName("downloadUrl") val downloadUrl: String?,
    @SerializedName("aiStatus") val aiStatus: String?,
    @SerializedName("aiSummary") val aiSummary: String?,
    @SerializedName("aiKeywords") val aiKeywords: List<String>?,
    @SerializedName("aiEntities") val aiEntities: List<String>?,
    @SerializedName("aiConfidence") val aiConfidence: Double?,
    @SerializedName("aiError") val aiError: String?,
)

data class UpdateDocumentRequest(
    @SerializedName("originalName") val originalName: String? = null,
    @SerializedName("description")  val description: String?  = null,
    @SerializedName("departmentId") val departmentId: String?  = null,
)

data class PaginationInfo(
    val page: Int,
    val limit: Int,
    val total: Int,
    val totalPages: Int,
)

data class PaginatedDocuments(
    val data: List<DocumentApiModel>,
    val pagination: PaginationInfo,
)

data class DepartmentApiModel(
    val id: String,
    @SerializedName("organizationId") val organizationId: String,
    val name: String,
    val description: String?,
    @SerializedName("createdAt") val createdAt: String,
    @SerializedName("updatedAt") val updatedAt: String,
)
