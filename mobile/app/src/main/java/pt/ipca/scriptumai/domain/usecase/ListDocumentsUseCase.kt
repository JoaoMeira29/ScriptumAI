package pt.ipca.scriptumai.domain.usecase

import pt.ipca.scriptumai.data.model.document.DocumentApiModel
import pt.ipca.scriptumai.data.repository.DocumentRepository

class ListDocumentsUseCase(private val repository: DocumentRepository = DocumentRepository()) {
    suspend operator fun invoke(): Result<List<DocumentApiModel>> {
        return repository.listDocuments()
    }
}
