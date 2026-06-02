package pt.ipca.scriptumai.domain.usecase

import pt.ipca.scriptumai.data.model.auth.GenericResponse
import pt.ipca.scriptumai.data.repository.AuthRepository

class ForgotPasswordUseCase(private val repository: AuthRepository = AuthRepository()) {
    suspend operator fun invoke(email: String): Result<GenericResponse> {
        return repository.forgotPassword(email)
    }
}
