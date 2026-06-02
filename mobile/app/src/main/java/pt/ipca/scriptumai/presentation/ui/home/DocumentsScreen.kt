package pt.ipca.scriptumai.presentation.ui.home

import androidx.annotation.StringRes
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Sort
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.PullToRefreshDefaults
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import pt.ipca.scriptumai.data.model.document.UpdateDocumentRequest
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import pt.ipca.scriptumai.R
import pt.ipca.scriptumai.data.model.document.DepartmentApiModel
import pt.ipca.scriptumai.data.model.document.DocumentApiModel
import pt.ipca.scriptumai.presentation.viewmodel.DocumentsViewModel
import java.util.Locale

// ─── Sort options ─────────────────────────────────────────────────────────────

enum class SortOption(@StringRes val labelRes: Int) {
    DATE_DESC(R.string.documents_sort_newest),
    DATE_ASC(R.string.documents_sort_oldest),
    NAME_ASC(R.string.documents_sort_name_az),
    NAME_DESC(R.string.documents_sort_name_za),
    SIZE_DESC(R.string.documents_sort_largest),
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

fun mimeToFileType(mime: String): String = when {
    "pdf" in mime                              -> "PDF"
    "word" in mime || "docx" in mime           -> "DOCX"
    "excel" in mime || "spreadsheet" in mime   -> "XLSX"
    "png" in mime                              -> "PNG"
    "jpeg" in mime || "jpg" in mime            -> "JPG"
    "text/plain" in mime                       -> "TXT"
    else -> mime.substringAfterLast("/").uppercase().take(6)
}

fun formatFileSize(bytes: Long): String = when {
    bytes < 1024L              -> "$bytes B"
    bytes < 1024L * 1024       -> "${bytes / 1024} KB"
    else                       -> String.format(Locale.US, "%.1f MB", bytes / (1024.0 * 1024))
}

fun formatDate(isoDate: String): String = try { isoDate.substring(0, 10) } catch (_: Exception) { isoDate }

fun aiStatusColor(status: String?): Color = when (status?.uppercase()) {
    "COMPLETED", "DONE"  -> Color(0xFF10B981)
    "PROCESSING"         -> Color(0xFFD97706)
    "ERROR", "FAILED"    -> Color(0xFFDC2626)
    else                 -> Color(0xFF6B7280)
}

@Composable
fun aiStatusLabel(status: String?): String = when (status?.uppercase()) {
    "COMPLETED", "DONE" -> stringResource(R.string.documents_status_completed)
    "PROCESSING"        -> stringResource(R.string.documents_status_processing)
    "ERROR", "FAILED"   -> stringResource(R.string.documents_status_error)
    else                -> stringResource(R.string.documents_status_pending)
}

// ─── Documents screen ─────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DocumentsScreen(
    onDocumentClick: (DocumentApiModel, String?) -> Unit = { _, _ -> },
    viewModel: DocumentsViewModel = viewModel(),
) {
    val accent = MaterialTheme.colorScheme.primary
    val uiState by viewModel.uiState.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var selectedDeptId by remember { mutableStateOf<String?>(null) }
    var selectedSort by remember { mutableStateOf(SortOption.DATE_DESC) }
    val listState = rememberLazyListState()

    LaunchedEffect(searchQuery, selectedDeptId, selectedSort) {
        listState.scrollToItem(0)
    }

    val deptMap = remember(uiState.departments) {
        uiState.departments.associate { it.id to it.name }
    }

    var documentToDelete by remember { mutableStateOf<DocumentApiModel?>(null) }
    var documentToEdit   by remember { mutableStateOf<DocumentApiModel?>(null) }

    var editName     by remember { mutableStateOf("") }
    var editDesc     by remember { mutableStateOf("") }
    var editDeptId   by remember { mutableStateOf<String?>(null) }
    var deptDropdown by remember { mutableStateOf(false) }

    if (documentToEdit != null) {
        val noDept = stringResource(R.string.documents_no_department)
        AlertDialog(
            onDismissRequest = { documentToEdit = null },
            containerColor = MaterialTheme.colorScheme.surface,
            title = { Text(stringResource(R.string.documents_edit_dialog_title), color = MaterialTheme.colorScheme.onSurface) },
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
                    if (uiState.userDepartments.isNotEmpty()) {
                        val selectedDeptName = uiState.userDepartments.find { it.id == editDeptId }?.name ?: noDept
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
                                uiState.userDepartments.forEach { dept ->
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
                        val doc = documentToEdit!!
                        documentToEdit = null
                        viewModel.updateDocument(
                            doc.id,
                            UpdateDocumentRequest(
                                originalName = editName.trim().ifBlank { null },
                                description  = editDesc.trim().ifBlank { null },
                                departmentId = editDeptId,
                            )
                        )
                    },
                    enabled = !uiState.operationInProgress,
                    colors = ButtonDefaults.buttonColors(containerColor = accent)
                ) {
                    if (uiState.operationInProgress) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                    } else {
                        Text(stringResource(R.string.save), color = Color.White)
                    }
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { documentToEdit = null },
                    enabled = !uiState.operationInProgress
                ) {
                    Text(stringResource(R.string.cancel), color = accent)
                }
            }
        )
    }

    if (documentToDelete != null) {
        AlertDialog(
            onDismissRequest = { documentToDelete = null },
            title = {
                Text(
                    stringResource(R.string.documents_delete_dialog_title),
                    color = MaterialTheme.colorScheme.onSurface
                )
            },
            text = {
                Text(
                    stringResource(R.string.documents_delete_confirm, documentToDelete!!.originalName),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            },
            containerColor = MaterialTheme.colorScheme.surface,
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.deleteDocument(documentToDelete!!.id)
                        documentToDelete = null
                    },
                    enabled = !uiState.operationInProgress,
                    colors = ButtonDefaults.buttonColors(containerColor = accent)
                ) {
                    if (uiState.operationInProgress) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                    } else {
                        Text(stringResource(R.string.delete), color = Color.White)
                    }
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { documentToDelete = null },
                    enabled = !uiState.operationInProgress
                ) {
                    Text(stringResource(R.string.cancel), color = accent)
                }
            }
        )
    }

    val filtered = remember(searchQuery, selectedDeptId, selectedSort, uiState.documents) {
        uiState.documents
            .filter { doc ->
                (selectedDeptId == null || doc.departmentId == selectedDeptId) &&
                    (searchQuery.isBlank() || doc.originalName.contains(searchQuery, ignoreCase = true))
            }
            .sortedWith(
                when (selectedSort) {
                    SortOption.DATE_DESC -> compareByDescending { it.createdAt }
                    SortOption.DATE_ASC  -> compareBy { it.createdAt }
                    SortOption.NAME_ASC  -> compareBy { it.originalName.lowercase() }
                    SortOption.NAME_DESC -> compareByDescending { it.originalName.lowercase() }
                    SortOption.SIZE_DESC -> compareByDescending { it.size }
                }
            )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Spacer(modifier = Modifier.height(12.dp))

        SearchBar(
            query = searchQuery,
            onQueryChange = { searchQuery = it },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
        )

        Spacer(modifier = Modifier.height(12.dp))

        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item {
                FilterChip(
                    label = stringResource(R.string.documents_filter_all),
                    selected = selectedDeptId == null,
                    onClick = { selectedDeptId = null }
                )
            }
            items(uiState.userDepartments, key = { it.id }) { dept ->
                FilterChip(
                    label = dept.name,
                    selected = selectedDeptId == dept.id,
                    onClick = { selectedDeptId = dept.id }
                )
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        val countLabel = if (filtered.size == 1)
            "${filtered.size} ${stringResource(R.string.documents_count_singular)}"
        else
            "${filtered.size} ${stringResource(R.string.documents_count_plural)}"

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = stringResource(R.string.documents_filter_recent),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = countLabel,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                SortMenuButton(selected = selectedSort, onSelect = { selectedSort = it })
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        val pullState = rememberPullToRefreshState()
        val isRefreshing = uiState.isLoading && uiState.documents.isNotEmpty()
        PullToRefreshBox(
            isRefreshing = isRefreshing,
            onRefresh = { viewModel.loadData() },
            state = pullState,
            modifier = Modifier.weight(1f).fillMaxWidth(),
            indicator = {
                PullToRefreshDefaults.Indicator(
                    state = pullState,
                    isRefreshing = isRefreshing,
                    color = accent,
                    containerColor = MaterialTheme.colorScheme.surface,
                    modifier = Modifier.align(Alignment.TopCenter),
                )
            }
        ) {
            when {
                uiState.documents.isEmpty() && uiState.isLoading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = accent)
                    }
                }
                uiState.error != null && uiState.documents.isEmpty() -> {
                    ErrorState(
                        message = uiState.error!!,
                        onRetry = { viewModel.loadData() }
                    )
                }
                filtered.isEmpty() -> {
                    EmptyState(query = searchQuery, deptName = selectedDeptId?.let { deptMap[it] })
                }
                else -> {
                    LazyColumn(
                        state = listState,
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(filtered, key = { it.id }) { doc ->
                            DocumentCard(
                                document = doc,
                                departmentName = doc.departmentId?.let { deptMap[it] },
                                onClick = { onDocumentClick(doc, doc.departmentId?.let { deptMap[it] }) },
                                onEdit = {
                                    editName   = doc.originalName
                                    editDesc   = doc.description ?: ""
                                    editDeptId = doc.departmentId
                                    documentToEdit = doc
                                },
                                onDelete = { documentToDelete = doc }
                            )
                        }
                        item { Spacer(modifier = Modifier.height(8.dp)) }
                    }
                }
            }
        }
    }
}

