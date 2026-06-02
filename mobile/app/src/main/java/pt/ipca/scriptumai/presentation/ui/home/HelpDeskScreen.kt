package pt.ipca.scriptumai.presentation.ui.home

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import pt.ipca.scriptumai.R

private data class FaqItem(val question: String, val answer: String)

@Composable
fun HelpDeskScreen(
    onNavigateToHome: () -> Unit = {},
    onNavigateToContact: () -> Unit = {},
) {
    val accent = MaterialTheme.colorScheme.primary

    val faqs = listOf(
        FaqItem(stringResource(R.string.helpdesk_faq_q1), stringResource(R.string.helpdesk_faq_a1)),
        FaqItem(stringResource(R.string.helpdesk_faq_q2), stringResource(R.string.helpdesk_faq_a2)),
        FaqItem(stringResource(R.string.helpdesk_faq_q3), stringResource(R.string.helpdesk_faq_a3)),
        FaqItem(stringResource(R.string.helpdesk_faq_q4), stringResource(R.string.helpdesk_faq_a4)),
        FaqItem(stringResource(R.string.helpdesk_faq_q5), stringResource(R.string.helpdesk_faq_a5)),
        FaqItem(stringResource(R.string.helpdesk_faq_q6), stringResource(R.string.helpdesk_faq_a6)),
        FaqItem(stringResource(R.string.helpdesk_faq_q7), stringResource(R.string.helpdesk_faq_a7)),
        FaqItem(stringResource(R.string.helpdesk_faq_q8), stringResource(R.string.helpdesk_faq_a8)),
    )

    var searchQuery by remember { mutableStateOf("") }

    val filteredFaqs = remember(searchQuery, faqs) {
        if (searchQuery.isBlank()) faqs
        else faqs.filter {
            it.question.contains(searchQuery, ignoreCase = true) ||
                it.answer.contains(searchQuery, ignoreCase = true)
        }
    }

    Scaffold(
        bottomBar = {
            SupportBottomNav(
                currentRoute = "helpdesk",
                onHome = onNavigateToHome,
                onContact = onNavigateToContact,
                onHelpDesk = {},
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // ── Hero section ──────────────────────────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            listOf(accent.copy(alpha = 0.7f), accent)
                        )
                    )
                    .padding(horizontal = 24.dp, vertical = 40.dp),
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .clip(RoundedCornerShape(20.dp))
                            .background(Color.White.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            Icons.Default.HelpOutline,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(36.dp),
                        )
                    }
                    Spacer(Modifier.height(16.dp))
                    Text(
                        text = stringResource(R.string.helpdesk_hero_title),
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = stringResource(R.string.helpdesk_hero_subtitle),
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.85f),
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    )
                    Spacer(Modifier.height(24.dp))

                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text(stringResource(R.string.helpdesk_search_hint), color = Color.White.copy(alpha = 0.7f)) },
                        leadingIcon = {
                            Icon(Icons.Default.Search, contentDescription = null, tint = Color.White.copy(alpha = 0.8f))
                        },
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color.White,
                            unfocusedBorderColor = Color.White.copy(alpha = 0.5f),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            cursorColor = Color.White,
                        ),
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }

            Spacer(Modifier.height(24.dp))

            // ── FAQ section ───────────────────────────────────────────────────
            Column(modifier = Modifier.padding(horizontal = 20.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = stringResource(R.string.helpdesk_faq_title),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                    )
                    if (searchQuery.isNotBlank()) {
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = "(${filteredFaqs.size})",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }

                Spacer(Modifier.height(14.dp))

                if (filteredFaqs.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 32.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                Icons.Default.Search,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(40.dp),
                            )
                            Spacer(Modifier.height(12.dp))
                            Text(
                                stringResource(R.string.helpdesk_no_results, searchQuery),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                } else {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        filteredFaqs.forEachIndexed { index, faq ->
                            FaqAccordionItem(faq = faq, accent = accent)
                            if (index < filteredFaqs.lastIndex) {
                                HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
                            }
                        }
                    }
                }

                Spacer(Modifier.height(24.dp))

                // ── Still need help prompt ────────────────────────────────────
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = accent.copy(alpha = 0.08f)),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Text(
                            text = stringResource(R.string.helpdesk_still_need_help),
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = accent,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                            modifier = Modifier.fillMaxWidth(),
                        )
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = stringResource(R.string.helpdesk_support_ready),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        )
                        Spacer(Modifier.height(14.dp))
                        Button(
                            onClick = onNavigateToContact,
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = accent),
                        ) {
                            Text(stringResource(R.string.helpdesk_contact_us), fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                Spacer(Modifier.height(24.dp))
            }
        }
    }
}

@Composable
private fun FaqAccordionItem(faq: FaqItem, accent: Color) {
    var expanded by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = { expanded = !expanded },
            ),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = faq.question,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = if (expanded) FontWeight.SemiBold else FontWeight.Normal,
                color = if (expanded) accent else MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.weight(1f),
            )
            Spacer(Modifier.width(8.dp))
            Icon(
                imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                contentDescription = null,
                tint = if (expanded) accent else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(20.dp),
            )
        }
        AnimatedVisibility(
            visible = expanded,
            enter = expandVertically(),
            exit = shrinkVertically(),
        ) {
            Text(
                text = faq.answer,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                lineHeight = 20.sp,
                modifier = Modifier.padding(start = 16.dp, end = 16.dp, bottom = 16.dp),
            )
        }
    }
}
