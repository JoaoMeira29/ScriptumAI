package pt.ipca.scriptumai.presentation.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.automirrored.filled.HelpOutline
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MailOutline
import androidx.compose.material.icons.filled.RadioButtonChecked
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.lifecycle.viewmodel.compose.viewModel
import pt.ipca.scriptumai.presentation.viewmodel.ContactViewModel
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState
import pt.ipca.scriptumai.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContactUsScreen(
    onNavigateToHome: () -> Unit = {},
    onNavigateToHelpDesk: () -> Unit = {},
    viewModel: ContactViewModel = viewModel(),
) {
    val contactState by viewModel.state.collectAsState()
    val accent = MaterialTheme.colorScheme.primary

    val subjects = listOf(
        stringResource(R.string.contact_subject_general),
        stringResource(R.string.contact_subject_complaint),
        stringResource(R.string.contact_subject_billing),
        stringResource(R.string.contact_subject_technical),
    )

    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var selectedSubject by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    val showSuccess = contactState.isSuccess
    val apiError = contactState.error
    var validationError by remember { mutableStateOf<String?>(null) }
    val errorMessage = validationError ?: apiError

    if (selectedSubject.isEmpty() && subjects.isNotEmpty()) {
        selectedSubject = subjects[0]
    }

    val errorName = stringResource(R.string.contact_error_name)
    val errorEmail = stringResource(R.string.contact_error_email)
    val errorMsg = stringResource(R.string.contact_error_message)

    if (showSuccess) {
        AlertDialog(
            onDismissRequest = { viewModel.resetSuccess() },
            icon = {
                Icon(
                    Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = Color(0xFF388E3C),
                    modifier = Modifier.size(32.dp),
                )
            },
            title = { Text(stringResource(R.string.contact_success_title)) },
            text = { Text(stringResource(R.string.contact_success_body)) },
            confirmButton = {
                TextButton(onClick = { viewModel.resetSuccess() }) {
                    Text(stringResource(R.string.ok), color = accent)
                }
            },
        )
    }

    errorMessage?.let { msg ->
        AlertDialog(
            onDismissRequest = { validationError = null; viewModel.resetError() },
            title = { Text(stringResource(R.string.error_something_went_wrong)) },
            text = { Text(msg) },
            confirmButton = {
                TextButton(onClick = { validationError = null; viewModel.resetError() }) {
                    Text(stringResource(R.string.ok), color = accent)
                }
            },
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.contact_title), fontWeight = FontWeight.SemiBold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                )
            )
        },
        bottomBar = {
            SupportBottomNav(
                currentRoute = "contact",
                onHome = onNavigateToHome,
                onContact = {},
                onHelpDesk = onNavigateToHelpDesk,
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .imePadding()
                .padding(horizontal = 20.dp, vertical = 16.dp),
        ) {
            Text(
                text = stringResource(R.string.contact_get_in_touch),
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = stringResource(R.string.contact_subtitle),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(Modifier.height(24.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = firstName,
                    onValueChange = { firstName = it },
                    label = { Text(stringResource(R.string.contact_first_name)) },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                )
                OutlinedTextField(
                    value = lastName,
                    onValueChange = { lastName = it },
                    label = { Text(stringResource(R.string.contact_last_name)) },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                )
            }

            Spacer(Modifier.height(14.dp))

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text(stringResource(R.string.contact_email)) },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(Modifier.height(14.dp))

            OutlinedTextField(
                value = phone,
                onValueChange = { phone = it },
                label = { Text(stringResource(R.string.contact_phone)) },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(Modifier.height(24.dp))

            Text(
                text = stringResource(R.string.contact_subject),
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.height(10.dp))
            subjects.forEach { subject ->
                SubjectRadioItem(
                    label = subject,
                    selected = selectedSubject == subject,
                    onClick = { selectedSubject = subject },
                    accent = accent,
                )
            }

            Spacer(Modifier.height(20.dp))

            OutlinedTextField(
                value = message,
                onValueChange = { message = it },
                label = { Text(stringResource(R.string.contact_message)) },
                minLines = 5,
                maxLines = 8,
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(Modifier.height(24.dp))

            Button(
                onClick = {
                    when {
                        firstName.isBlank() || lastName.isBlank() -> validationError = errorName
                        email.isBlank() || !email.contains("@") -> validationError = errorEmail
                        message.isBlank() -> validationError = errorMsg
                        else -> {
                            viewModel.submitContact(
                                firstName = firstName,
                                lastName = lastName,
                                email = email,
                                subject = selectedSubject,
                                message = message,
                            )
                            firstName = ""
                            lastName = ""
                            email = ""
                            phone = ""
                            message = ""
                            selectedSubject = subjects[0]
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = accent),
            ) {
                Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text(stringResource(R.string.contact_send_button), fontWeight = FontWeight.SemiBold)
            }

            Spacer(Modifier.height(32.dp))

            Text(
                text = stringResource(R.string.contact_find_us),
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.height(10.dp))
            val ipca = LatLng(41.5361, -8.6279)
            val cameraPositionState = rememberCameraPositionState {
                position = CameraPosition.fromLatLngZoom(ipca, 15f)
            }
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(220.dp)
                    .clip(RoundedCornerShape(16.dp)),
            ) {
                GoogleMap(
                    modifier = Modifier.fillMaxSize(),
                    cameraPositionState = cameraPositionState,
                ) {
                    Marker(
                        state = MarkerState(position = ipca),
                        title = stringResource(R.string.contact_map_marker_title),
                        snippet = stringResource(R.string.contact_map_marker_snippet),
                    )
                }
            }

            Spacer(Modifier.height(32.dp))

            Text(
                text = stringResource(R.string.contact_info_section),
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.height(12.dp))

            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(modifier = Modifier.padding(vertical = 8.dp)) {
                    ContactInfoRow(
                        icon = Icons.Default.Email,
                        label = stringResource(R.string.contact_info_email_label),
                        value = stringResource(R.string.contact_info_email_value),
                        accent = accent,
                    )
                    HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
                    ContactInfoRow(
                        icon = Icons.Default.Call,
                        label = stringResource(R.string.contact_info_phone_label),
                        value = stringResource(R.string.contact_info_phone_value),
                        accent = accent,
                    )
                    HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
                    ContactInfoRow(
                        icon = Icons.Default.LocationOn,
                        label = stringResource(R.string.contact_info_address_label),
                        value = stringResource(R.string.contact_info_address_value),
                        accent = accent,
                    )
                }
            }

            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun SubjectRadioItem(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    accent: Color,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(if (selected) accent.copy(alpha = 0.08f) else Color.Transparent)
            .border(
                width = if (selected) 1.5.dp else 1.dp,
                color = if (selected) accent else MaterialTheme.colorScheme.outlineVariant,
                shape = RoundedCornerShape(8.dp),
            )
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onClick,
            )
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            imageVector = if (selected) Icons.Default.RadioButtonChecked else Icons.Default.RadioButtonUnchecked,
            contentDescription = null,
            tint = if (selected) accent else MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(20.dp),
        )
        Spacer(Modifier.width(12.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = if (selected) FontWeight.Medium else FontWeight.Normal,
            color = if (selected) accent else MaterialTheme.colorScheme.onSurface,
        )
    }
}

@Composable
private fun ContactInfoRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String,
    accent: Color,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(accent.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = accent, modifier = Modifier.size(20.dp))
        }
        Spacer(Modifier.width(14.dp))
        Column {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 11.sp,
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
            )
        }
    }
}

