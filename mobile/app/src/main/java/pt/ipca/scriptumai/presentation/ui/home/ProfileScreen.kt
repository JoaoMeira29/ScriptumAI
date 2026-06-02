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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AlternateEmail
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import pt.ipca.scriptumai.R
import pt.ipca.scriptumai.data.model.auth.UserProfile
import pt.ipca.scriptumai.presentation.viewmodel.ProfileViewModel

private fun formatProfileDate(iso: String): String = try {
    val input = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US)
        .also { it.timeZone = java.util.TimeZone.getTimeZone("UTC") }
    val output = java.text.SimpleDateFormat("d MMM yyyy", java.util.Locale.getDefault())
    output.format(input.parse(iso)!!)
} catch (_: Exception) {
    iso.take(10)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onNavigateBack: () -> Unit = {},
    onNavigateToEdit: () -> Unit = {},
    onNavigateToChangePassword: () -> Unit = {},
    viewModel: ProfileViewModel = viewModel(),
) {
    val accent = MaterialTheme.colorScheme.primary
    val state by viewModel.profileState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.profile_title), fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = stringResource(R.string.back))
                    }
                },
                actions = {
                    IconButton(onClick = onNavigateToEdit) {
                        Icon(Icons.Default.Edit, contentDescription = stringResource(R.string.edit), tint = accent)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        when {
            state.isLoading -> {
                Box(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = accent)
                }
            }
            state.error != null -> {
                Box(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = state.error!!,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            style = MaterialTheme.typography.bodyMedium
                        )
                        Spacer(Modifier.height(12.dp))
                        TextButton(onClick = { viewModel.loadProfile() }) {
                            Text(stringResource(R.string.retry), color = accent)
                        }
                    }
                }
            }
            state.profile != null -> {
                ProfileContent(
                    profile = state.profile!!,
                    onEditProfile = onNavigateToEdit,
                    onChangePassword = onNavigateToChangePassword,
                    modifier = Modifier.padding(padding)
                )
            }
        }
    }
}

@Composable
private fun ProfileContent(
    profile: UserProfile,
    onEditProfile: () -> Unit,
    onChangePassword: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val accent = MaterialTheme.colorScheme.primary
    val fullName = listOfNotNull(profile.name, profile.surname).joinToString(" ").ifBlank { "User" }
    val initials = buildString {
        profile.name?.firstOrNull()?.uppercaseChar()?.let { append(it) }
        profile.surname?.firstOrNull()?.uppercaseChar()?.let { append(it) }
    }.ifBlank { "U" }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(16.dp))

        Box(
            modifier = Modifier
                .size(88.dp)
                .clip(CircleShape)
                .background(accent),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = initials,
                color = Color.White,
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(Modifier.height(16.dp))

        Text(
            text = fullName,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text = profile.email.orEmpty(),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(Modifier.height(28.dp))

        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(vertical = 8.dp)) {
                profile.username?.let {
                    ProfileRow(icon = Icons.Default.AlternateEmail, label = stringResource(R.string.profile_username), value = it, accent = accent)
                }
                profile.role?.let {
                    ProfileRow(icon = Icons.Default.Badge, label = stringResource(R.string.profile_role), value = it.replaceFirstChar { c -> c.uppercaseChar() }, accent = accent)
                }
                profile.status?.let {
                    ProfileRow(icon = Icons.Default.CheckCircle, label = stringResource(R.string.profile_status), value = it.replaceFirstChar { c -> c.uppercaseChar() }, accent = accent)
                }
                profile.planId?.let {
                    ProfileRow(icon = Icons.Default.Star, label = stringResource(R.string.profile_plan), value = it, accent = accent)
                }
                profile.daysRemaining?.let {
                    ProfileRow(icon = Icons.Default.Schedule, label = stringResource(R.string.profile_trial_remaining), value = stringResource(R.string.profile_trial_days, it), accent = accent)
                }
                profile.messagesSent?.let {
                    ProfileRow(icon = Icons.Default.Chat, label = stringResource(R.string.profile_messages_sent), value = it.toString(), accent = accent)
                }
                profile.createdAt?.let {
                    ProfileRow(icon = Icons.Default.CalendarToday, label = stringResource(R.string.profile_member_since), value = formatProfileDate(it), accent = accent)
                }
            }
        }

        Spacer(Modifier.height(32.dp))

        Button(
            onClick = onEditProfile,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = accent)
        ) {
            Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text(stringResource(R.string.profile_edit_profile), fontWeight = FontWeight.SemiBold)
        }

        Spacer(Modifier.height(12.dp))

        Button(
            onClick = onChangePassword,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = accent)
        ) {
            Icon(Icons.Default.Lock, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text(stringResource(R.string.profile_change_password), fontWeight = FontWeight.SemiBold)
        }

        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun ProfileRow(icon: ImageVector, label: String, value: String, accent: Color) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = accent,
            modifier = Modifier.size(20.dp)
        )
        Spacer(Modifier.width(14.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 11.sp
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}
