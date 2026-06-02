package pt.ipca.scriptumai.ui.theme

import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

data class AppColors(
    // Primary colors
    val primaryNotifications: Color,
    val primaryLighter: Color,
    // Extra surface
    val popover: Color,
    val popoverForeground: Color,
    val muted: Color,
    val mutedForeground: Color,
    val input: Color,
    val ring: Color,
    // Charts
    val chart1: Color,
    val chart2: Color,
    val chart3: Color,
    val chart4: Color,
    val chart5: Color,
    // Sidebar
    val sidebarBackground: Color,
    val sidebarForeground: Color,
    val sidebarPrimary: Color,
    val sidebarPrimaryForeground: Color,
    val sidebarAccent: Color,
    val sidebarAccentForeground: Color,
    val sidebarBorder: Color,
    val sidebarRing: Color,
)

val LightAppColors = AppColors(
    primaryNotifications = ScriptumPrimaryNotifications,
    primaryLighter = ScriptumPrimaryLighter,
    popover = ScriptumPopover,
    popoverForeground = ScriptumPopoverForeground,
    muted = ScriptumMuted,
    mutedForeground = ScriptumMutedForeground,
    input = ScriptumInput,
    ring = ScriptumRing,
    chart1 = ScriptumChart1,
    chart2 = ScriptumChart2,
    chart3 = ScriptumChart3,
    chart4 = ScriptumChart4,
    chart5 = ScriptumChart5,
    sidebarBackground = ScriptumSidebarBackground,
    sidebarForeground = ScriptumSidebarForeground,
    sidebarPrimary = ScriptumSidebarPrimary,
    sidebarPrimaryForeground = ScriptumSidebarPrimaryForeground,
    sidebarAccent = ScriptumSidebarAccent,
    sidebarAccentForeground = ScriptumSidebarAccentForeground,
    sidebarBorder = ScriptumSidebarBorder,
    sidebarRing = ScriptumSidebarRing,
)

val DarkAppColors = AppColors(
    primaryNotifications = DarkPrimary.copy(alpha = 0.6f),
    primaryLighter = DarkPrimary.copy(alpha = 0.25f),
    popover = DarkPopover,
    popoverForeground = DarkPopoverForeground,
    muted = DarkMuted,
    mutedForeground = DarkMutedForeground,
    input = DarkInput,
    ring = DarkRing,
    chart1 = DarkChart1,
    chart2 = DarkChart2,
    chart3 = DarkChart3,
    chart4 = DarkChart4,
    chart5 = DarkChart5,
    sidebarBackground = DarkSidebarBackground,
    sidebarForeground = DarkSidebarForeground,
    sidebarPrimary = DarkSidebarPrimary,
    sidebarPrimaryForeground = DarkSidebarPrimaryForeground,
    sidebarAccent = DarkSidebarAccent,
    sidebarAccentForeground = DarkSidebarAccentForeground,
    sidebarBorder = DarkSidebarBorder,
    sidebarRing = DarkSidebarRing,
)

val LocalAppColors = staticCompositionLocalOf { LightAppColors }
