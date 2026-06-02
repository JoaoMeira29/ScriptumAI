package pt.ipca.scriptumai.data.model.auth

data class Plan(
    val id: String,
    val name: String,
    val price: String,
    val description: String,
    val features: List<String>,
    val isPopular: Boolean = false,
    val trialDays: Int? = null
)

val availablePlans = listOf(
    Plan(
        id = "free-trial",
        name = "Free Trial",
        price = "Free for 15 days",
        description = "for new organizations",
        features = listOf("500 GB storage", "Data extraction", "Automatic summaries", "15-day trial included", "No payment required to start"),
        trialDays = 15
    ),
    Plan(
        id = "starter",
        name = "Starter",
        price = "€49/month",
        description = "up to 10 users",
        features = listOf("1 TB storage", "Data extraction", "Automatic summaries", "No trial included", "Payment required to activate")
    ),
    Plan(
        id = "business",
        name = "Business",
        price = "€99/month",
        description = "up to 30 users",
        features = listOf("3 TB storage", "Data extraction", "Automatic summaries", "No trial included", "Payment required to activate"),
        isPopular = true
    ),
    Plan(
        id = "enterprise",
        name = "Enterprise",
        price = "Custom",
        description = "unlimited users",
        features = listOf("Unlimited storage", "Data extraction", "Automatic summaries", "No trial included", "Payment required to activate")
    )
)
