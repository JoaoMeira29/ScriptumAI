package pt.ipca.scriptumai.data.network

import pt.ipca.scriptumai.data.model.auth.AuthResponse
import pt.ipca.scriptumai.data.model.auth.ChangePasswordRequest
import pt.ipca.scriptumai.data.model.auth.UpdateProfileRequest
import pt.ipca.scriptumai.data.model.auth.ProfileResponse
import pt.ipca.scriptumai.data.model.auth.ForgotPasswordRequest
import pt.ipca.scriptumai.data.model.auth.GenericResponse
import pt.ipca.scriptumai.data.model.auth.LoginRequest
import pt.ipca.scriptumai.data.model.auth.LogoutRequest
import pt.ipca.scriptumai.data.model.auth.RefreshTokenRequest
import pt.ipca.scriptumai.data.model.auth.RegisterRequest
import pt.ipca.scriptumai.data.model.auth.ResetPasswordRequest
import pt.ipca.scriptumai.data.model.auth.UserProfile
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.POST

interface AuthApiService {

    /** GET /api/auth/health — no auth */
    @GET("auth/health")
    suspend fun health(): GenericResponse

    /** POST /api/auth/register — no auth */
    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): AuthResponse

    /** POST /api/auth/login — no auth */
    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): AuthResponse

    /** POST /api/auth/logout — Bearer token required */
    @POST("auth/logout")
    suspend fun logout(
        @Header("Authorization") bearer: String,
        @Body body: LogoutRequest,
    ): GenericResponse

    /** POST /api/auth/refresh — no auth */
    @POST("auth/refresh")
    suspend fun refresh(@Body body: RefreshTokenRequest): AuthResponse

    /** POST /api/auth/change-password — Bearer token required */
    @POST("auth/change-password")
    suspend fun changePassword(
        @Header("Authorization") bearer: String,
        @Body body: ChangePasswordRequest,
    ): GenericResponse

    /** GET /api/auth/profile — Bearer token required */
    @GET("auth/profile")
    suspend fun profile(@Header("Authorization") bearer: String): ProfileResponse

    /** PATCH /api/auth/profile — Bearer token required */
    @PATCH("auth/profile")
    suspend fun updateProfile(
        @Header("Authorization") bearer: String,
        @Body body: UpdateProfileRequest,
    ): GenericResponse

    /** GET /api/auth/me — Bearer token required */
    @GET("auth/me")
    suspend fun me(@Header("Authorization") bearer: String): ProfileResponse

    /** POST /api/auth/forgot-password — no auth */
    @POST("auth/forgot-password")
    suspend fun forgotPassword(@Body body: ForgotPasswordRequest): GenericResponse

    /** POST /api/auth/reset-password — no auth */
    @POST("auth/reset-password")
    suspend fun resetPassword(@Body body: ResetPasswordRequest): GenericResponse
}
