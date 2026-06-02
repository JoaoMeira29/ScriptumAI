package pt.ipca.scriptumai.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pt.ipca.scriptumai.data.local.AuthEventBus
import pt.ipca.scriptumai.data.model.auth.RegisterRequest
import pt.ipca.scriptumai.data.model.auth.ResetPasswordRequest
import pt.ipca.scriptumai.data.repository.AuthRepository
import pt.ipca.scriptumai.domain.usecase.ForgotPasswordUseCase
import pt.ipca.scriptumai.domain.usecase.LoginUseCase
import pt.ipca.scriptumai.domain.usecase.RegisterUseCase
import pt.ipca.scriptumai.domain.usecase.ResetPasswordUseCase
import pt.ipca.scriptumai.util.Validators

data class AuthUiState(
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null,
    val message: String? = null
)

class AuthViewModel : ViewModel() {

    // Repositório é partilhado entre os UseCases
    private val repository = AuthRepository()
    
    // Camada de Domínio (Use Cases) seguindo o PADM11
    private val loginUseCase = LoginUseCase(repository)
    private val registerUseCase = RegisterUseCase(repository)
    private val forgotPasswordUseCase = ForgotPasswordUseCase(repository)
    private val resetPasswordUseCase = ResetPasswordUseCase(repository)

    private val _loginState = MutableStateFlow(AuthUiState())
    val loginState: StateFlow<AuthUiState> = _loginState.asStateFlow()
    

    private val _registerState = MutableStateFlow(AuthUiState())
    val registerState: StateFlow<AuthUiState> = _registerState.asStateFlow()

    private val _forgotPasswordState = MutableStateFlow(AuthUiState())
    val forgotPasswordState: StateFlow<AuthUiState> = _forgotPasswordState.asStateFlow()

    private val _resetPasswordState = MutableStateFlow(AuthUiState())
    val resetPasswordState: StateFlow<AuthUiState> = _resetPasswordState.asStateFlow()

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _loginState.update { it.copy(error = "Email and password cannot be empty.") }
            return
        }

        viewModelScope.launch {
            _loginState.update { it.copy(isLoading = true, error = null) }

            loginUseCase(email, password)
                .onSuccess {
                    _loginState.update { it.copy(isLoading = false, isSuccess = true) }
                }
                .onFailure { throwable ->
                    _loginState.update {
                        it.copy(isLoading = false, error = throwable.toUserMessage())
                    }
                }
        }
    }

    fun register(request: RegisterRequest, confirmPassword: String) {
        if (request.email.isBlank() || request.password.isBlank() || request.name.isBlank() || request.surname.isBlank() || request.organizationName.isNullOrBlank()) {
            _registerState.update { it.copy(error = "Please fill in all required fields.") }
            return
        }
        if (!Validators.isPasswordValid(request.password)) {
            _registerState.update { it.copy(error = "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.") }
            return
        }
        if (request.password != confirmPassword) {
            _registerState.update { it.copy(error = "Passwords do not match.") }
            return
        }

        viewModelScope.launch {
            _registerState.update { it.copy(isLoading = true, error = null) }

            registerUseCase(request)
                .onSuccess {
                    _registerState.update { it.copy(isLoading = false, isSuccess = true) }
                }
                .onFailure { throwable ->
                    _registerState.update {
                        it.copy(isLoading = false, error = throwable.toUserMessage())
                    }
                }
        }
    }

    fun forgotPassword(email: String) {
        if (email.isBlank()) {
            _forgotPasswordState.update { it.copy(error = "Please enter your email.") }
            return
        }

        viewModelScope.launch {
            _forgotPasswordState.update { it.copy(isLoading = true, error = null) }

            forgotPasswordUseCase(email)
                .onSuccess { response ->
                    _forgotPasswordState.update { 
                        it.copy(isLoading = false, isSuccess = true, message = response.message) 
                    }
                }
                .onFailure { throwable ->
                    _forgotPasswordState.update {
                        it.copy(isLoading = false, error = throwable.toUserMessage())
                    }
                }
        }
    }

    fun resetPassword(request: ResetPasswordRequest) {
        if (request.email.isBlank() || request.token.isBlank() || request.newPassword.isBlank()) {
            _resetPasswordState.update { it.copy(error = "Please fill in all fields.") }
            return
        }

        viewModelScope.launch {
            _resetPasswordState.update { it.copy(isLoading = true, error = null) }

            resetPasswordUseCase(request)
                .onSuccess { response ->
                    _resetPasswordState.update { 
                        it.copy(isLoading = false, isSuccess = true, message = response.message) 
                    }
                }
                .onFailure { throwable ->
                    _resetPasswordState.update {
                        it.copy(isLoading = false, error = throwable.toUserMessage())
                    }
                }
        }
    }

    fun logout() {
        viewModelScope.launch {
            repository.logout()
            _loginState.update { AuthUiState() }
            AuthEventBus.emitUnauthenticated()
        }
    }

    private fun Throwable.toUserMessage(): String {
        return this.message ?: "An unexpected error occurred. Please try again."
    }
}
