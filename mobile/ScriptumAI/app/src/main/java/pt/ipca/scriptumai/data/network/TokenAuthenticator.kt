package pt.ipca.scriptumai.data.network

import okhttp3.Authenticator
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.Route
import org.json.JSONObject
import pt.ipca.scriptumai.data.local.TokenManager

/**
 * Intercepts 401 responses, attempts a token refresh, and retries the original request.
 * Uses a plain OkHttpClient (sem autenticador) para evitar loops infinitos.
 */
class TokenAuthenticator : Authenticator {

    private val refreshClient = OkHttpClient()

    override fun authenticate(route: Route?, response: Response): Request? {
        // Evitar loop: se já tentámos e continuamos a ter 401, desistir
        if (response.request.header("X-Retry-After-Refresh") != null) return null

        val refreshToken = TokenManager.getRefreshToken() ?: return null

        // Construir o pedido de refresh directamente (sem Retrofit para evitar dependência circular)
        val baseUrl = RetrofitClient.BASE_URL
        val body = JSONObject().put("refreshToken", refreshToken)
            .toString()
            .toRequestBody("application/json".toMediaType())

        val refreshRequest = Request.Builder()
            .url("${baseUrl}auth/refresh")
            .post(body)
            .build()

        return try {
            val refreshResponse = refreshClient.newCall(refreshRequest).execute()
            if (!refreshResponse.isSuccessful) return null

            val json = JSONObject(refreshResponse.body?.string() ?: return null)
            val data = json.optJSONObject("data") ?: return null
            val newAccess  = data.optString("accessToken",  "").ifBlank { return null }
            val newRefresh = data.optString("refreshToken", "").ifBlank { return null }

            TokenManager.saveTokens(newAccess, newRefresh)

            // Repetir o pedido original com o novo token
            response.request.newBuilder()
                .header("Authorization", "Bearer $newAccess")
                .header("X-Retry-After-Refresh", "true")
                .build()
        } catch (_: Exception) {
            null
        }
    }
}
