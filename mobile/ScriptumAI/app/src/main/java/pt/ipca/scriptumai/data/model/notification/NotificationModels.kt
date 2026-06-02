package pt.ipca.scriptumai.data.model.notification

import com.google.gson.annotations.SerializedName

data class NotificationLog(
    val id: String,
    @SerializedName("notification_id") val notificationId: String?,
    @SerializedName("source_service") val sourceService: String?,
    @SerializedName("event_type") val eventType: String?,
    val recipient: String?,
    val channel: String?,
    val status: String?,
    @SerializedName("error_message") val errorMessage: String?,
    val subject: String?,
    @SerializedName("user_id") val userId: String?,
    @SerializedName("created_at") val createdAt: String?,
    @SerializedName("is_read") val isRead: Boolean = false,
)

data class NotificationLogsResponse(
    val success: Boolean,
    val data: NotificationLogsData?,
)

data class NotificationLogsData(
    val logs: List<NotificationLog>,
    val pagination: Pagination?,
)

data class Pagination(
    val limit: Int,
    val offset: Int,
    val total: Int,
    val totalPages: Int,
)
