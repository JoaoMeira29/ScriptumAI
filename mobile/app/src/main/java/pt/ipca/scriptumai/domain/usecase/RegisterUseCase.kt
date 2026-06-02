package pt.ipca.scriptumai.domain.usecase

import pt.ipca.scriptumai.data.model.auth.AuthData
import pt.ipca.scriptumai.data.model.auth.RegisterRequest
import pt.ipca.scriptumai.data.repository.AuthRepository

class RegisterUseCase(private val repository: AuthRepository = AuthRepository()) {
    suspend operator fun invoke(request: RegisterRequest): Result<AuthData> {
        return repository.register(request)
    }
}