// ─── Search bar ───────────────────────────────────────────────────────────────

@Composable
private fun SearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(
                width = 1.dp,
                color = MaterialTheme.colorScheme.outline.copy(alpha = 0.4f),
                shape = RoundedCornerShape(12.dp)
            )
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.Search,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(10.dp))
        val hint = stringResource(R.string.documents_search_hint)
        BasicTextField(
            value = query,
            onValueChange = onQueryChange,
            singleLine = true,
            textStyle = LocalTextStyle.current.copy(
                fontSize = 15.sp,
                color = MaterialTheme.colorScheme.onSurface
            ),
            cursorBrush = SolidColor(MaterialTheme.colorScheme.primary),
            decorationBox = { inner ->
                if (query.isEmpty()) {
                    Text(
                        text = hint,
                        fontSize = 15.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                    )
                }
                inner()
            },
            modifier = Modifier.weight(1f)
        )
    }
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

@Composable
private fun FilterChip(label: String, selected: Boolean, onClick: () -> Unit) {
    val bgColor by animateColorAsState(
        targetValue = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface,
        animationSpec = tween(200), label = "chip_bg"
    )
    val textColor by animateColorAsState(
        targetValue = if (selected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
        animationSpec = tween(200), label = "chip_text"
    )
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(50.dp))
            .background(bgColor)
            .border(
                width = 1.dp,
                color = if (selected) Color.Transparent else MaterialTheme.colorScheme.outline.copy(alpha = 0.35f),
                shape = RoundedCornerShape(50.dp)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 18.dp, vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
            color = textColor
        )
    }
}

