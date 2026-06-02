package pt.ipca.scriptumai

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.lifecycle.lifecycleScope
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import pt.ipca.scriptumai.data.local.AuthEventBus
import pt.ipca.scriptumai.data.local.TokenManager
import pt.ipca.scriptumai.data.network.NotificationApiService
import pt.ipca.scriptumai.data.network.RegisterDeviceRequest
import pt.ipca.scriptumai.data.network.RetrofitClient
import pt.ipca.scriptumai.presentation.ui.auth.ForgotPasswordScreen
import pt.ipca.scriptumai.presentation.ui.auth.LoginScreen
import pt.ipca.scriptumai.presentation.ui.auth.PricingScreen
import pt.ipca.scriptumai.presentation.ui.auth.RegisterScreen
import pt.ipca.scriptumai.presentation.ui.home.ContactUsScreen
import pt.ipca.scriptumai.presentation.ui.home.ChangePasswordScreen
import pt.ipca.scriptumai.presentation.ui.home.EditProfileScreen
import pt.ipca.scriptumai.presentation.ui.home.HelpDeskScreen
import pt.ipca.scriptumai.presentation.ui.home.HomeScreen
import pt.ipca.scriptumai.presentation.ui.home.NotificationsScreen
import pt.ipca.scriptumai.presentation.ui.home.ProfileScreen
import pt.ipca.scriptumai.ui.theme.ScriptumAITheme
import pt.ipca.scriptumai.ui.theme.ThemeMode
import java.util.Locale

private const val PREFS_NAME = "app_settings"
private const val KEY_THEME = "theme"
private const val KEY_LANGUAGE = "language"

class MainActivity : ComponentActivity() {

    private val requestNotificationPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) {}

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            requestNotificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    override fun attachBaseContext(newBase: Context) {
        val lang = newBase.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(KEY_LANGUAGE, "en")!!
        val locale = Locale(lang)
        Locale.setDefault(locale)
        val config = Configuration(newBase.resources.configuration)
        config.setLocale(locale)
        super.attachBaseContext(newBase.createConfigurationContext(config))
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        TokenManager.init(this)
        requestNotificationPermissionIfNeeded()

        lifecycleScope.launch {
            AuthEventBus.unauthenticated.collect {
                finish()
                startActivity(Intent(this@MainActivity, MainActivity::class.java))
            }
        }

        if (TokenManager.isLoggedIn()) {
            lifecycleScope.launch {
                runCatching {
                    val token = FirebaseMessaging.getInstance().token.await()
                    val notificationApi: NotificationApiService = RetrofitClient.createService()
                    notificationApi.registerDevice(
                        bearer = TokenManager.bearerHeader(),
                        body = RegisterDeviceRequest(fcmToken = token),
                    )
                }
            }
        }

        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        setContent {
            var themeMode by remember {
                mutableStateOf(
                    when (prefs.getString(KEY_THEME, "system")) {
                        "light" -> ThemeMode.LIGHT
                        "dark" -> ThemeMode.DARK
                        else -> ThemeMode.SYSTEM
                    }
                )
            }
            val systemDark = isSystemInDarkTheme()
            val darkTheme = when (themeMode) {
                ThemeMode.LIGHT -> false
                ThemeMode.DARK -> true
                ThemeMode.SYSTEM -> systemDark
            }

            ScriptumAITheme(darkTheme = darkTheme) {
                val startScreen = if (TokenManager.isLoggedIn()) "home" else "login"
                var currentScreen by remember { mutableStateOf(startScreen) }
                var selectedPlanId by remember { mutableStateOf("free-trial") }

                when (currentScreen) {
                    "login" -> {
                        LoginScreen(
                            onNavigateToHome = { currentScreen = "home" },
                            onNavigateToRegister = { currentScreen = "pricing" },
                            onNavigateToForgotPassword = { currentScreen = "forgot_password" }
                        )
                    }
                    "pricing" -> {
                        PricingScreen(
                            onPlanSelected = { planId ->
                                selectedPlanId = planId
                                currentScreen = "register"
                            },
                            onBack = { currentScreen = "login" }
                        )
                    }
                    "register" -> {
                        RegisterScreen(
                            selectedPlanId = selectedPlanId,
                            onNavigateToLogin = { currentScreen = "login" },
                            onRegisterSuccess = { currentScreen = "home" }
                        )
                    }
                    "forgot_password" -> {
                        ForgotPasswordScreen(
                            onNavigateBack = { currentScreen = "login" }
                        )
                    }
                    "home" -> {
                        HomeScreen(
                            onNavigateToNotifications = { currentScreen = "notifications" },
                            onNavigateToProfile = { currentScreen = "profile" },
                            onNavigateToHelpDesk = { currentScreen = "help_desk" },
                            themeMode = themeMode,
                            onThemeModeChange = { newMode ->
                                themeMode = newMode
                                prefs.edit().putString(KEY_THEME, when (newMode) {
                                    ThemeMode.LIGHT -> "light"
                                    ThemeMode.DARK -> "dark"
                                    ThemeMode.SYSTEM -> "system"
                                }).apply()
                            },
                            onLanguageChange = { langCode ->
                                prefs.edit().putString(KEY_LANGUAGE, langCode).apply()
                                recreate()
                            },
                        )
                    }
                    "notifications" -> {
                        NotificationsScreen(
                            onNavigateBack = { currentScreen = "home" },
                            onNavigateToProfile = { currentScreen = "profile" },
                        )
                    }
                    "contact_us" -> {
                        ContactUsScreen(
                            onNavigateToHome = { currentScreen = "home" },
                            onNavigateToHelpDesk = { currentScreen = "help_desk" },
                        )
                    }
                    "help_desk" -> {
                        HelpDeskScreen(
                            onNavigateToHome = { currentScreen = "home" },
                            onNavigateToContact = { currentScreen = "contact_us" },
                        )
                    }
                    "profile" -> {
                        ProfileScreen(
                            onNavigateBack = { currentScreen = "home" },
                            onNavigateToEdit = { currentScreen = "edit_profile" },
                            onNavigateToChangePassword = { currentScreen = "change_password" },
                        )
                    }
                    "edit_profile" -> {
                        EditProfileScreen(
                            onNavigateBack = { currentScreen = "profile" },
                        )
                    }
                    "change_password" -> {
                        ChangePasswordScreen(
                            onNavigateBack = { currentScreen = "profile" },
                        )
                    }
                }
            }
        }
    }
}
