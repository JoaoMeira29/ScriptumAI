package pt.ipca.scriptumai.data.repository

import pt.ipca.scriptumai.data.local.TokenManager
import pt.ipca.scriptumai.data.model.notification.NotificationLog
import pt.ipca.scriptumai.data.network.ContactFormRequest
import pt.ipca.scriptumai.data.network.NotificationApiService
import pt.ipca.scriptumai.data.network.RetrofitClient

class NotificationsRepository {

    private val api: NotificationApiService = RetrofitClient.createService()

    suspend fun getLogs(): Result<List<NotificationLog>> = runCatching {
        api.getLogs(bearer = TokenManager.bearerHeader()).data?.logs ?: emptyList()
    }

    suspend fun markAllRead(): Result<Unit> = runCatching {
        api.markAllRead(TokenManager.bearerHeader())
        Unit
    }

    suspend fun markOneRead(id: String): Result<Unit> = runCatching {
        api.markOneRead(TokenManager.bearerHeader(), id)
        Unit
    }

    suspend fun deleteLog(id: String): Result<Unit> = runCatching {
        api.deleteLog(TokenManager.bearerHeader(), id)
        Unit
    }

    suspend fun clearAll(): Result<Unit> = runCatching {
        api.clearAll(TokenManager.bearerHeader())
        Unit
    }

    suspend fun submitContact(
        firstName: String,
        lastName: String,
        email: String,
        subject: String,
        message: String,
    ): Result<Unit> = runCatching {
        api.submitContact(
            bearer = TokenManager.bearerHeader(),
            body = ContactFormRequest(
                firstName = firstName,
                lastName = lastName,
                email = email,
                subject = subject,
                message = message,
            ),
        )
        Unit
    }
}