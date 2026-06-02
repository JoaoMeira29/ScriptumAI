package pt.ipca.scriptumai.presentation.ui.home

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.Storage
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import pt.ipca.scriptumai.R
import pt.ipca.scriptumai.data.model.ChatMessage
import pt.ipca.scriptumai.data.model.document.DepartmentApiModel
import pt.ipca.scriptumai.data.model.document.DocumentApiModel
import pt.ipca.scriptumai.data.model.document.UpdateDocumentRequest
import pt.ipca.scriptumai.data.network.RetrofitClient

private fun resolvePublicUrl(url: String?): String? {
    if (url.isNullOrBlank()) return null
    val apiBase = Uri.parse(RetrofitClient.BASE_URL)
    val parsed = Uri.parse(url)
    return parsed.buildUpon()
        .scheme(apiBase.scheme)
        .encodedAuthority(apiBase.host + (apiBase.port.takeIf { it != -1 }?.let { ":$it" } ?: ""))
        .build()
        .toString()
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DocumentDetailScreen(
    document: DocumentApiModel,
    departmentName: String?,
    departments: List<DepartmentApiModel> = emptyList(),
    operationInProgress: Boolean = false,
    chatMessages: List<ChatMessage> = emptyList(),
    chatMessagesSent: Int? = null,
    chatMessagesLimit: Int? = null,
    isChatSending: Boolean = false,
    onBack: () -> Unit,
    onRefresh: (() -> Unit)? = null,
    onDelete: (() -> Unit)? = null,
    onEdit: ((UpdateDocumentRequest) -> Unit)? = null,
    onSendChatMessage: ((String) -> Unit)? = null,
) {
    val accent = MaterialTheme.colorScheme.primary
    val context = LocalContext.current
    var showDeleteDialog  by remember { mutableStateOf(false) }
    var showEditDialog    by remember { mutableStateOf(false) }
    var showDiscardDialog by remember { mutableStateOf(false) }

    var editName     by remember(document) { mutableStateOf(document.originalName) }
    var editDesc     by remember(document) { mutableStateOf(document.description ?: "") }
    var editDeptId   by remember(document) { mutableStateOf(document.departmentId) }
    var deptDropdown by remember { mutableStateOf(false) }

    val hasUnsavedChanges = editName != document.originalName ||
        editDesc != (document.description ?: "") ||
        editDeptId != document.departmentId

    if (showDiscardDialog) {
        AlertDialog(
            onDismissRequest = { showDiscardDialog = false },
            containerColor = MaterialTheme.colorScheme.surface,
            title = { Text(stringResource(R.string.doc_detail_unsaved_title), color = MaterialTheme.colorScheme.onSurface) },
            text = {
                Text(
                    stringResource(R.string.doc_detail_unsaved_body),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showDiscardDialog = false
                        showEditDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626))
                ) { Text(stringResource(R.string.doc_detail_discard), color = Color.White) }
            },
            dismissButton = {
                TextButton(onClick = { showDiscardDialog = false }) {
                    Text(stringResource(R.string.doc_detail_keep_editing), color = accent)
                }
            }
        )
    }

    if (showEditDialog) {
        val noDept = stringResource(R.string.documents_no_department)
        AlertDialog(
            onDismissRequest = {
                if (hasUnsavedChanges) showDiscardDialog = true else showEditDialog = false
            },
            containerColor = MaterialTheme.colorScheme.surface,
            title = { Text(stringResource(R.string.doc_detail_edit_title), color = MaterialTheme.colorScheme.onSurface) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = editName,
                        onValueChange = { editName = it },
                        label = { Text(stringResource(R.string.documents_field_name)) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = accent,
                            focusedLabelColor = accent,
                            cursorColor = accent,
                        )
                    )
                    OutlinedTextField(
                        value = editDesc,
                        onValueChange = { editDesc = it },
                        label = { Text(stringResource(R.string.documents_field_description)) },
                        minLines = 2,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = accent,
                            focusedLabelColor = accent,
                            cursorColor = accent,
                        )
                    )
                    if (departments.isNotEmpty()) {
                        val selectedDeptName = departments.find { it.id == editDeptId }?.name ?: noDept
                        ExposedDropdownMenuBox(
                            expanded = deptDropdown,
                            onExpandedChange = { deptDropdown = it },
                        ) {
                            OutlinedTextField(
                                value = selectedDeptName,
                                onValueChange = {},
                                label = { Text(stringResource(R.string.documents_field_department)) },
                                readOnly = true,
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = deptDropdown) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .menuAnchor(MenuAnchorType.PrimaryNotEditable),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = accent,
                                    unfocusedBorderColor = accent.copy(alpha = 0.5f),
                                    focusedLabelColor = accent,
                                    unfocusedLabelColor = accent.copy(alpha = 0.7f),
                                    focusedTrailingIconColor = accent,
                                    unfocusedTrailingIconColor = accent.copy(alpha = 0.7f),
                                )
                            )
                            ExposedDropdownMenu(
                                expanded = deptDropdown,
                                onDismissRequest = { deptDropdown = false },
                                containerColor = MaterialTheme.colorScheme.surface,
                            ) {
                                DropdownMenuItem(
                                    text = {
                                        Text(
                                            noDept,
                                            color = if (editDeptId == null) accent else MaterialTheme.colorScheme.onSurface
                                        )
                                    },
                                    onClick = { editDeptId = null; deptDropdown = false }
                                )
                                departments.forEach { dept ->
                                    DropdownMenuItem(
                                        text = {
                                            Text(
                                                dept.name,
                                                color = if (dept.id == editDeptId) accent else MaterialTheme.colorScheme.onSurface
                                            )
                                        },
                                        onClick = { editDeptId = dept.id; deptDropdown = false }
                                    )
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showEditDialog = false
                        onEdit?.invoke(
                            UpdateDocumentRequest(
                                originalName = editName.trim().ifBlank { null },
                                description  = editDesc.trim().ifBlank { null },
                                departmentId = editDeptId,
                            )
                        )
                    },
                    enabled = !operationInProgress,
                    colors = ButtonDefaults.buttonColors(containerColor = accent)
                ) {
                    if (operationInProgress) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                    } else {
                        Text(stringResource(R.string.save), color = Color.White)
                    }
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        if (hasUnsavedChanges) showDiscardDialog = true else showEditDialog = false
                    },
                    enabled = !operationInProgress
                ) {
                    Text(stringResource(R.string.cancel), color = accent)
                }
            }
        )
    }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = {
                Text(
                    stringResource(R.string.doc_detail_delete_title),
                    color = MaterialTheme.colorScheme.onSurface
                )
            },
            text = {
                Text(
                    stringResource(R.string.doc_detail_delete_confirm, document.originalName),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            },
            containerColor = MaterialTheme.colorScheme.surface,
            confirmButton = {
                Button(
                    onClick = {
                        showDeleteDialog = false
                        onDelete?.invoke()
                        onBack()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = accent)
                ) { Text(stringResource(R.string.delete), color = Color.White) }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text(stringResource(R.string.cancel), color = accent)
                }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = document.originalName,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = stringResource(R.string.back))
                    }
                },
                actions = {
                    val isPending = document.aiStatus?.uppercase().let { it == "PENDING" || it == "PROCESSING" || it == null }
                    if (onRefresh != null && isPending) {
                        IconButton(onClick = onRefresh) {
                            Icon(
                                imageVector = Icons.Default.Refresh,
                                contentDescription = stringResource(R.string.doc_detail_refresh_ai),
                                tint = accent
                            )
                        }
                    }
                    if (onEdit != null) {
                        IconButton(onClick = { showEditDialog = true }) {
                            Icon(
                                imageVector = Icons.Default.Edit,
                                contentDescription = stringResource(R.string.edit),
                                tint = accent
                            )
                        }
                    }
                    if (onDelete != null) {
                        IconButton(onClick = { showDeleteDialog = true }) {
                            Icon(
                                imageVector = Icons.Default.Delete,
                                contentDescription = stringResource(R.string.delete),
                                tint = Color(0xFFDC2626).copy(alpha = 0.75f)
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                    navigationIconContentColor = MaterialTheme.colorScheme.onSurface,
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .imePadding(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item { HeroSection(document = document, departmentName = departmentName) }
            item {
                AiSummarySection(
                    aiStatus = document.aiStatus,
                    aiSummary = document.aiSummary,
                    aiKeywords = document.aiKeywords,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            }
            item {
                MetadataSection(
                    document = document,
                    departmentName = departmentName,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            }
            if (document.aiStatus?.uppercase() == "COMPLETED" && onSendChatMessage != null) {
                item {
                    ChatSection(
                        chatMessages = chatMessages,
                        messagesSent = chatMessagesSent,
                        messagesLimit = chatMessagesLimit,
                        isSending = isChatSending,
                        onSend = onSendChatMessage,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                }
            }

            
            item {
                val viewUrl = remember(document.downloadUrl) { resolvePublicUrl(document.downloadUrl) }

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = {
                            viewUrl?.let { url ->
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                                context.startActivity(intent)
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = viewUrl != null,
                        shape = RoundedCornerShape(24.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = accent)
                    ) {
                        Icon(Icons.Default.Visibility, contentDescription = null, modifier = Modifier.size(20.dp), tint = Color.White)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(stringResource(R.string.doc_detail_view), color = Color.White)
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedButton(
                            onClick = {
                                viewUrl?.let { url ->
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                    }
                                    context.startActivity(intent)
                                }
                            },
                            modifier = Modifier.weight(1f),
                            enabled = viewUrl != null,
                            shape = RoundedCornerShape(24.dp),
                            border = BorderStroke(1.dp, accent),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = accent)
                        ) {
                            Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(stringResource(R.string.doc_detail_download))
                        }

                        OutlinedButton(
                            onClick = {
                                viewUrl?.let { url ->
                                    val intent = Intent(Intent.ACTION_SEND).apply {
                                        type = "text/plain"
                                        putExtra(Intent.EXTRA_SUBJECT, document.originalName)
                                        putExtra(Intent.EXTRA_TEXT, url)
                                    }
                                    context.startActivity(Intent.createChooser(intent, null))
                                }
                            },
                            modifier = Modifier.weight(1f),
                            enabled = !document.downloadUrl.isNullOrBlank(),
                            shape = RoundedCornerShape(24.dp),
                            border = BorderStroke(1.dp, accent),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = accent)
                        ) {
                            Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(stringResource(R.string.doc_detail_share))
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(80.dp)) }
        }
    }
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

@Composable
private fun HeroSection(document: DocumentApiModel, departmentName: String?) {
    val accent = MaterialTheme.colorScheme.primary
    val fileType = mimeToFileType(document.mimeType)
    val aiColor = aiStatusColor(document.aiStatus)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                Brush.verticalGradient(
                    colors = listOf(accent.copy(alpha = 0.18f), accent.copy(alpha = 0.04f))
                )
            )
            .padding(horizontal = 24.dp, vertical = 28.dp)
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(accent.copy(alpha = 0.14f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Description,
                    contentDescription = null,
                    tint = accent,
                    modifier = Modifier.size(44.dp)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            DetailBadge(label = fileType, color = accent)

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = document.originalName,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                DetailBadge(label = "AI: ${document.aiStatus ?: "Pending"}", color = aiColor)
                if (departmentName != null) {
                    DetailBadge(label = departmentName, color = accent)
                }
            }
        }
    }
}

@Composable
private fun DetailBadge(label: String, color: Color) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(50.dp))
            .background(color.copy(alpha = 0.12f))
            .padding(horizontal = 12.dp, vertical = 5.dp)
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.SemiBold,
            color = color,
            fontSize = 11.sp
        )
    }
}

