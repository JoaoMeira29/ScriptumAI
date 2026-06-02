package pt.ipca.scriptumai.domain.usecase

import pt.ipca.scriptumai.data.model.auth.AuthData
import pt.ipca.scriptumai.data.repository.AuthRepository

class LoginUseCase(private val repository: AuthRepository = AuthRepository()) {
    suspend operator fun invoke(email: String, password: String): Result<AuthData> {
        return repository.login(email, password)
    }
}
