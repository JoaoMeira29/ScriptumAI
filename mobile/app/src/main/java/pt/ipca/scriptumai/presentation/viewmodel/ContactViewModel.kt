package pt.ipca.scriptumai.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pt.ipca.scriptumai.data.repository.NotificationsRepository

data class ContactUiState(
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null,
)

class ContactViewModel : ViewModel() {

    private val repository = NotificationsRepository()

    private val _state = MutableStateFlow(ContactUiState())
    val state: StateFlow<ContactUiState> = _state.asStateFlow()

    fun submitContact(
        firstName: String,
        lastName: String,
        email: String,
        subject: String,
        message: String,
    ) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            repository.submitContact(firstName, lastName, email, subject, message)
                .onSuccess { _state.update { it.copy(isLoading = false, isSuccess = true) } }
                .onFailure { err -> _state.update { it.copy(isLoading = false, error = err.message) } }
        }
    }

    fun resetSuccess() = _state.update { it.copy(isSuccess = false) }

    fun resetError() = _state.update { it.copy(error = null) }
}
