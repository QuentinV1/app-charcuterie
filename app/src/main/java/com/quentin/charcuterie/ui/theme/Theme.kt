package com.quentin.charcuterie.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// Palette Moderne 2026 : lumineuse, aérée, inspirée des applications culinaires contemporaines
val PrimaryTerracotta = Color(0xFFC84B31)
val PrimarySoft = Color(0xFFFDEDEA)
val OnPrimarySoft = Color(0xFF5C190B)

val SecondarySage = Color(0xFF236B48)
val SecondarySoft = Color(0xFFE8F5EE)
val OnSecondarySoft = Color(0xFF0A331E)

val BackgroundModern = Color(0xFFF7F6F2)
val SurfaceWhite = Color(0xFFFFFFFF)
val SurfaceSubtle = Color(0xFFF0EDE6)
val BorderSubtle = Color(0xFFE5E0D8)

val InkPrimary = Color(0xFF181614)
val InkSecondary = Color(0xFF655E57)
val AmberHighlight = Color(0xFFD97706)
val AmberSoft = Color(0xFFFEF3C7)

// Couleurs Thème Sombre "Cave d'Affinage"
val BackgroundCave = Color(0xFF141212)
val SurfaceCave = Color(0xFF1F1B1A)
val SurfaceSubtleCave = Color(0xFF2B2523)
val BorderCave = Color(0xFF3D3533)
val InkPrimaryDark = Color(0xFFF7F4EE)
val InkSecondaryDark = Color(0xFFABA198)

val PrimaryTerracottaDark = Color(0xFFE2654D)
val PrimarySoftDark = Color(0xFF4A180E)
val OnPrimarySoftDark = Color(0xFFFFDCD5)

val SecondarySageDark = Color(0xFF4FA878)
val SecondarySoftDark = Color(0xFF123B25)
val OnSecondarySoftDark = Color(0xFFD4EFE0)

private val CaveDarkColorScheme = darkColorScheme(
    primary = PrimaryTerracottaDark,
    onPrimary = Color(0xFF380C04),
    primaryContainer = PrimarySoftDark,
    onPrimaryContainer = OnPrimarySoftDark,
    secondary = SecondarySageDark,
    onSecondary = Color(0xFF032615),
    secondaryContainer = SecondarySoftDark,
    onSecondaryContainer = OnSecondarySoftDark,
    tertiary = AmberHighlight,
    tertiaryContainer = Color(0xFF4E2C00),
    background = BackgroundCave,
    onBackground = InkPrimaryDark,
    surface = SurfaceCave,
    onSurface = InkPrimaryDark,
    surfaceVariant = SurfaceSubtleCave,
    onSurfaceVariant = InkSecondaryDark,
    outline = BorderCave,
    outlineVariant = BorderCave
)

private val ModernColorScheme = lightColorScheme(
    primary = PrimaryTerracotta,
    onPrimary = Color.White,
    primaryContainer = PrimarySoft,
    onPrimaryContainer = OnPrimarySoft,
    secondary = SecondarySage,
    onSecondary = Color.White,
    secondaryContainer = SecondarySoft,
    onSecondaryContainer = OnSecondarySoft,
    tertiary = AmberHighlight,
    tertiaryContainer = AmberSoft,
    background = BackgroundModern,
    onBackground = InkPrimary,
    surface = SurfaceWhite,
    onSurface = InkPrimary,
    surfaceVariant = SurfaceSubtle,
    onSurfaceVariant = InkSecondary,
    outline = BorderSubtle,
    outlineVariant = BorderSubtle
)

private val ModernShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(18.dp),
    large = RoundedCornerShape(24.dp),
    extraLarge = RoundedCornerShape(32.dp)
)

private val ModernTypography = Typography(
    headlineMedium = TextStyle(
        fontWeight = FontWeight.ExtraBold,
        fontSize = 26.sp,
        lineHeight = 32.sp,
        letterSpacing = (-0.5).sp
    ),
    headlineSmall = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        letterSpacing = (-0.3).sp
    ),
    titleLarge = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize = 19.sp,
        lineHeight = 25.sp
    ),
    titleMedium = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        lineHeight = 22.sp
    ),
    titleSmall = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        lineHeight = 20.sp
    ),
    bodyLarge = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 15.sp,
        lineHeight = 22.sp
    ),
    bodyMedium = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp
    ),
    bodySmall = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 13.sp,
        lineHeight = 18.sp
    ),
    labelLarge = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 13.sp,
        lineHeight = 18.sp
    ),
    labelMedium = TextStyle(
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp
    ),
    labelSmall = TextStyle(
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 15.sp
    )
)

@Composable
fun AtelierCharcuterieTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) CaveDarkColorScheme else ModernColorScheme
    MaterialTheme(
        colorScheme = colors,
        shapes = ModernShapes,
        typography = ModernTypography,
        content = content
    )
}
