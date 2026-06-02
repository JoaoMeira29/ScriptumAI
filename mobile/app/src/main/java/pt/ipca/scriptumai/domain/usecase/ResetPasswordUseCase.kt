package pt.ipca.scriptumai.domain.usecase

import pt.ipca.scriptumai.data.model.auth.GenericResponse
import pt.ipca.scriptumai.data.model.auth.ResetPasswordRequest
import pt.ipca.scriptumai.data.repository.AuthRepository

class ResetPasswordUseCase(private val repository: AuthRepository = AuthRepository()) {
    suspend operator fun invoke(request: ResetPasswordRequest): Result<GenericResponse> {
        return repository.resetPassword(request)
    }
}
