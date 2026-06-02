package pt.ipca.scriptumai.data.repository

import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.tasks.await
import pt.ipca.scriptumai.data.local.TokenManager
import pt.ipca.scriptumai.data.model.auth.AuthData
import pt.ipca.scriptumai.data.model.auth.AuthResponse
import pt.ipca.scriptumai.data.model.auth.ChangePasswordRequest
import pt.ipca.scriptumai.data.model.auth.UpdateProfileRequest
import pt.ipca.scriptumai.data.model.auth.ForgotPasswordRequest
import pt.ipca.scriptumai.data.model.auth.GenericResponse
import pt.ipca.scriptumai.data.model.auth.LoginRequest
import pt.ipca.scriptumai.data.model.auth.LogoutRequest
import pt.ipca.scriptumai.data.model.auth.RefreshTokenRequest
import pt.ipca.scriptumai.data.model.auth.RegisterRequest
import pt.ipca.scriptumai.data.model.auth.ResetPasswordRequest
import pt.ipca.scriptumai.data.model.auth.ProfileResponse
import pt.ipca.scriptumai.data.model.auth.UserProfile
import pt.ipca.scriptumai.data.network.AuthApiService
import pt.ipca.scriptumai.data.network.NotificationApiService
import pt.ipca.scriptumai.data.network.RegisterDeviceRequest
import pt.ipca.scriptumai.data.network.RetrofitClient

class AuthRepository {

    private val api: AuthApiService = RetrofitClient.createService()
    private val notificationApi: NotificationApiService = RetrofitClient.createService()

    suspend fun login(email: String, password: String): Result<AuthData> = runCatching {
        val response = api.login(LoginRequest(email, password))
        saveTokensFromResponse(response)
        registerFcmToken()
        response.data ?: error("Login response missing data")
    }

    suspend fun register(request: RegisterRequest): Result<AuthData> = runCatching {
        val response = api.register(request)
        saveTokensFromResponse(response)
        registerFcmToken()
        response.data ?: error("Register response missing data")
    }

    private suspend fun registerFcmToken() {
        runCatching {
            val token = FirebaseMessaging.getInstance().token.await()
            notificationApi.registerDevice(
                bearer = TokenManager.bearerHeader(),
                body = RegisterDeviceRequest(fcmToken = token),
            )
        }
    }

    private fun saveTokensFromResponse(response: AuthResponse) {
        val data = response.data ?: return
        val access = data.accessToken ?: return
        val refresh = data.refreshToken ?: return
        TokenManager.saveTokens(access, refresh)
        val user = data.user ?: return
        user.organizationId?.let { TokenManager.saveOrgId(it) }
        val name = listOfNotNull(user.name, user.surname).joinToString(" ").ifBlank { user.email }
        if (user.id != null && name != null) {
            TokenManager.saveUserInfo(user.id, name)
        }
    }

    suspend fun logout(): Result<GenericResponse> = runCatching {
        val refreshToken = TokenManager.getRefreshToken().orEmpty()
        try {
            api.logout(TokenManager.bearerHeader(), LogoutRequest(refreshToken))
        } finally {
            TokenManager.clear()
        }
    }

    suspend fun refresh(): Result<AuthData> = runCatching {
        val refreshToken = TokenManager.getRefreshToken()
            ?: error("No refresh token available")
        val response = api.refresh(RefreshTokenRequest(refreshToken))
        saveTokensFromResponse(response)
        response.data ?: error("Refresh response missing data")
    }

    suspend fun changePassword(current: String, new: String): Result<GenericResponse> = runCatching {
        api.changePassword(
            bearer = TokenManager.bearerHeader(),
            body = ChangePasswordRequest(current, new),
        )
    }

    suspend fun updateProfile(request: UpdateProfileRequest): Result<GenericResponse> = runCatching {
        api.updateProfile(TokenManager.bearerHeader(), request)
    }

    suspend fun getProfile(): Result<UserProfile> = runCatching {
        api.profile(TokenManager.bearerHeader()).data?.user ?: error("Profile data missing")
    }

    suspend fun getMe(): Result<UserProfile> = runCatching {
        api.me(TokenManager.bearerHeader()).data?.user ?: error("Profile data missing")
    }

    suspend fun forgotPassword(email: String): Result<GenericResponse> = runCatching {
        api.forgotPassword(ForgotPasswordRequest(email))
    }

    suspend fun resetPassword(request: ResetPasswordRequest): Result<GenericResponse> = runCatching {
        api.resetPassword(request)
    }
}
