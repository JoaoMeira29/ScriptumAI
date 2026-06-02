package pt.ipca.scriptumai.domain.usecase

import pt.ipca.scriptumai.data.model.document.DocumentApiModel
import pt.ipca.scriptumai.data.model.document.UpdateDocumentRequest
import pt.ipca.scriptumai.data.repository.DocumentRepository

class UpdateDocumentUseCase(private val repository: DocumentRepository = DocumentRepository()) {
    suspend operator fun invoke(id: String, request: UpdateDocumentRequest): Result<DocumentApiModel> {
        return repository.updateDocument(id, request)
    }
}
