package pt.ipca.scriptumai.data.model

import com.google.gson.annotations.SerializedName

data class GlobalChatRequest(
    val message: String,
)

data class GlobalChatResponse(
    val answer: String,
    val sourceDocuments: List<SourceDocument>,
    val currentPlan: String,
    val planStatus: String?,
    val messagesSent: Int,
    val limit: Int,
    val remainingMessages: Int,
)

data class SourceDocument(
    val documentId: String,
    val documentName: String,
    val relevanceScore: Double,
)

data class GlobalChatHistoryMessage(
    val id: String,
    val role: String,
    val content: String,
    val sourceDocuments: List<SourceDocument>?,
    @SerializedName("createdAt") val createdAt: String,
)

data class GlobalChatUsageResponse(
    val currentPlan: String,
    val planStatus: String?,
    val messagesSent: Int,
    val limit: Int,
    val remainingMessages: Int,
)
