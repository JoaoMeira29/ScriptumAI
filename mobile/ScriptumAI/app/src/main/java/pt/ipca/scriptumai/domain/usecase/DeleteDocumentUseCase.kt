package pt.ipca.scriptumai.domain.usecase

import pt.ipca.scriptumai.data.repository.DocumentRepository

class DeleteDocumentUseCase(private val repository: DocumentRepository = DocumentRepository()) {
    suspend operator fun invoke(id: String): Result<Unit> {
        return repository.deleteDocument(id)
    }
}
