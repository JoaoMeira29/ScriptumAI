package pt.ipca.scriptumai.presentation.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import pt.ipca.scriptumai.R
import pt.ipca.scriptumai.presentation.viewmodel.AuthViewModel
import pt.ipca.scriptumai.ui.theme.LocalAppColors

@Composable
fun ForgotPasswordScreen(
    onNavigateBack: () -> Unit,
    viewModel: AuthViewModel = viewModel()
) {
    val appColors = LocalAppColors.current
    val colorScheme = MaterialTheme.colorScheme
    
    var email by remember { mutableStateOf("") }
    val forgotState by viewModel.forgotPasswordState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colorScheme.background)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        if (!forgotState.isSuccess) {
            Text(
                text = stringResource(R.string.forgot_password_title),
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = colorScheme.onBackground
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = stringResource(R.string.forgot_password_subtitle),
                style = MaterialTheme.typography.bodyMedium,
                color = appColors.mutedForeground,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(32.dp))

            CustomTextField(
                value = email,
                onValueChange = { email = it },
                label = stringResource(R.string.forgot_password_email_label),
                keyboardType = KeyboardType.Email
            )

            if (forgotState.error != null) {
                Text(
                    text = forgotState.error!!,
                    color = colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = { viewModel.forgotPassword(email) },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = CircleShape,
                enabled = !forgotState.isLoading
            ) {
                if (forgotState.isLoading) {
                    CircularProgressIndicator(color = colorScheme.onPrimary, modifier = Modifier.size(24.dp))
                } else {
                    Text(stringResource(R.string.forgot_password_send_button))
                }
            }
        } else {
            Icon(
                imageVector = Icons.Default.Email,
                contentDescription = null,
                tint = colorScheme.primary,
                modifier = Modifier.size(64.dp)
            )
            
            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = stringResource(R.string.forgot_password_check_email_title),
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = colorScheme.onBackground
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "${stringResource(R.string.forgot_password_check_email_body)}\n$email",
                style = MaterialTheme.typography.bodyMedium,
                color = appColors.mutedForeground,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = stringResource(R.string.forgot_password_instructions),
                style = MaterialTheme.typography.bodySmall,
                color = appColors.mutedForeground,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp)
            )
        }

        Spacer(modifier = Modifier.height(32.dp))

        TextButton(onClick = onNavigateBack) {
            Text(stringResource(R.string.forgot_password_back_to_login), color = colorScheme.primary)
        }
    }
}
