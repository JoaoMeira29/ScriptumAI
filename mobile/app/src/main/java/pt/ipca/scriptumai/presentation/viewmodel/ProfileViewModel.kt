package pt.ipca.scriptumai.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pt.ipca.scriptumai.data.model.auth.UpdateProfileRequest
import pt.ipca.scriptumai.data.model.auth.UserProfile
import pt.ipca.scriptumai.data.repository.AuthRepository

data class ProfileUiState(
    val isLoading: Boolean = false,
    val profile: UserProfile? = null,
    val error: String? = null,
)

data class PasswordUiState(
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null,
)

data class UpdateProfileUiState(
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null,
)

class ProfileViewModel : ViewModel() {

    private val repository = AuthRepository()

    private val _profileState = MutableStateFlow(ProfileUiState())
    val profileState: StateFlow<ProfileUiState> = _profileState.asStateFlow()

    private val _passwordState = MutableStateFlow(PasswordUiState())
    val passwordState: StateFlow<PasswordUiState> = _passwordState.asStateFlow()

    private val _updateProfileState = MutableStateFlow(UpdateProfileUiState())
    val updateProfileState: StateFlow<UpdateProfileUiState> = _updateProfileState.asStateFlow()

    init { loadProfile() }

    fun loadProfile() {
        viewModelScope.launch {
            _profileState.update { it.copy(isLoading = true, error = null) }
            repository.getMe()
                .onSuccess { profile ->
                    _profileState.update { it.copy(isLoading = false, profile = profile) }
                }
                .onFailure { err ->
                    _profileState.update { it.copy(isLoading = false, error = err.message) }
                }
        }
    }

    fun changePassword(current: String, new: String) {
        viewModelScope.launch {
            _passwordState.update { it.copy(isLoading = true, error = null, isSuccess = false) }
            repository.changePassword(current, new)
                .onSuccess {
                    _passwordState.update { it.copy(isLoading = false, isSuccess = true) }
                }
                .onFailure { err ->
                    _passwordState.update {
                        it.copy(isLoading = false, error = err.message ?: "Failed to change password")
                    }
                }
        }
    }

    fun resetPasswordState() {
        _passwordState.update { PasswordUiState() }
    }

    fun updateProfile(name: String, surname: String, username: String) {
        viewModelScope.launch {
            _updateProfileState.update { it.copy(isLoading = true, error = null, isSuccess = false) }
            repository.updateProfile(
                UpdateProfileRequest(
                    name = name.ifBlank { null },
                    surname = surname.ifBlank { null },
                    username = username.ifBlank { null },
                )
            )
                .onSuccess {
                    _updateProfileState.update { it.copy(isLoading = false, isSuccess = true) }
                    loadProfile()
                }
                .onFailure { err ->
                    _updateProfileState.update {
                        it.copy(isLoading = false, error = err.message ?: "Failed to update profile")
                    }
                }
        }
    }

    fun resetUpdateProfileState() {
        _updateProfileState.update { UpdateProfileUiState() }
    }
}
