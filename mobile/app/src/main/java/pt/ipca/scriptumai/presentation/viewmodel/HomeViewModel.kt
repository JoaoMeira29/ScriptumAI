package pt.ipca.scriptumai.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pt.ipca.scriptumai.data.repository.AuthRepository

data class HomeUiState(
    val displayName: String = "User",
    val initials: String = "U",
    val userEmail: String = "",
)

class HomeViewModel : ViewModel() {

    private val repository = AuthRepository()

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        fetchProfile()
    }

    private fun fetchProfile() {
        viewModelScope.launch {
            repository.getMe()
                .onSuccess { profile ->
                    val name = listOfNotNull(profile.name, profile.surname)
                        .joinToString(" ")
                        .ifBlank { profile.email.orEmpty() }
                    _uiState.update {
                        it.copy(
                            displayName = name.ifBlank { "User" },
                            initials = buildInitials(profile.name, profile.surname),
                            userEmail = profile.email.orEmpty(),
                        )
                    }
                }
            // On failure, keep the default state
        }
    }

    private fun buildInitials(name: String?, surname: String?): String {
        val f = name?.firstOrNull()?.uppercaseChar()
        val l = surname?.firstOrNull()?.uppercaseChar()
        return when {
            f != null && l != null -> "$f$l"
            f != null -> "$f"
            else -> "U"
        }
    }
}
