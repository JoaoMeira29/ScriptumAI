package pt.ipca.scriptumai.presentation.ui.auth

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import pt.ipca.scriptumai.R
import pt.ipca.scriptumai.presentation.viewmodel.AuthViewModel
import pt.ipca.scriptumai.ui.theme.LocalAppColors
import pt.ipca.scriptumai.ui.theme.ScriptumAITheme
import java.util.Calendar

@Composable
fun LoginScreen(
    onNavigateToHome: () -> Unit = {},
    onNavigateToRegister: () -> Unit = {},
    onNavigateToForgotPassword: () -> Unit = {},
    viewModel: AuthViewModel = viewModel(),
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }

    val uiState by viewModel.loginState.collectAsState()
    val currentYear = remember { Calendar.getInstance().get(Calendar.YEAR) }

    LaunchedEffect(uiState.isSuccess) {
        if (uiState.isSuccess) onNavigateToHome()
    }

    val appColors = LocalAppColors.current
    val colorScheme = MaterialTheme.colorScheme
    val background      = colorScheme.background
    val primary         = colorScheme.primary
    val onPrimary       = colorScheme.onPrimary
    val foreground      = colorScheme.onBackground
    val inputBg         = appColors.input
    val borderColor     = colorScheme.outline
    val mutedForeground = appColors.mutedForeground
    val errorColor      = colorScheme.error

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(background)
            .padding(horizontal = 40.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.Center)
                .padding(bottom = 64.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Image(
                painter = painterResource(id = R.drawable.logo),
                contentDescription = stringResource(R.string.login_logo_description),
                contentScale = ContentScale.Fit,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp)
            )

            Spacer(modifier = Modifier.height(24.dp))

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                placeholder = {
                    Text(
                        text = stringResource(R.string.login_email),
                        style = MaterialTheme.typography.bodyMedium,
                        color = mutedForeground
                    )
                },
                shape = CircleShape,
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedContainerColor = inputBg,
                    focusedContainerColor = inputBg,
                    unfocusedBorderColor = borderColor,
                    focusedBorderColor = primary,
                    unfocusedTextColor = foreground,
                    focusedTextColor = foreground,
                    cursorColor = primary,
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
            )

            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                placeholder = {
                    Text(
                        text = stringResource(R.string.login_password),
                        style = MaterialTheme.typography.bodyMedium,
                        color = mutedForeground
                    )
                },
                shape = CircleShape,
                visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                trailingIcon = {
                    IconButton(onClick = { passwordVisible = !passwordVisible }) {
                        Icon(
                            imageVector = if (passwordVisible) Icons.Filled.Visibility else Icons.Filled.VisibilityOff,
                            contentDescription = if (passwordVisible) stringResource(R.string.hide_password) else stringResource(R.string.show_password),
                            tint = mutedForeground
                        )
                    }
                },
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedContainerColor = inputBg,
                    focusedContainerColor = inputBg,
                    unfocusedBorderColor = borderColor,
                    focusedBorderColor = primary,
                    unfocusedTextColor = foreground,
                    focusedTextColor = foreground,
                    cursorColor = primary,
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
            )

            if (uiState.error != null) {
                Text(
                    text = uiState.error!!,
                    color = errorColor,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = 8.dp)
                )
            }

            Text(
                text = stringResource(R.string.login_forgot_password),
                color = primary,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Medium,
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onNavigateToForgotPassword() }
                    .padding(start = 8.dp, top = 2.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = { viewModel.login(email, password) },
                enabled = !uiState.isLoading,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = CircleShape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = primary,
                    contentColor = onPrimary
                )
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(
                        color = onPrimary,
                        modifier = Modifier.size(22.dp),
                        strokeWidth = 2.dp
                    )
                } else {
                    Text(
                        text = stringResource(R.string.login_title),
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.bodyLarge
                    )
                }
            }

            OutlinedButton(
                onClick = onNavigateToRegister,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = CircleShape,
                border = BorderStroke(1.5.dp, primary),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = background,
                    contentColor = primary
                )
            ) {
                Text(
                    text = stringResource(R.string.login_sign_up),
                    style = MaterialTheme.typography.bodyLarge
                )
            }
        }

        Text(
            text = stringResource(R.string.login_copyright, currentYear),
            color = primary,
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 28.dp)
        )
    }
}

@Preview(showBackground = true, showSystemUi = true, name = "Light")
@Composable
private fun LoginScreenLightPreview() {
    ScriptumAITheme(darkTheme = false) {
        LoginScreen()
    }
}

@Preview(showBackground = true, showSystemUi = true, name = "Dark")
@Composable
private fun LoginScreenDarkPreview() {
    ScriptumAITheme(darkTheme = true) {
        LoginScreen()
    }
}
