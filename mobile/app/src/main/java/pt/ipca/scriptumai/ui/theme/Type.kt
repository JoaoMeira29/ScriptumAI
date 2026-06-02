package pt.ipca.scriptumai.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.font.FontFamily

val Typography = Typography().run {
    copy(
        displayLarge = displayLarge.copy(fontFamily = FontFamily.Default),
        displayMedium = displayMedium.copy(fontFamily = FontFamily.Default),
        displaySmall = displaySmall.copy(fontFamily = FontFamily.Default),
        headlineLarge = headlineLarge.copy(fontFamily = FontFamily.Default),
        headlineMedium = headlineMedium.copy(fontFamily = FontFamily.Default),
        headlineSmall = headlineSmall.copy(fontFamily = FontFamily.Default),
        titleLarge = titleLarge.copy(fontFamily = FontFamily.Default),
        titleMedium = titleMedium.copy(fontFamily = FontFamily.Default),
        titleSmall = titleSmall.copy(fontFamily = FontFamily.Default),
        bodyLarge = bodyLarge.copy(fontFamily = FontFamily.Default),
        bodyMedium = bodyMedium.copy(fontFamily = FontFamily.Default),
        bodySmall = bodySmall.copy(fontFamily = FontFamily.Default),
        labelLarge = labelLarge.copy(fontFamily = FontFamily.Default),
        labelMedium = labelMedium.copy(fontFamily = FontFamily.Default),
        labelSmall = labelSmall.copy(fontFamily = FontFamily.Default),
    )
}