// ─── Document card ────────────────────────────────────────────────────────────

@Composable
fun DocumentCard(
    document: DocumentApiModel,
    departmentName: String?,
    onClick: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
) {
    val accent = MaterialTheme.colorScheme.primary
    val fileType = mimeToFileType(document.mimeType)
    val aiColor = aiStatusColor(document.aiStatus)
    val noDeptShort = stringResource(R.string.documents_no_dept_short)

    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(accent.copy(alpha = 0.10f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Folder,
                    contentDescription = null,
                    tint = accent,
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                Text(
                    text = document.originalName,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    SmallBadge(
                        text = departmentName ?: noDeptShort,
                        color = accent
                    )
                    SmallBadge(text = fileType, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(
                        text = formatDate(document.createdAt),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 11.sp
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(
                        imageVector = Icons.Default.AutoAwesome,
                        contentDescription = null,
                        tint = aiColor,
                        modifier = Modifier.size(12.dp)
                    )
                    Text(
                        text = aiStatusLabel(document.aiStatus),
                        style = MaterialTheme.typography.labelSmall,
                        color = aiColor,
                        fontSize = 10.sp
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = formatFileSize(document.size),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 10.sp
                    )
                }
            }

            IconButton(onClick = onEdit, modifier = Modifier.size(36.dp)) {
                Icon(
                    imageVector = Icons.Default.Edit,
                    contentDescription = stringResource(R.string.edit),
                    tint = accent.copy(alpha = 0.75f),
                    modifier = Modifier.size(18.dp)
                )
            }
            IconButton(onClick = onDelete, modifier = Modifier.size(36.dp)) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = stringResource(R.string.delete),
                    tint = Color(0xFFDC2626).copy(alpha = 0.75f),
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

@Composable
fun SmallBadge(text: String, color: Color) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(4.dp))
            .background(color.copy(alpha = 0.10f))
            .padding(horizontal = 6.dp, vertical = 2.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Medium,
            color = color,
            fontSize = 10.sp
        )
    }
}

// ─── Sort menu ────────────────────────────────────────────────────────────────

@Composable
fun SortMenuButton(selected: SortOption, onSelect: (SortOption) -> Unit) {
    val accent = MaterialTheme.colorScheme.primary
    var expanded by remember { mutableStateOf(false) }
    Box {
        IconButton(onClick = { expanded = true }, modifier = Modifier.size(32.dp)) {
            Icon(
                imageVector = Icons.Default.Sort,
                contentDescription = stringResource(R.string.documents_sort_label),
                tint = accent,
                modifier = Modifier.size(18.dp)
            )
        }
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            containerColor = MaterialTheme.colorScheme.surface,
        ) {
            SortOption.entries.forEach { option ->
                DropdownMenuItem(
                    text = {
                        Text(
                            text = stringResource(option.labelRes),
                            color = if (option == selected) accent else MaterialTheme.colorScheme.onSurface,
                            fontWeight = if (option == selected) FontWeight.SemiBold else FontWeight.Normal
                        )
                    },
                    onClick = { onSelect(option); expanded = false }
                )
            }
        }
    }
}

// ─── Empty / Error states ─────────────────────────────────────────────────────

@Composable
fun EmptyState(query: String, deptName: String?) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.padding(32.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.10f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Description,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(36.dp)
                )
            }
            Text(
                text = stringResource(R.string.documents_empty),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground
            )
            Text(
                text = when {
                    query.isNotBlank() -> stringResource(R.string.documents_empty_search, query)
                    deptName != null   -> stringResource(R.string.documents_empty_dept, deptName)
                    else               -> stringResource(R.string.documents_upload_first)
                },
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun ErrorState(message: String, onRetry: () -> Unit) {
    val accent = MaterialTheme.colorScheme.primary
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.padding(32.dp)
        ) {
            Text(
                text = stringResource(R.string.documents_load_failed),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground
            )
            Text(
                text = message,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            TextButton(onClick = onRetry) {
                Text(stringResource(R.string.retry), color = accent)
            }
        }
    }
}
