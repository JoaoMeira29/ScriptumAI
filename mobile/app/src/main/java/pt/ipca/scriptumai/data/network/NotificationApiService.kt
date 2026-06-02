package pt.ipca.scriptumai.data.network

import pt.ipca.scriptumai.data.model.auth.GenericResponse
import pt.ipca.scriptumai.data.model.notification.NotificationLogsResponse
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

data class RegisterDeviceRequest(val fcmToken: String, val deviceInfo: String? = null)

interface NotificationApiService {

    @POST("notifications/devices/register")
    suspend fun registerDevice(
        @Header("Authorization") bearer: String,
        @Body body: RegisterDeviceRequest,
    ): GenericResponse

    @DELETE("notifications/devices/{id}")
    suspend fun unregisterDevice(
        @Header("Authorization") bearer: String,
        @Path("id") id: String,
    ): GenericResponse

    @GET("notifications/logs")
    suspend fun getLogs(
        @Header("Authorization") bearer: String,
        @Query("limit") limit: Int = 50,
        @Query("offset") offset: Int = 0,
    ): NotificationLogsResponse

    @PATCH("notifications/logs/read-all")
    suspend fun markAllRead(@Header("Authorization") bearer: String): GenericResponse

    @PATCH("notifications/logs/{id}/read")
    suspend fun markOneRead(
        @Header("Authorization") bearer: String,
        @Path("id") id: String,
    ): GenericResponse

    @DELETE("notifications/logs")
    suspend fun clearAll(@Header("Authorization") bearer: String): GenericResponse

    @DELETE("notifications/logs/{id}")
    suspend fun deleteLog(
        @Header("Authorization") bearer: String,
        @Path("id") id: String,
    ): GenericResponse

    @POST("notifications/contact")
    suspend fun submitContact(
        @Header("Authorization") bearer: String,
        @Body body: ContactFormRequest,
    ): GenericResponse
}

data class ContactFormRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val subject: String,
    val message: String,
)
