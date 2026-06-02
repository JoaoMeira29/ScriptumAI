package pt.ipca.scriptumai.data.model.auth

import com.google.gson.annotations.SerializedName

// ── Request bodies ──────────────────────────────────────────────────────────

data class LoginRequest(
    val email: String,
    val password: String,
)

data class RegisterRequest(
    val email: String,
    val password: String,
    val name: String,
    val surname: String,
    val username: String? = null,
    val organizationName: String? = null,
    @SerializedName("organizationId") val organizationId: String? = null,
    val planId: String? = null,
    val sector: String? = null,
    val city: String? = null,
    val address: String? = null,
    val contact: String? = null,
    val zipCode: String? = null,
)

data class RefreshTokenRequest(
    val refreshToken: String,
)

data class LogoutRequest(
    val refreshToken: String,
)

data class ChangePasswordRequest(
    val currentPassword: String,
    val newPassword: String,
)

data class UpdateProfileRequest(
    val name: String? = null,
    val surname: String? = null,
    val username: String? = null,
)

data class ForgotPasswordRequest(
    val email: String
)

data class ResetPasswordRequest(
    val email: String,
    val token: String,
    val newPassword: String
)

// ── Response bodies ─────────────────────────────────────────────────────────

data class AuthResponse(
    val success: Boolean? = null,
    val message: String? = null,
    val data: AuthData? = null,
)

data class AuthData(
    val user: UserProfile? = null,
    val trial: TrialInfo? = null,
    val accessToken: String? = null,
    val refreshToken: String? = null,
    // Keep message/success for generic error handling if backend uses them
    val success: Boolean? = null,
    val message: String? = null,
)

data class TrialInfo(
    val status: String,
    @SerializedName("ends_at") val endsAt: String,
    @SerializedName("days_remaining") val daysRemaining: Int
)

data class ProfileResponse(
    val success: Boolean? = null,
    val data: ProfileData? = null,
)

data class ProfileData(
    val user: UserProfile? = null,
)

data class UserProfile(
    val id: String? = null,
    val email: String? = null,
    val username: String? = null,
    val name: String? = null,
    val surname: String? = null,
    @SerializedName("organization_id") val organizationId: String? = null,
    val role: String? = null,
    val status: String? = null,
    val planId: String? = null,
    val messagesSent: Int? = null,
    val daysRemaining: Int? = null,
    @SerializedName("created_at") val createdAt: String? = null,
    @SerializedName("updated_at") val updatedAt: String? = null,
)

data class GenericResponse(
    val success: Boolean? = null,
    val message: String? = null,
)
