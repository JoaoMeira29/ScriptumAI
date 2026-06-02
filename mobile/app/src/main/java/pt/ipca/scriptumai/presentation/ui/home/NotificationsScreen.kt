package pt.ipca.scriptumai.presentation.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.clickable
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.GroupAdd
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import pt.ipca.scriptumai.data.model.notification.NotificationLog
import pt.ipca.scriptumai.ui.theme.LocalAppColors
import pt.ipca.scriptumai.presentation.viewmodel.NotificationTab
import pt.ipca.scriptumai.presentation.viewmodel.NotificationsViewModel
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

private val TealPrimary = Color(0xFF4DB6AC)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(
    onNavigateBack: () -> Unit,
    onNavigateToProfile: () -> Unit = {},
    viewModel: NotificationsViewModel = viewModel(),
) {
    val state by viewModel.state.collectAsState()
    val unreadCount = state.logs.count { !it.isRead }
    val accent = MaterialTheme.colorScheme.primary

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Notifications", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.load() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                ),
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = 4.dp,
            ) {
                NavigationBarItem(
                    selected = false,
                    onClick = onNavigateBack,
                    icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                    label = { Text("Home", style = MaterialTheme.typography.labelSmall) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = accent,
                        selectedTextColor = accent,
                        indicatorColor = accent.copy(alpha = 0.12f),
                    ),
                )
                NavigationBarItem(
                    selected = true,
                    onClick = {},
                    icon = { Icon(Icons.Default.Notifications, contentDescription = "Notifications") },
                    label = { Text("Notifications", style = MaterialTheme.typography.labelSmall) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = accent,
                        selectedTextColor = accent,
                        indicatorColor = accent.copy(alpha = 0.12f),
                    ),
                )
                NavigationBarItem(
                    selected = false,
                    onClick = onNavigateToProfile,
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                    label = { Text("Settings", style = MaterialTheme.typography.labelSmall) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = accent,
                        selectedTextColor = accent,
                        indicatorColor = accent.copy(alpha = 0.12f),
                    ),
                )
            }
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
        ) {
            Spacer(Modifier.height(8.dp))

            // Tab toggle
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(LocalAppColors.current.primaryLighter, RoundedCornerShape(50.dp))
                    .padding(4.dp),
            ) {
                TabButton(
                    label = "Unread${if (unreadCount > 0) " ($unreadCount)" else ""}",
                    selected = state.tab == NotificationTab.UNREAD,
                    onClick = { viewModel.setTab(NotificationTab.UNREAD) },
                    modifier = Modifier.weight(1f),
                )
                TabButton(
                    label = "All notifications",
                    selected = state.tab == NotificationTab.ALL,
                    onClick = { viewModel.setTab(NotificationTab.ALL) },
                    modifier = Modifier.weight(1f),
                )
            }

            Spacer(Modifier.height(12.dp))

            // Action row
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                if (state.tab == NotificationTab.UNREAD && unreadCount > 0) {
                    SmallActionButton("Mark all as read", TealPrimary) { viewModel.markAllRead() }
                } else if (state.tab == NotificationTab.ALL && state.logs.isNotEmpty()) {
                    SmallActionButton("Clear all", Color(0xFFEF5350)) { viewModel.clearAll() }
                }
            }

            Spacer(Modifier.height(4.dp))

            when {
                state.isLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = TealPrimary)
                }

                state.displayed.isEmpty() -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text = if (state.tab == NotificationTab.UNREAD) "No Unread Notifications" else "No Notifications",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }

                else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(state.displayed, key = { it.id }) { log ->
                        NotificationCard(
                            log = log,
                            onDelete = { viewModel.deleteLog(log.id) },
                            onMarkRead = { if (!log.isRead) viewModel.markOneRead(log.id) },
                        )
                    }
                    item { Spacer(Modifier.height(8.dp)) }
                }
            }
        }
    }
}

@Composable
private fun TabButton(label: String, selected: Boolean, onClick: () -> Unit, modifier: Modifier) {
    Button(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(50.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = if (selected) TealPrimary else Color.Transparent,
            contentColor = if (selected) Color.White else TealPrimary,
        ),
        elevation = null,
    ) {
        Text(label, fontSize = 13.sp, fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal)
    }
}

@Composable
private fun SmallActionButton(label: String, color: Color, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        shape = RoundedCornerShape(50.dp),
        colors = ButtonDefaults.buttonColors(containerColor = color),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp, vertical = 6.dp),
    ) {
        Text(label, fontSize = 12.sp, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun NotificationCard(log: NotificationLog, onDelete: () -> Unit, onMarkRead: () -> Unit = {}) {
    val (icon, title, description) = resolveEventDisplay(log)
    val appColors = LocalAppColors.current
    val cardColor = if (log.isRead) appColors.primaryLighter else appColors.primaryNotifications

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = cardColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        modifier = Modifier.fillMaxWidth().clickable { onMarkRead() },
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(contentAlignment = Alignment.TopEnd) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = TealPrimary,
                    modifier = Modifier.size(28.dp),
                )
                if (!log.isRead) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .background(TealPrimary, androidx.compose.foundation.shape.CircleShape)
                    )
                }
            }

            Spacer(Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = if (log.isRead) FontWeight.Normal else FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.75f),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(top = 2.dp),
                )
                Text(
                    text = formatDate(log.createdAt),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f),
                    modifier = Modifier.padding(top = 4.dp),
                )
            }

            IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = "Delete",
                    tint = Color(0xFFEF5350),
                    modifier = Modifier.size(20.dp),
                )
            }
        }
    }
}

private data class EventDisplay(val icon: ImageVector, val title: String, val description: String)

private fun resolveEventDisplay(log: NotificationLog): EventDisplay {
    val subject = log.subject?.take(60) ?: ""
    return when (log.eventType) {
        "document.ai.completed" -> EventDisplay(
            Icons.Default.AutoAwesome,
            "Document processed",
            subject.ifBlank { "Your document was successfully processed by AI" },
        )
        "document.uploaded" -> EventDisplay(
            Icons.Default.CloudUpload,
            "Document uploaded",
            subject.ifBlank { "A document was uploaded successfully" },
        )
        "invite.created" -> EventDisplay(
            Icons.Default.GroupAdd,
            "Organisation invite",
            subject.ifBlank { "You received an organisation invitation" },
        )
        "user.created" -> EventDisplay(
            Icons.Default.Description,
            "Welcome to ScriptumAI",
            "Your account has been created successfully",
        )
        "contact.submitted" -> EventDisplay(
            Icons.Default.Email,
            "Contact form sent",
            subject.ifBlank { "Your message was sent to support" },
        )
        else -> EventDisplay(
            Icons.Default.Notifications,
            subject.ifBlank { "Notification" },
            log.recipient ?: "",
        )
    }
}

private fun formatDate(raw: String?): String {
    if (raw.isNullOrBlank()) return ""
    return try {
        val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        val date = parser.parse(raw) ?: return ""
        val today = Calendar.getInstance().apply { set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0) }.time
        val yesterday = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, -1); set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0) }.time
        val timeStr = SimpleDateFormat("HH:mm", Locale.getDefault()).format(date)
        when {
            date >= today -> "Today, $timeStr"
            date >= yesterday -> "Yesterday, $timeStr"
            else -> SimpleDateFormat("dd MMM, HH:mm", Locale.getDefault()).format(date)
        }
    } catch (_: Exception) {
        raw.take(10)
    }
}
