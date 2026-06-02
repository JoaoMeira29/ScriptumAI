package pt.ipca.scriptumai.data.network

import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import pt.ipca.scriptumai.data.local.AuthEventBus
import pt.ipca.scriptumai.data.local.TokenManager
import pt.ipca.scriptumai.data.model.auth.RefreshTokenRequest

class TokenInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val accessToken = TokenManager.getAccessToken()

        // Add token to request if available
        val requestWithToken = if (accessToken != null) {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer $accessToken")
                .build()
        } else {
            originalRequest
        }

        val response = chain.proceed(requestWithToken)

        // If we get a 401, try to refresh the token
        if (response.code == 401) {
            val refreshToken = TokenManager.getRefreshToken()
            if (refreshToken != null) {
                // Synchronously call refresh token
                synchronized(this) {
                    val currentToken = TokenManager.getAccessToken()
                    
                    // Check if another thread already refreshed it
                    if (currentToken != accessToken) {
                        response.close()
                        return chain.proceed(originalRequest.newBuilder()
                            .header("Authorization", "Bearer $currentToken")
                            .build())
                    }

                    val refreshApiResponse = runBlocking {
                        try {
                            val api = RetrofitClient.createService<AuthApiService>()
                            api.refresh(RefreshTokenRequest(refreshToken))
                        } catch (e: Exception) {
                            null
                        }
                    }

                    val refreshResponse = refreshApiResponse?.data
                    if (refreshResponse?.accessToken != null && refreshResponse.refreshToken != null) {
                        TokenManager.saveTokens(refreshResponse.accessToken, refreshResponse.refreshToken)
                        response.close()
                        return chain.proceed(originalRequest.newBuilder()
                            .header("Authorization", "Bearer ${refreshResponse.accessToken}")
                            .build())
                    } else {
                        TokenManager.clear()
                        AuthEventBus.emitUnauthenticated()
                    }
                }
            }
        }

        return response
    }
}
