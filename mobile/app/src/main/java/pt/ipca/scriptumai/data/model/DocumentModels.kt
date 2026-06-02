package pt.ipca.scriptumai.data.model

data class ChatRequest(
    val message: String
)

data class ChatResponse(
    val documentId: String,
    val answer: String,
    val currentPlan: String,
    val planStatus: String,
    val messagesSent: Int,
    val limit: Int,
    val remainingMessages: Int,
    val trialStartDate: String?,
    val daysRemaining: Int?
)

data class ChatUsageResponse(
    val messagesSent: Int,
    val limit: Int,
    val remainingMessages: Int,
    val currentPlan: String,
    val planStatus: String,
    val daysRemaining: Int?
)

data class ChatMessage(
    val text: String,
    val isFromUser: Boolean,
    val timestamp: Long = System.currentTimeMillis()
)

data class ChatHistoryMessage(
    val id: String,
    val role: String,
    val content: String,
    val createdAt: String
)