@Composable
internal fun SupportBottomNav(
    currentRoute: String,
    onHome: () -> Unit,
    onContact: () -> Unit,
    onHelpDesk: () -> Unit,
) {
    val accent = MaterialTheme.colorScheme.primary
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 4.dp,
    ) {
        NavigationBarItem(
            selected = currentRoute == "home",
            onClick = onHome,
            icon = { Icon(Icons.Default.Home, contentDescription = stringResource(R.string.nav_home)) },
            label = { Text(stringResource(R.string.nav_home), style = MaterialTheme.typography.labelSmall) },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = accent,
                selectedTextColor = accent,
                indicatorColor = accent.copy(alpha = 0.12f),
            ),
        )
        NavigationBarItem(
            selected = currentRoute == "contact",
            onClick = onContact,
            icon = { Icon(Icons.Default.MailOutline, contentDescription = stringResource(R.string.nav_contact)) },
            label = { Text(stringResource(R.string.nav_contact), style = MaterialTheme.typography.labelSmall) },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = accent,
                selectedTextColor = accent,
                indicatorColor = accent.copy(alpha = 0.12f),
            ),
        )
        NavigationBarItem(
            selected = currentRoute == "helpdesk",
            onClick = onHelpDesk,
            icon = { Icon(Icons.AutoMirrored.Filled.HelpOutline, contentDescription = stringResource(R.string.nav_help_desk)) },
            label = { Text(stringResource(R.string.nav_help_desk), style = MaterialTheme.typography.labelSmall) },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = accent,
                selectedTextColor = accent,
                indicatorColor = accent.copy(alpha = 0.12f),
            ),
        )
    }
}
