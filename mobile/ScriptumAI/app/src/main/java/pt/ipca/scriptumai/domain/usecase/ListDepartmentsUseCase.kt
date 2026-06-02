package pt.ipca.scriptumai.domain.usecase

import pt.ipca.scriptumai.data.model.document.DepartmentApiModel
import pt.ipca.scriptumai.data.repository.DocumentRepository

class ListDepartmentsUseCase(private val repository: DocumentRepository = DocumentRepository()) {
    suspend operator fun invoke(): Result<List<DepartmentApiModel>> {
        return repository.listDepartments()
    }
}
