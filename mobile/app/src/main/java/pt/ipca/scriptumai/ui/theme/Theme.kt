package pt.ipca.scriptumai.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider

enum class ThemeMode { LIGHT, DARK, SYSTEM }

private val LightColorScheme = lightColorScheme(
    primary = ScriptumPrimary,
    onPrimary = ScriptumPrimaryForeground,
    secondary = ScriptumSecondary,
    onSecondary = ScriptumSecondaryForeground,
    tertiary = ScriptumAccent,
    onTertiary = ScriptumAccentForeground,
    background = ScriptumBackground,
    onBackground = ScriptumForeground,
    surface = ScriptumCard,
    onSurface = ScriptumCardForeground,
    surfaceVariant = ScriptumAccent,
    onSurfaceVariant = ScriptumAccentForeground,
    outline = ScriptumBorder,
    error = ScriptumDestructive,
    onError = ScriptumDestructiveForeground,
)

private val DarkColorScheme = darkColorScheme(
    primary = DarkPrimary,
    onPrimary = DarkPrimaryForeground,
    secondary = DarkSecondary,
    onSecondary = DarkSecondaryForeground,
    tertiary = DarkAccent,
    onTertiary = DarkAccentForeground,
    background = DarkBackground,
    onBackground = DarkForeground,
    surface = DarkCard,
    onSurface = DarkCardForeground,
    surfaceVariant = DarkAccent,
    onSurfaceVariant = DarkAccentForeground,
    outline = DarkBorder,
    error = DarkDestructive,
    onError = DarkDestructiveForeground,
)

@Composable
fun ScriptumAITheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val appColors = if (darkTheme) DarkAppColors else LightAppColors

    CompositionLocalProvider(LocalAppColors provides appColors) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = Typography,
            content = content
        )
    }
}
