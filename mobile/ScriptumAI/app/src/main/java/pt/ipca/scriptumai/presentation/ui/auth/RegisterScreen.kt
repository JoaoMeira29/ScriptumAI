package pt.ipca.scriptumai.presentation.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import pt.ipca.scriptumai.R
import pt.ipca.scriptumai.data.model.auth.RegisterRequest
import pt.ipca.scriptumai.data.model.auth.availablePlans
import pt.ipca.scriptumai.presentation.viewmodel.AuthViewModel
import pt.ipca.scriptumai.ui.theme.LocalAppColors

@Composable
fun RegisterScreen(
    selectedPlanId: String = "free-trial",
    onNavigateToLogin: () -> Unit = {},
    onRegisterSuccess: () -> Unit = {},
    viewModel: AuthViewModel = viewModel()
) {
    val appColors = LocalAppColors.current
    val colorScheme = MaterialTheme.colorScheme
    
    var name by remember { mutableStateOf("") }
    var surname by remember { mutableStateOf("") }
    var username by remember { mutableStateOf("") }
    var orgName by remember { mutableStateOf("") }
    var city by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var contact by remember { mutableStateOf("") }
    var zipCode by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var termsAccepted by remember { mutableStateOf(false) }

    val uiState by viewModel.registerState.collectAsState()

    LaunchedEffect(uiState.isSuccess) {
        if (uiState.isSuccess) onRegisterSuccess()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(24.dp)
    ) {
        Text(
            text = stringResource(R.string.register_title),
            style = MaterialTheme.typography.labelLarge,
            color = colorScheme.primary
        )

        Text(
            text = stringResource(R.string.register_subtitle),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(vertical = 8.dp)
        )

        Text(
            text = stringResource(R.string.register_trial_note),
            style = MaterialTheme.typography.bodyMedium,
            color = appColors.mutedForeground
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Plan Selection List
        availablePlans.forEach { plan ->
            val isCurrent = plan.id == selectedPlanId
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
                    .background(
                        if (isCurrent) colorScheme.primary.copy(alpha = 0.05f) else Color.Transparent,
                        RoundedCornerShape(12.dp)
                    )
                    .border(
                        1.dp,
                        if (isCurrent) colorScheme.primary else appColors.mutedForeground.copy(alpha = 0.2f),
                        RoundedCornerShape(12.dp)
                    )
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(plan.name, fontWeight = FontWeight.Bold)
                        if (plan.isPopular) {
                            Surface(
                                color = colorScheme.primary.copy(alpha = 0.2f),
                                shape = CircleShape,
                                modifier = Modifier.padding(start = 8.dp)
                            ) {
                                Text(stringResource(R.string.register_popular), modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp), style = MaterialTheme.typography.labelSmall, color = colorScheme.primary)
                            }
                        }
                    }
                    Text(plan.price, style = MaterialTheme.typography.bodySmall)
                }
                RadioButton(selected = isCurrent, onClick = null)
            }
        }

        Spacer(modifier = Modifier.height(32.dp))
        
        Text(stringResource(R.string.register_org_details), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Text(stringResource(R.string.register_fill_details), style = MaterialTheme.typography.bodySmall, color = appColors.mutedForeground)

        Spacer(modifier = Modifier.height(16.dp))

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            CustomTextField(value = name, onValueChange = { name = it }, label = stringResource(R.string.register_first_name), modifier = Modifier.weight(1f), required = true)
            CustomTextField(value = surname, onValueChange = { surname = it }, label = stringResource(R.string.register_last_name), modifier = Modifier.weight(1f), required = true)
        }

        CustomTextField(value = username, onValueChange = { username = it }, label = stringResource(R.string.register_username_optional), placeholder = stringResource(R.string.register_username_hint))
        CustomTextField(value = orgName, onValueChange = { orgName = it }, label = stringResource(R.string.register_org_name), required = true)
        CustomTextField(value = city, onValueChange = { city = it }, label = stringResource(R.string.register_city))
        CustomTextField(value = address, onValueChange = { address = it }, label = stringResource(R.string.register_address))

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            CustomTextField(value = contact, onValueChange = { contact = it }, label = stringResource(R.string.register_contact), modifier = Modifier.weight(1.5f), keyboardType = KeyboardType.Phone)
            CustomTextField(value = zipCode, onValueChange = { zipCode = it }, label = stringResource(R.string.register_zip_code), modifier = Modifier.weight(1f))
        }

        CustomTextField(value = email, onValueChange = { email = it }, label = stringResource(R.string.register_work_email), keyboardType = KeyboardType.Email, required = true)
        CustomTextField(value = password, onValueChange = { password = it }, label = stringResource(R.string.login_password), isPassword = true, required = true)
        CustomTextField(value = confirmPassword, onValueChange = { confirmPassword = it }, label = stringResource(R.string.register_confirm_password), isPassword = true, required = true)

        if (uiState.error != null) {
            Text(
                text = uiState.error!!,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(vertical = 8.dp)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            Checkbox(checked = termsAccepted, onCheckedChange = { termsAccepted = it })
            Text(
                stringResource(R.string.register_trial_accept),
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(start = 4.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                val request = RegisterRequest(
                    email = email,
                    password = password,
                    username = if (username.isBlank()) null else username,
                    name = name,
                    surname = surname,
                    planId = selectedPlanId,
                    organizationName = orgName,
                    city = city,
                    address = address,
                    contact = contact,
                    zipCode = zipCode
                )
                viewModel.register(request, confirmPassword)
            },
            modifier = Modifier.fillMaxWidth().height(50.dp),
            shape = RoundedCornerShape(12.dp),
            enabled = termsAccepted && selectedPlanId == "free-trial" && !uiState.isLoading
        ) {
            if (uiState.isLoading) {
                CircularProgressIndicator(color = colorScheme.onPrimary, modifier = Modifier.size(24.dp))
            } else {
                Text(stringResource(R.string.register_cta))
            }
        }

        if (selectedPlanId != "free-trial") {
            Text(
                stringResource(R.string.register_paid_note),
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
            )
        }

        OutlinedButton(
            onClick = onNavigateToLogin,
            modifier = Modifier.fillMaxWidth().padding(top = 12.dp).height(50.dp),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text(stringResource(R.string.register_already_have_account))
        }

        Spacer(modifier = Modifier.height(40.dp))
    }
}

@Composable
fun CustomTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    placeholder: String = "",
    modifier: Modifier = Modifier,
    isPassword: Boolean = false,
    keyboardType: KeyboardType = KeyboardType.Text,
    required: Boolean = false
) {
    val appColors = LocalAppColors.current
    Column(modifier = modifier.padding(vertical = 8.dp)) {
        Text(
            text = buildAnnotatedString {
                append(label)
                if (required) {
                    withStyle(SpanStyle(color = MaterialTheme.colorScheme.error)) {
                        append(" *")
                    }
                }
            },
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold
        )
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { if(placeholder.isNotEmpty()) Text(placeholder, style = MaterialTheme.typography.bodyMedium) },
            modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
            shape = RoundedCornerShape(8.dp),
            singleLine = true,
            visualTransformation = if (isPassword) PasswordVisualTransformation() else VisualTransformation.None,
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedContainerColor = appColors.input,
                focusedContainerColor = appColors.input,
                unfocusedBorderColor = Color.Transparent,
                focusedBorderColor = MaterialTheme.colorScheme.primary
            )
        )
    }
}
