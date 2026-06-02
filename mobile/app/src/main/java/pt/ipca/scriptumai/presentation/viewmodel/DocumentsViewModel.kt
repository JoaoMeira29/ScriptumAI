package pt.ipca.scriptumai.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.async
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pt.ipca.scriptumai.data.model.ChatMessage
import pt.ipca.scriptumai.data.model.document.DepartmentApiModel
import pt.ipca.scriptumai.data.model.document.DocumentApiModel
import pt.ipca.scriptumai.data.model.document.UpdateDocumentRequest
import pt.ipca.scriptumai.data.repository.DocumentRepository
import pt.ipca.scriptumai.domain.usecase.DeleteDocumentUseCase
import pt.ipca.scriptumai.domain.usecase.ListDepartmentsUseCase
import pt.ipca.scriptumai.domain.usecase.ListDocumentsUseCase
import pt.ipca.scriptumai.domain.usecase.UpdateDocumentUseCase
import retrofit2.HttpException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

data class DocumentsUiState(
    val documents: List<DocumentApiModel> = emptyList(),
    val departments: List<DepartmentApiModel> = emptyList(),
    val userDepartments: List<DepartmentApiModel> = emptyList(),
    val isLoading: Boolean = false,
    val operationInProgress: Boolean = false,
    val error: String? = null,
    val chatMessages: List<ChatMessage> = emptyList(),
    val isChatSending: Boolean = false,
    val chatMessagesSent: Int? = null,
    val chatMessagesLimit: Int? = null,
)

private fun Throwable.toUserMessage(): String = when {
    this is HttpException -> when (code()) {
        403 -> "Sem permissão para realizar esta ação."
        404 -> "Documento não encontrado."
        in 500..599 -> "Erro interno do servidor. Tenta mais tarde."
        else -> "Erro de rede (${code()})."
    }
    this is UnknownHostException -> "Sem ligação à internet."
    this is SocketTimeoutException -> "Tempo limite da ligação excedido."
    else -> message ?: "Erro desconhecido."
}

class DocumentsViewModel : ViewModel() {

    private val repository = DocumentRepository()
    
    // Camada de Domínio (Use Cases)
    private val listDocumentsUseCase = ListDocumentsUseCase(repository)
    private val listDepartmentsUseCase = ListDepartmentsUseCase(repository)
    private val updateDocumentUseCase = UpdateDocumentUseCase(repository)
    private val deleteDocumentUseCase = DeleteDocumentUseCase(repository)

    private val _uiState = MutableStateFlow(DocumentsUiState())
    val uiState: StateFlow<DocumentsUiState> = _uiState.asStateFlow()

    private val _snackbar = Channel<String>(Channel.BUFFERED)
    val snackbar = _snackbar.receiveAsFlow()

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            val docsDeferred = async { listDocumentsUseCase() }
            val deptsDeferred = async { listDepartmentsUseCase() }
            val userDeptsDeferred = async { repository.listUserDepartments() }

            val docsResult = docsDeferred.await()
            val deptsResult = deptsDeferred.await()
            val userDeptsResult = userDeptsDeferred.await()

            _uiState.update { state ->
                state.copy(
                    isLoading = false,
                    documents = docsResult.getOrElse { state.documents },
                    departments = deptsResult.getOrElse { state.departments },
                    userDepartments = userDeptsResult.getOrElse { state.userDepartments },
                    error = docsResult.exceptionOrNull()?.toUserMessage(),
                )
            }
        }
    }

    fun updateDocument(id: String, request: UpdateDocumentRequest) {
        viewModelScope.launch {
            _uiState.update { it.copy(operationInProgress = true) }
            updateDocumentUseCase(id, request)
                .onSuccess { updated ->
                    _uiState.update { state ->
                        state.copy(
                            operationInProgress = false,
                            documents = state.documents.map { if (it.id == id) updated else it }
                        )
                    }
                    _snackbar.send("Documento atualizado com sucesso.")
                }
                .onFailure { err ->
                    _uiState.update { it.copy(operationInProgress = false) }
                    _snackbar.send("Erro ao atualizar: ${err.toUserMessage()}")
                }
        }
    }

    fun deleteDocument(id: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(operationInProgress = true) }
            deleteDocumentUseCase(id)
                .onSuccess {
                    _uiState.update { state ->
                        state.copy(
                            operationInProgress = false,
                            documents = state.documents.filter { it.id != id }
                        )
                    }
                    _snackbar.send("Documento apagado com sucesso.")
                }
                .onFailure { err ->
                    _uiState.update { it.copy(operationInProgress = false) }
                    _snackbar.send("Erro ao apagar: ${err.toUserMessage()}")
                }
        }
    }

    fun refreshDocument(id: String) {
        viewModelScope.launch {
            repository.getDocument(id).onSuccess { updated ->
                _uiState.update { state ->
                    state.copy(documents = state.documents.map { if (it.id == id) updated else it })
                }
            }
        }
    }

    fun prepareChat(documentId: String) {
        _uiState.update { it.copy(chatMessages = emptyList(), chatMessagesSent = null, chatMessagesLimit = null) }
        viewModelScope.launch {
            val historyDeferred = async { repository.getDocumentChatHistory(documentId) }
            val usageDeferred = async { repository.getDocumentChatUsage(documentId) }

            historyDeferred.await().onSuccess { history ->
                val messages = history.map { msg ->
                    ChatMessage(
                        text = msg.content,
                        isFromUser = msg.role == "user",
                    )
                }
                _uiState.update { it.copy(chatMessages = messages) }
            }

            usageDeferred.await().onSuccess { usage ->
                _uiState.update { it.copy(
                    chatMessagesSent = usage.messagesSent,
                    chatMessagesLimit = usage.limit,
                ) }
            }
        }
    }

    fun sendChatMessage(documentId: String, message: String) {
        if (_uiState.value.isChatSending) return
        val sent = _uiState.value.chatMessagesSent
        val limit = _uiState.value.chatMessagesLimit
        if (sent != null && limit != null && sent >= limit) {
            viewModelScope.launch { _snackbar.send("Quota de perguntas esgotada.") }
            return
        }

        viewModelScope.launch {
            val userMsg = ChatMessage(text = message, isFromUser = true)
            _uiState.update { it.copy(chatMessages = it.chatMessages + userMsg, isChatSending = true) }

            repository.askQuestion(documentId, message)
                .onSuccess { response ->
                    val botMsg = ChatMessage(text = response.answer, isFromUser = false)
                    _uiState.update { it.copy(
                        chatMessages = it.chatMessages + botMsg,
                        isChatSending = false,
                        chatMessagesSent = response.messagesSent,
                        chatMessagesLimit = response.limit,
                    ) }
                }
                .onFailure { err ->
                    val isQuotaError = err is HttpException && err.code() == 403
                    _uiState.update { it.copy(
                        isChatSending = false,
                        chatMessagesSent = if (isQuotaError) (limit ?: _uiState.value.chatMessagesSent) else _uiState.value.chatMessagesSent,
                    ) }
                    _snackbar.send(if (isQuotaError) "Quota de perguntas esgotada." else "Erro ao enviar: ${err.toUserMessage()}")
                }
        }
    }
}