// ─── AI Summary ───────────────────────────────────────────────────────────────

@Composable
private fun AiSummarySection(
    aiStatus: String?,
    aiSummary: String?,
    aiKeywords: List<String>?,
    modifier: Modifier = Modifier,
) {
    val accent = MaterialTheme.colorScheme.primary
    var expanded by remember { mutableStateOf(false) }

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(accent.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.AutoAwesome,
                        contentDescription = null,
                        tint = accent,
                        modifier = Modifier.size(17.dp)
                    )
                }
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = stringResource(R.string.doc_detail_ai_summary),
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }

            when {
                aiStatus == null || aiStatus.uppercase() == "PENDING" -> {
                    Text(
                        text = stringResource(R.string.doc_detail_ai_queued),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                aiStatus.uppercase() == "PROCESSING" -> {
                    Text(
                        text = stringResource(R.string.doc_detail_ai_processing),
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFFD97706)
                    )
                }
                aiStatus.uppercase() == "ERROR" || aiStatus.uppercase() == "FAILED" -> {
                    Text(
                        text = stringResource(R.string.doc_detail_ai_failed),
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFFDC2626)
                    )
                }
                !aiSummary.isNullOrBlank() -> {
                    Text(
                        text = aiSummary,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        lineHeight = 22.sp,
                        maxLines = if (expanded) Int.MAX_VALUE else 3,
                        overflow = if (expanded) TextOverflow.Visible else TextOverflow.Ellipsis
                    )
                    Text(
                        text = if (expanded) stringResource(R.string.doc_detail_show_less) else stringResource(R.string.doc_detail_read_more),
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = accent,
                        modifier = Modifier
                            .align(Alignment.End)
                            .clip(RoundedCornerShape(4.dp))
                            .clickable { expanded = !expanded }
                            .padding(horizontal = 4.dp, vertical = 2.dp)
                    )
                }
                else -> {
                    Text(
                        text = stringResource(R.string.doc_detail_no_summary),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            if (!aiKeywords.isNullOrEmpty()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    aiKeywords.take(5).forEach { kw ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(accent.copy(alpha = 0.08f))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = kw,
                                style = MaterialTheme.typography.labelSmall,
                                color = accent,
                                fontSize = 10.sp
                            )
                        }
                    }
                }
            }
        }
    }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

