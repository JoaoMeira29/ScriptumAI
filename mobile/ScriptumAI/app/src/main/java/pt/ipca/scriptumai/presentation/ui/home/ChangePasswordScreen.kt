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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.delay
import pt.ipca.scriptumai.R
import pt.ipca.scriptumai.presentation.viewmodel.ProfileViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChangePasswordScreen(
    onNavigateBack: () -> Unit = {},
    viewModel: ProfileViewModel = viewModel(),
) {
    val accent = MaterialTheme.colorScheme.primary
    val passwordState by viewModel.passwordState.collectAsState()

    var currentPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var showCurrent by remember { mutableStateOf(false) }
    var showNew by remember { mutableStateOf(false) }
    var showConfirm by remember { mutableStateOf(false) }
    var passwordError by remember { mutableStateOf<String?>(null) }

    var showSuccessDialog by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val allFieldsRequired = stringResource(R.string.all_fields_required)
    val passwordMismatch  = stringResource(R.string.change_password_error_mismatch)
    val passwordTooShort  = stringResource(R.string.change_password_error_too_short)

    LaunchedEffect(passwordState.isSuccess) {
        if (passwordState.isSuccess) {
            showSuccessDialog = true
            currentPassword = ""
            newPassword = ""
            confirmPassword = ""
            viewModel.resetPasswordState()
        }
    }

    LaunchedEffect(passwordState.error) {
        passwordState.error?.let {
            errorMessage = it
            viewModel.resetPasswordState()
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
            title = { Text(stringResource(R.string.change_password_success_title)) },
            text = { Text(stringResource(R.string.change_password_success_body)) },
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
                title = { Text(stringResource(R.string.change_password_title), fontWeight = FontWeight.SemiBold) },
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
                text = stringResource(R.string.change_password_title),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground,
            )

            Spacer(Modifier.height(4.dp))

            Text(
                text = stringResource(R.string.change_password_subtitle),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(Modifier.height(20.dp))

            PasswordField(
                value = currentPassword,
                onValueChange = { currentPassword = it; passwordError = null },
                label = stringResource(R.string.change_password_current),
                visible = showCurrent,
                onToggleVisibility = { showCurrent = !showCurrent },
            )

            Spacer(Modifier.height(16.dp))

            PasswordField(
                value = newPassword,
                onValueChange = { newPassword = it; passwordError = null },
                label = stringResource(R.string.change_password_new),
                visible = showNew,
                onToggleVisibility = { showNew = !showNew },
            )

            Spacer(Modifier.height(16.dp))

            PasswordField(
                value = confirmPassword,
                onValueChange = { confirmPassword = it; passwordError = null },
                label = stringResource(R.string.change_password_confirm),
                visible = showConfirm,
                onToggleVisibility = { showConfirm = !showConfirm },
                isError = passwordError != null,
                supportingText = passwordError,
            )

            Spacer(Modifier.height(24.dp))

            Button(
                onClick = {
                    when {
                        currentPassword.isBlank() || newPassword.isBlank() || confirmPassword.isBlank() -> {
                            passwordError = allFieldsRequired
                        }
                        newPassword != confirmPassword -> {
                            passwordError = passwordMismatch
                        }
                        newPassword.length < 8 -> {
                            passwordError = passwordTooShort
                        }
                        else -> {
                            passwordError = null
                            viewModel.changePassword(currentPassword, newPassword)
                        }
                    }
                },
                enabled = !passwordState.isLoading,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = accent),
            ) {
                if (passwordState.isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                } else {
                    Icon(Icons.Default.Lock, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.padding(start = 8.dp))
                    Text(stringResource(R.string.change_password_save_button), fontWeight = FontWeight.SemiBold)
                }
            }

            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun PasswordField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    visible: Boolean,
    onToggleVisibility: () -> Unit,
    isError: Boolean = false,
    supportingText: String? = null,
) {
    val hideLabel = stringResource(R.string.hide_password)
    val showLabel = stringResource(R.string.show_password)
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        singleLine = true,
        isError = isError,
        supportingText = supportingText?.let { { Text(it) } },
        visualTransformation = if (visible) VisualTransformation.None else PasswordVisualTransformation(),
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
        trailingIcon = {
            IconButton(onClick = onToggleVisibility) {
                Icon(
                    imageVector = if (visible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                    contentDescription = if (visible) hideLabel else showLabel,
                )
            }
        },
        modifier = Modifier.fillMaxWidth(),
    )
}
