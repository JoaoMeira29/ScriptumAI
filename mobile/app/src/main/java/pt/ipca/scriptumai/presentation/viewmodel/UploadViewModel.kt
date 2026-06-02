package pt.ipca.scriptumai.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pt.ipca.scriptumai.data.model.document.DocumentApiModel
import pt.ipca.scriptumai.data.repository.DocumentRepository
import java.io.File

sealed interface UploadState {
    data object Idle : UploadState
    data object Uploading : UploadState
    data class Polling(val document: DocumentApiModel) : UploadState
    data class Completed(val document: DocumentApiModel) : UploadState
    data class Error(val message: String) : UploadState
}

class UploadViewModel : ViewModel() {

    private val repository = DocumentRepository()

    private val _state = MutableStateFlow<UploadState>(UploadState.Idle)
    val state: StateFlow<UploadState> = _state.asStateFlow()

    fun upload(file: File, description: String?, departmentId: String? = null, name: String? = null) {
        viewModelScope.launch {
            _state.value = UploadState.Uploading
            repository.uploadDocument(file, description, departmentId, name)
                .onSuccess { doc ->
                    _state.value = UploadState.Polling(doc)
                    pollUntilDone(doc.id)
                }
                .onFailure { e ->
                    _state.value = UploadState.Error(e.message ?: "Upload falhou")
                }
        }
    }

    private suspend fun pollUntilDone(documentId: String) {
        while (true) {
            delay(5_000)
            repository.getDocument(documentId)
                .onSuccess { doc ->
                    when (doc.aiStatus?.uppercase()) {
                        "COMPLETED", "ERROR" -> {
                            _state.value = UploadState.Completed(doc)
                            return
                        }
                        else -> _state.value = UploadState.Polling(doc)
                    }
                }
        }
    }

    fun reset() {
        _state.value = UploadState.Idle
    }
}