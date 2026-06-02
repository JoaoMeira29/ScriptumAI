package pt.ipca.scriptumai.presentation.ui.auth

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import pt.ipca.scriptumai.R
import pt.ipca.scriptumai.data.model.auth.Plan
import pt.ipca.scriptumai.data.model.auth.availablePlans
import pt.ipca.scriptumai.ui.theme.LocalAppColors

@Composable
fun PricingScreen(
    onPlanSelected: (String) -> Unit,
    onBack: () -> Unit
) {
    val appColors = LocalAppColors.current
    val colorScheme = MaterialTheme.colorScheme

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = stringResource(R.string.pricing_title),
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            color = colorScheme.onBackground
        )

        Text(
            text = stringResource(R.string.pricing_subtitle),
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center,
            color = appColors.mutedForeground,
            modifier = Modifier.padding(vertical = 8.dp)
        )

        Spacer(modifier = Modifier.height(24.dp))

        availablePlans.forEach { plan ->
            PricingCard(
                plan = plan,
                onSelect = { onPlanSelected(plan.id) }
            )
            Spacer(modifier = Modifier.height(16.dp))
        }
        
        TextButton(onClick = onBack) {
            Text(stringResource(R.string.pricing_back_to_login), color = colorScheme.primary)
        }
        
        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
fun PricingCard(
    plan: Plan,
    onSelect: () -> Unit
) {
    val appColors = LocalAppColors.current
    val colorScheme = MaterialTheme.colorScheme
    
    // As cores da imagem sugerem tons de verde água/teal (que já tens no ScriptumPrimary)
    val isFreeTrial = plan.id == "free-trial"
    
    Box(modifier = Modifier.fillMaxWidth()) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = if (plan.isPopular) 12.dp else 0.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = colorScheme.surface
            ),
            border = BorderStroke(
                width = if (plan.isPopular) 2.dp else 1.dp,
                color = if (plan.isPopular) colorScheme.primary else appColors.mutedForeground.copy(alpha = 0.2f)
            )
        ) {
            Column(
                modifier = Modifier.padding(24.dp)
            ) {
                Text(
                    text = plan.name,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = colorScheme.onSurface
                )
                
                Text(
                    text = plan.price,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Black,
                    color = colorScheme.onSurface,
                    modifier = Modifier.padding(top = 8.dp)
                )
                
                Text(
                    text = plan.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = appColors.mutedForeground
                )

                HorizontalDivider(
                    modifier = Modifier.padding(vertical = 20.dp),
                    thickness = 0.5.dp,
                    color = appColors.mutedForeground.copy(alpha = 0.3f)
                )

                plan.features.forEach { feature ->
                    val isHighlighted = (isFreeTrial && (feature.contains("trial") || feature.contains("No payment")))
                    Text(
                        text = "• $feature",
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (isHighlighted) colorScheme.primary else colorScheme.onSurface,
                        modifier = Modifier.padding(vertical = 4.dp)
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = onSelect,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colorScheme.primary
                    )
                ) {
                    Text(
                        text = stringResource(R.string.pricing_learn_more),
                        fontWeight = FontWeight.Bold,
                        color = colorScheme.onPrimary
                    )
                }
            }
        }

        if (plan.isPopular) {
            Surface(
                modifier = Modifier.align(Alignment.TopCenter),
                color = colorScheme.primary,
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(
                    text = stringResource(R.string.pricing_most_popular),
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.labelSmall,
                    color = colorScheme.onPrimary,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
