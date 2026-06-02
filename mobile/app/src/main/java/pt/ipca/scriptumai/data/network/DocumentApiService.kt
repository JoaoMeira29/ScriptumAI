package pt.ipca.scriptumai.data.network

import okhttp3.MultipartBody
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
import pt.ipca.scriptumai.data.model.document.PaginatedDocuments
import pt.ipca.scriptumai.data.model.document.UpdateDocumentRequest
import retrofit2.http.*

interface DocumentApiService {

    @POST("documents")
    suspend fun uploadDocument(
        @Header("Authorization") bearer: String,
        @Body body: MultipartBody,
    ): DocumentApiModel

    @GET("documents")
    suspend fun listDocuments(
        @Header("Authorization") bearer: String,
        @retrofit2.http.Query("page") page: Int? = null,
        @retrofit2.http.Query("limit") limit: Int? = null,
        @retrofit2.http.Query("search") search: String? = null,
    ): PaginatedDocuments

    @GET("documents/{id}")
    suspend fun getDocument(
        @Header("Authorization") bearer: String,
        @Path("id") id: String,
    ): DocumentApiModel

    @PATCH("documents/{id}")
    suspend fun updateDocument(
        @Header("Authorization") bearer: String,
        @Path("id") id: String,
        @Body body: UpdateDocumentRequest,
    ): DocumentApiModel

    @DELETE("documents/{id}")
    suspend fun deleteDocument(
        @Header("Authorization") bearer: String,
        @Path("id") id: String,
    )

    @POST("documents/{id}/chat")
    suspend fun chat(
        @Header("Authorization") bearer: String,
        @Path("id") id: String,
        @Body body: ChatRequest,
    ): ChatResponse

    @GET("documents/{id}/chat/history")
    suspend fun getDocumentChatHistory(
        @Header("Authorization") bearer: String,
        @Path("id") id: String,
    ): List<ChatHistoryMessage>

    @GET("documents/chat/usage")
    suspend fun getChatUsage(
        @Header("Authorization") bearer: String,
    ): ChatUsageResponse

    @GET("documents/{id}/chat/usage")
    suspend fun getDocumentChatUsage(
        @Header("Authorization") bearer: String,
        @Path("id") id: String,
    ): ChatUsageResponse

    @POST("documents/chat/global")
    suspend fun globalChat(
        @Header("Authorization") bearer: String,
        @Body body: GlobalChatRequest,
    ): GlobalChatResponse

    @GET("documents/chat/global/history")
    suspend fun getGlobalChatHistory(
        @Header("Authorization") bearer: String,
    ): List<GlobalChatHistoryMessage>

    @GET("documents/chat/global/usage")
    suspend fun getGlobalChatUsage(
        @Header("Authorization") bearer: String,
    ): GlobalChatUsageResponse
}

interface DepartmentApiService {

    @GET("organizations/{organizationId}/departments")
    suspend fun listDepartments(
        @Header("Authorization") bearer: String,
        @Path("organizationId") organizationId: String,
    ): List<DepartmentApiModel>

    @GET("organizations/{organizationId}/departments/by-user/{userId}")
    suspend fun listUserDepartments(
        @Header("Authorization") bearer: String,
        @Path("organizationId") organizationId: String,
        @Path("userId") userId: String,
    ): List<DepartmentApiModel>
}