@Composable
private fun MetadataSection(
    document: DocumentApiModel,
    departmentName: String?,
    modifier: Modifier = Modifier,
) {
    val accent = MaterialTheme.colorScheme.primary

    val fileTypeLabel   = stringResource(R.string.doc_detail_file_type)
    val fileSizeLabel   = stringResource(R.string.doc_detail_file_size)
    val uploadedLabel   = stringResource(R.string.doc_detail_uploaded)
    val uploadedByLabel = stringResource(R.string.doc_detail_uploaded_by)
    val departmentLabel = stringResource(R.string.doc_detail_department)
    val descriptionLabel = stringResource(R.string.doc_detail_description)

    val items = buildList {
        add(Triple(Icons.Default.Description,   fileTypeLabel,   mimeToFileType(document.mimeType)))
        add(Triple(Icons.Default.Storage,       fileSizeLabel,   formatFileSize(document.size)))
        add(Triple(Icons.Default.CalendarToday, uploadedLabel,   formatDate(document.createdAt)))
        add(Triple(Icons.Default.Person,        uploadedByLabel, document.uploadedByName))
        if (departmentName != null) {
            add(Triple(Icons.Default.Business,  departmentLabel, departmentName))
        }
    }

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(accent.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.FolderOpen,
                        contentDescription = null,
                        tint = accent,
                        modifier = Modifier.size(17.dp)
                    )
                }
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = stringResource(R.string.doc_detail_metadata),
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            items.forEachIndexed { index, (icon, label, value) ->
                MetadataRow(icon = icon, label = label, value = value, accent = accent)
                if (index < items.lastIndex || !document.description.isNullOrBlank()) {
                    HorizontalDivider(
                        modifier = Modifier.padding(vertical = 10.dp),
                        color = MaterialTheme.colorScheme.outline.copy(alpha = 0.18f)
                    )
                }
            }

            if (!document.description.isNullOrBlank()) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = descriptionLabel,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = document.description,
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }
    }
}

