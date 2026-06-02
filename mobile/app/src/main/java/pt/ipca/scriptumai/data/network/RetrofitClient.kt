package pt.ipca.scriptumai.data.network

import android.os.Build
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import pt.ipca.scriptumai.BuildConfig
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {
    private val isEmulator: Boolean
        get() = (Build.FINGERPRINT.contains("generic")
                || Build.FINGERPRINT.startsWith("google/sdk_gphone")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK")
                || Build.MODEL.contains("sdk_gphone")
                || Build.MANUFACTURER.contains("Genymotion")
                || Build.PRODUCT.contains("sdk")
                || Build.PRODUCT.contains("emulator")
                || Build.HARDWARE.contains("ranchu")
                || Build.HARDWARE.contains("goldfish"))

    private val serverHost: String
        get() = if (isEmulator) "10.0.2.2" else BuildConfig.SERVER_IP

    val BASE_URL: String get() = "http://$serverHost/api/"

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(TokenInterceptor())
        .addInterceptor(loggingInterceptor)
        .authenticator(TokenAuthenticator())
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    val instance: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    private val chatOkHttpClient = OkHttpClient.Builder()
        .addInterceptor(TokenInterceptor())
        .addInterceptor(loggingInterceptor)
        .authenticator(TokenAuthenticator())
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(300, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    val chatInstance: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(chatOkHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    inline fun <reified T> createService(): T = instance.create(T::class.java)
    inline fun <reified T> createChatService(): T = chatInstance.create(T::class.java)
}
