package pt.ipca.scriptumai.presentation.ui.home

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AlternateEmail
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.delay
import pt.ipca.scriptumai.R
import pt.ipca.scriptumai.presentation.viewmodel.ProfileViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditProfileScreen(
    onNavigateBack: () -> Unit = {},
    viewModel: ProfileViewModel = viewModel(),
) {
    val accent = MaterialTheme.colorScheme.primary
    val profileState by viewModel.profileState.collectAsState()
    val updateProfileState by viewModel.updateProfileState.collectAsState()

    val profile = profileState.profile

    var name by rememberSaveable(profile) { mutableStateOf(profile?.name.orEmpty()) }
    var surname by rememberSaveable(profile) { mutableStateOf(profile?.surname.orEmpty()) }
    var username by rememberSaveable(profile) { mutableStateOf(profile?.username.orEmpty()) }
    var profileError by remember { mutableStateOf<String?>(null) }

    var showSuccessDialog by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val allFieldsRequired = stringResource(R.string.all_fields_required)
    val usernameShort = stringResource(R.string.edit_profile_error_username_short)

    LaunchedEffect(updateProfileState.isSuccess) {
        if (updateProfileState.isSuccess) {
            showSuccessDialog = true
            viewModel.resetUpdateProfileState()
        }
    }

    LaunchedEffect(updateProfileState.error) {
        updateProfileState.error?.let {
            errorMessage = it
            viewModel.resetUpdateProfileState()
        }
    }

    if (showSuccessDialog) {
        LaunchedEffect(Unit) {
            delay(2500)
            showSuccessDialog = false
        }
        AlertDialog(
            onDismissRequest = { showSuccessDialog = false },
            icon = {
                Icon(
                    Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = Color(0xFF388E3C),
                    modifier = Modifier.size(32.dp),
                )
            },
            title = { Text(stringResource(R.string.edit_profile_success_title)) },
            text = { Text(stringResource(R.string.edit_profile_success_body)) },
            confirmButton = {
                TextButton(onClick = { showSuccessDialog = false }) {
                    Text(stringResource(R.string.ok), color = accent)
                }
            },
        )
    }

    errorMessage?.let { msg ->
        LaunchedEffect(msg) {
            delay(3000)
            errorMessage = null
        }
        AlertDialog(
            onDismissRequest = { errorMessage = null },
            icon = {
                Icon(
                    Icons.Default.ErrorOutline,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.error,
                    modifier = Modifier.size(32.dp),
                )
            },
            title = { Text(stringResource(R.string.error_something_went_wrong)) },
            text = { Text(msg) },
            confirmButton = {
                TextButton(onClick = { errorMessage = null }) {
                    Text(stringResource(R.string.ok), color = accent)
                }
            },
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.edit_profile_title), fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = stringResource(R.string.back))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                )
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
                text = stringResource(R.string.edit_profile_section_title),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground,
            )

            Spacer(Modifier.height(4.dp))

            Text(
                text = stringResource(R.string.edit_profile_section_subtitle),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(Modifier.height(20.dp))

            OutlinedTextField(
                value = name,
                onValueChange = { name = it; profileError = null },
                label = { Text(stringResource(R.string.edit_profile_first_name)) },
                singleLine = true,
                leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(Modifier.height(16.dp))

            OutlinedTextField(
                value = surname,
                onValueChange = { surname = it; profileError = null },
                label = { Text(stringResource(R.string.edit_profile_last_name)) },
                singleLine = true,
                leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(Modifier.height(16.dp))

            OutlinedTextField(
                value = username,
                onValueChange = { username = it; profileError = null },
                label = { Text(stringResource(R.string.edit_profile_username)) },
                singleLine = true,
                isError = profileError != null,
                supportingText = profileError?.let { { Text(it) } },
                leadingIcon = { Icon(Icons.Default.AlternateEmail, contentDescription = null) },
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(Modifier.height(24.dp))

            Button(
                onClick = {
                    when {
                        name.isBlank() || surname.isBlank() || username.isBlank() -> {
                            profileError = allFieldsRequired
                        }
                        username.length < 3 -> {
                            profileError = usernameShort
                        }
                        else -> {
                            profileError = null
                            viewModel.updateProfile(name.trim(), surname.trim(), username.trim())
                        }
                    }
                },
                enabled = !updateProfileState.isLoading,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = accent),
            ) {
                if (updateProfileState.isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                } else {
                    Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.padding(start = 8.dp))
                    Text(stringResource(R.string.edit_profile_save_button), fontWeight = FontWeight.SemiBold)
                }
            }

            Spacer(Modifier.height(24.dp))
        }
    }
}
