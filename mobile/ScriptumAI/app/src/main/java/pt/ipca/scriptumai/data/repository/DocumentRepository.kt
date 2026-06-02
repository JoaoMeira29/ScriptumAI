package pt.ipca.scriptumai.data.repository

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import pt.ipca.scriptumai.data.local.TokenManager
import pt.ipca.scriptumai.data.local.database.DocumentEntity
import pt.ipca.scriptumai.data.local.database.ScriptumDatabase
import pt.ipca.scriptumai.data.model.ChatHistoryMessage
import pt.ipca.scriptumai.data.model.ChatRequest
import pt.ipca.scriptumai.data.model.ChatResponse
import pt.ipca.scriptumai.data.model.ChatUsageResponse
import pt.ipca.scriptumai.data.model.GlobalChatHistoryMessage
import pt.ipca.scriptumai.data.model.GlobalChatRequest
import pt.ipca.scriptumai.data.model.GlobalChatResponse
import pt.ipca.scriptumai.data.model.GlobalChatUsageResponse
import pt.ipca.scriptumai.data.model.document.DepartmentApiModel
import pt.ipca.scriptumai.data.model.document.DocumentApiModel
import pt.ipca.scriptumai.data.model.document.UpdateDocumentRequest
import pt.ipca.scriptumai.data.network.DepartmentApiService
import pt.ipca.scriptumai.data.network.DocumentApiService
import pt.ipca.scriptumai.data.network.RetrofitClient
import java.io.File

class DocumentRepository {

    private val documentApi: DocumentApiService = RetrofitClient.createService()
    private val chatDocumentApi: DocumentApiService = RetrofitClient.createChatService()
    private val departmentApi: DepartmentApiService = RetrofitClient.createService()

    private val documentDao by lazy {
        ScriptumDatabase.getInstance(TokenManager.getAppContext()).documentDao()
    }

    suspend fun listDocuments(): Result<List<DocumentApiModel>> {
        val orgId = TokenManager.getOrgId()
        return try {
            val response = documentApi.listDocuments(TokenManager.bearerHeader(), limit = 1000)
            val docs = response.data
            if (orgId != null) {
                documentDao.deleteByOrganization(orgId)
                documentDao.insertAll(docs.map { DocumentEntity.fromApiModel(it) })
            }
            Result.success(docs)
        } catch (e: Exception) {
            if (orgId != null) {
                val cached = documentDao.getByOrganization(orgId)
                if (cached.isNotEmpty()) {
                    return Result.success(cached.map { it.toApiModel() })
                }
            }
            Result.failure(e)
        }
    }

    suspend fun getDocument(id: String): Result<DocumentApiModel> = runCatching {
        documentApi.getDocument(TokenManager.bearerHeader(), id)
    }

    suspend fun uploadDocument(file: File, description: String? = null, departmentId: String? = null, name: String? = null): Result<DocumentApiModel> = runCatching {
        val mimeType = when (file.extension.lowercase()) {
            "pdf" -> "application/pdf"
            "doc" -> "application/msword"
            "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            "jpg", "jpeg" -> "image/jpeg"
            "png" -> "image/png"
            "webp" -> "image/webp"
            "txt" -> "text/plain"
            else -> "application/octet-stream"
        }
        val requestFile = file.asRequestBody(mimeType.toMediaTypeOrNull())
        val builder = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("file", file.name, requestFile)
        if (!description.isNullOrBlank()) {
            builder.addFormDataPart("description", description)
        }
        if (!departmentId.isNullOrBlank()) {
            builder.addFormDataPart("departmentId", departmentId)
        }
        if (!name.isNullOrBlank()) {
            builder.addFormDataPart("name", name)
        }
        documentApi.uploadDocument(TokenManager.bearerHeader(), builder.build())
    }

    suspend fun updateDocument(id: String, request: UpdateDocumentRequest): Result<DocumentApiModel> = runCatching {
        val updated = documentApi.updateDocument(TokenManager.bearerHeader(), id, request)
        documentDao.insertAll(listOf(DocumentEntity.fromApiModel(updated)))
        updated
    }

    suspend fun deleteDocument(id: String): Result<Unit> = runCatching {
        documentApi.deleteDocument(TokenManager.bearerHeader(), id)
        documentDao.deleteById(id)
    }

    suspend fun listDepartments(): Result<List<DepartmentApiModel>> = runCatching {
        val orgId = TokenManager.getOrgId() ?: error("Organization ID not available")
        departmentApi.listDepartments(TokenManager.bearerHeader(), orgId)
    }

    suspend fun listUserDepartments(): Result<List<DepartmentApiModel>> = runCatching {
        val orgId = TokenManager.getOrgId() ?: error("Organization ID not available")
        val userId = TokenManager.getUserId() ?: error("User ID not available")
        departmentApi.listUserDepartments(TokenManager.bearerHeader(), orgId, userId)
    }

    suspend fun askQuestion(documentId: String, question: String): Result<ChatResponse> = runCatching {
        chatDocumentApi.chat(TokenManager.bearerHeader(), documentId, ChatRequest(question))
    }

    suspend fun getDocumentChatHistory(documentId: String): Result<List<ChatHistoryMessage>> = runCatching {
        documentApi.getDocumentChatHistory(TokenManager.bearerHeader(), documentId)
    }

    suspend fun getChatUsage(): Result<ChatUsageResponse> = runCatching {
        documentApi.getChatUsage(TokenManager.bearerHeader())
    }

    suspend fun getDocumentChatUsage(documentId: String): Result<ChatUsageResponse> = runCatching {
        documentApi.getDocumentChatUsage(TokenManager.bearerHeader(), documentId)
    }

    private val globalChatApi: DocumentApiService = RetrofitClient.createChatService()

    suspend fun globalChat(message: String): Result<GlobalChatResponse> = runCatching {
        globalChatApi.globalChat(TokenManager.bearerHeader(), GlobalChatRequest(message))
    }

    suspend fun getGlobalChatHistory(): Result<List<GlobalChatHistoryMessage>> = runCatching {
        documentApi.getGlobalChatHistory(TokenManager.bearerHeader())
    }

    suspend fun getGlobalChatUsage(): Result<GlobalChatUsageResponse> = runCatching {
        documentApi.getGlobalChatUsage(TokenManager.bearerHeader())
    }
}
