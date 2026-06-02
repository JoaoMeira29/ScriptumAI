package pt.ipca.scriptumai.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pt.ipca.scriptumai.data.model.notification.NotificationLog
import pt.ipca.scriptumai.data.repository.NotificationsRepository

enum class NotificationTab { UNREAD, ALL }

data class NotificationsUiState(
    val isLoading: Boolean = false,
    val logs: List<NotificationLog> = emptyList(),
    val tab: NotificationTab = NotificationTab.UNREAD,
    val error: String? = null,
) {
    val displayed: List<NotificationLog>
        get() = if (tab == NotificationTab.UNREAD) logs.filter { !it.isRead } else logs
}

class NotificationsViewModel : ViewModel() {

    private val repository = NotificationsRepository()

    private val _state = MutableStateFlow(NotificationsUiState())
    val state: StateFlow<NotificationsUiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            repository.getLogs()
                .onSuccess { logs -> _state.update { it.copy(isLoading = false, logs = logs) } }
                .onFailure { err -> _state.update { it.copy(isLoading = false, error = err.message) } }
        }
    }

    fun setTab(tab: NotificationTab) = _state.update { it.copy(tab = tab) }

    fun markAllRead() {
        viewModelScope.launch {
            repository.markAllRead()
                .onSuccess { _state.update { it.copy(logs = it.logs.map { log -> log.copy(isRead = true) }) } }
        }
    }

    fun markOneRead(id: String) {
        viewModelScope.launch {
            repository.markOneRead(id)
                .onSuccess { _state.update { it.copy(logs = it.logs.map { log -> if (log.id == id) log.copy(isRead = true) else log }) } }
        }
    }

    fun deleteLog(id: String) {
        viewModelScope.launch {
            repository.deleteLog(id)
                .onSuccess { _state.update { it.copy(logs = it.logs.filter { log -> log.id != id }) } }
        }
    }

    fun clearAll() {
        viewModelScope.launch {
            repository.clearAll()
                .onSuccess { _state.update { it.copy(logs = emptyList()) } }
        }
    }
}