// ─── Chatbot ──────────────────────────────────────────────────────────────────

@Composable
private fun ChatSection(
    chatMessages: List<ChatMessage>,
    messagesSent: Int?,
    messagesLimit: Int?,
    isSending: Boolean,
    onSend: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val accent = MaterialTheme.colorScheme.primary
    var input by remember { mutableStateOf("") }
    val quotaExhausted = messagesSent != null && messagesLimit != null && messagesSent >= messagesLimit

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(accent.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = null,
                            tint = accent,
                            modifier = Modifier.size(17.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = stringResource(R.string.doc_detail_chatbot),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                if (messagesSent != null && messagesLimit != null) {
                    val remaining = maxOf(0, messagesLimit - messagesSent)
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(50.dp))
                            .background(
                                (if (quotaExhausted) Color(0xFFDC2626) else accent).copy(alpha = 0.12f)
                            )
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = stringResource(R.string.doc_detail_questions_remaining, remaining),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = if (quotaExhausted) Color(0xFFDC2626) else accent,
                            fontSize = 11.sp
                        )
                    }
                }
            }

            if (chatMessages.isEmpty() && !quotaExhausted) {
                Text(
                    text = stringResource(R.string.doc_detail_chat_hint),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            chatMessages.forEach { msg -> ChatBubble(msg, accent) }

            if (isSending) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = accent)
                        Text(
                            text = stringResource(R.string.doc_detail_ai_thinking),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Text(
                        text = stringResource(R.string.doc_detail_ai_slow),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                    )
                }
            }

            if (quotaExhausted) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFFDC2626).copy(alpha = 0.08f))
                        .padding(12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = stringResource(R.string.doc_detail_quota_exhausted),
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Medium,
                        color = Color(0xFFDC2626)
                    )
                }
            } else {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = input,
                        onValueChange = { input = it },
                        placeholder = { Text(stringResource(R.string.doc_detail_chat_input_hint), style = MaterialTheme.typography.bodySmall) },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        shape = RoundedCornerShape(24.dp),
                        enabled = !isSending,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                        keyboardActions = KeyboardActions(onSend = {
                            val q = input.trim()
                            if (q.isNotBlank()) { onSend(q); input = "" }
                        }),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = accent,
                            unfocusedBorderColor = accent.copy(alpha = 0.4f),
                            cursorColor = accent,
                        )
                    )
                    IconButton(
                        onClick = {
                            val q = input.trim()
                            if (q.isNotBlank()) { onSend(q); input = "" }
                        },
                        enabled = input.isNotBlank() && !isSending
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.Send,
                            contentDescription = stringResource(R.string.doc_detail_send),
                            tint = if (input.isNotBlank() && !isSending) accent else accent.copy(alpha = 0.3f)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ChatBubble(message: ChatMessage, accent: Color) {
    val isUser = message.isFromUser
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
    ) {
        Box(
            modifier = Modifier
                .widthIn(max = 280.dp)
                .clip(
                    RoundedCornerShape(
                        topStart = 16.dp,
                        topEnd = 16.dp,
                        bottomStart = if (isUser) 16.dp else 4.dp,
                        bottomEnd = if (isUser) 4.dp else 16.dp,
                    )
                )
                .background(if (isUser) accent else MaterialTheme.colorScheme.surfaceVariant)
                .padding(horizontal = 14.dp, vertical = 10.dp)
        ) {
            Text(
                text = message.text,
                style = MaterialTheme.typography.bodySmall,
                color = if (isUser) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                lineHeight = 20.sp
            )
        }
    }
}

// ─── Metadata row ─────────────────────────────────────────────────────────────

@Composable
private fun MetadataRow(icon: ImageVector, label: String, value: String, accent: Color) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = accent.copy(alpha = 0.8f),
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(10.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}
