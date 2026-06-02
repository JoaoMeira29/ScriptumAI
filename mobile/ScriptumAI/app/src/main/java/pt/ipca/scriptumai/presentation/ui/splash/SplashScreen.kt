package pt.ipca.scriptumai.presentation.ui.splash

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.os.Bundle
import androidx.activity.ComponentActivity
import java.util.Locale
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import pt.ipca.scriptumai.MainActivity
import pt.ipca.scriptumai.R
import pt.ipca.scriptumai.ui.theme.ScriptumAITheme

@SuppressLint("CustomSplashScreen")
class SplashActivity : ComponentActivity() {
    override fun attachBaseContext(newBase: Context) {
        val lang = newBase.getSharedPreferences("app_settings", Context.MODE_PRIVATE)
            .getString("language", "en")!!
        val locale = Locale(lang)
        Locale.setDefault(locale)
        val config = Configuration(newBase.resources.configuration)
        config.setLocale(locale)
        super.attachBaseContext(newBase.createConfigurationContext(config))
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            ScriptumAITheme {
                SplashScreenContent()
            }
        }
    }
}

@Composable
fun SplashScreenContent() {
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        delay(2000)
        context.startActivity(Intent(context, MainActivity::class.java))
        (context as? SplashActivity)?.finish()
    }

    SplashScreenUI()
}

@Composable
fun SplashScreenUI() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center
    ) {
        Image(
            painter = painterResource(id = R.drawable.logo),
            contentDescription = "ScriptumAI Logo",
            modifier = Modifier.size(400.dp)
        )
    }
}

@Preview(showBackground = true)
@Composable
fun SplashScreenPreview() {
    ScriptumAITheme {
        SplashScreenUI()
    }
}
