package pt.ipca.scriptumai.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import pt.ipca.scriptumai.data.model.SourceDocument
import pt.ipca.scriptumai.data.repository.DocumentRepository

data class GlobalChatMessage(
    val text: String,
    val isFromUser: Boolean,
    val sourceDocuments: List<SourceDocument>? = null,
    val id: String = java.util.UUID.randomUUID().toString(),
)

data class GlobalChatUiState(
    val messages: List<GlobalChatMessage> = emptyList(),
    val isSending: Boolean = false,
    val messagesSent: Int = 0,
    val messagesLimit: Int = 3,
    val remainingMessages: Int = 3,
    val isLoadingHistory: Boolean = true,
    val error: String? = null,
)

class GlobalChatViewModel : ViewModel() {

    private val repository = DocumentRepository()

    private val _uiState = MutableStateFlow(GlobalChatUiState())
    val uiState: StateFlow<GlobalChatUiState> = _uiState.asStateFlow()

    init {
        loadHistory()
    }

    private fun loadHistory() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingHistory = true)

            val usageResult = repository.getGlobalChatUsage()
            usageResult.onSuccess { usage ->
                _uiState.value = _uiState.value.copy(
                    messagesSent = usage.messagesSent,
                    messagesLimit = usage.limit,
                    remainingMessages = usage.remainingMessages,
                )
            }

            val historyResult = repository.getGlobalChatHistory()
            historyResult.onSuccess { history ->
                val msgs = history.map { m ->
                    GlobalChatMessage(
                        id = m.id,
                        text = m.content,
                        isFromUser = m.role == "user",
                        sourceDocuments = m.sourceDocuments,
                    )
                }
                _uiState.value = _uiState.value.copy(
                    messages = msgs,
                    isLoadingHistory = false,
                )
            }.onFailure {
                _uiState.value = _uiState.value.copy(isLoadingHistory = false)
            }
        }
    }

    fun askQuestion(question: String) {
        if (question.isBlank() || _uiState.value.isSending) return
        if (_uiState.value.remainingMessages <= 0) return

        val userMsg = GlobalChatMessage(text = question.trim(), isFromUser = true)

        _uiState.value = _uiState.value.copy(
            messages = _uiState.value.messages + userMsg,
            isSending = true,
            error = null,
        )

        viewModelScope.launch {
            repository.globalChat(question.trim())
                .onSuccess { response ->
                    val assistantMsg = GlobalChatMessage(
                        text = response.answer,
                        isFromUser = false,
                        sourceDocuments = response.sourceDocuments,
                    )
                    _uiState.value = _uiState.value.copy(
                        messages = _uiState.value.messages + assistantMsg,
                        isSending = false,
                        messagesSent = response.messagesSent,
                        messagesLimit = response.limit,
                        remainingMessages = response.remainingMessages,
                    )
                }
                .onFailure { e ->
                    _uiState.value = _uiState.value.copy(
                        isSending = false,
                        error = e.message,
                    )
                }
        }
    }
}
