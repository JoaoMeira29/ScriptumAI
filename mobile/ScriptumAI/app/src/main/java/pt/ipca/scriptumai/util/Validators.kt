package pt.ipca.scriptumai.util

object Validators {

    /** Requirements:
      - Minimum 8 characters
      - 1 uppercase letter
      - 1 lowercase letter
     - 1 number
     - 1 special character */
    fun isPasswordValid(password: String): Boolean {
        val hasMinLength = password.length >= 8
        val hasUpperCase = password.any { it.isUpperCase() }
        val hasLowerCase = password.any { it.isLowerCase() }
        val hasDigit = password.any { it.isDigit() }
        val hasSpecialChar = password.any { !it.isLetterOrDigit() }
        
        return hasMinLength && hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar
    }

    fun getPasswordRequirements(password: String): List<RequirementStatus> {
        return listOf(
            RequirementStatus("Minimum 8 characters", password.length >= 8),
            RequirementStatus("One uppercase letter", password.any { it.isUpperCase() }),
            RequirementStatus("One lowercase letter", password.any { it.isLowerCase() }),
            RequirementStatus("One number", password.any { it.isDigit() }),
            RequirementStatus("One special character (@, #, !, etc.)", password.any { !it.isLetterOrDigit() })
        )
    }
}

data class RequirementStatus(val text: String, val isMet: Boolean)
