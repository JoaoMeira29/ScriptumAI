package pt.ipca.scriptumai.presentation.ui.home

import android.app.Activity
import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import pt.ipca.scriptumai.R
import pt.ipca.scriptumai.data.model.document.DepartmentApiModel
import pt.ipca.scriptumai.presentation.viewmodel.UploadState
import pt.ipca.scriptumai.presentation.viewmodel.UploadViewModel
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddDocumentScreen(
    onCancel: () -> Unit,
    uploadViewModel: UploadViewModel,
    departments: List<DepartmentApiModel> = emptyList(),
) {
    val uploadState by uploadViewModel.state.collectAsState()
    val context = LocalContext.current
    val accentColor = MaterialTheme.colorScheme.primary

    var docName by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var selectedFileUri by remember { mutableStateOf<Uri?>(null) }
    var fileName by remember { mutableStateOf("") }
    var selectedDepartmentId by remember { mutableStateOf<String?>(null) }
    var departmentDropdownExpanded by remember { mutableStateOf(false) }

    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        selectedFileUri = uri
        uri?.let {
            fileName = getDisplayName(context, it) ?: it.lastPathSegment ?: "document.pdf"
            if (docName.isBlank()) docName = fileName.substringBeforeLast(".")
        }
    }

    val scannerOptions = remember {
        GmsDocumentScannerOptions.Builder()
            .setGalleryImportAllowed(false)
            .setResultFormats(GmsDocumentScannerOptions.RESULT_FORMAT_PDF)
            .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_FULL)
            .build()
    }
    val scanner = remember { GmsDocumentScanning.getClient(scannerOptions) }

    val scannerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartIntentSenderForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            GmsDocumentScanningResult.fromActivityResultIntent(result.data)?.pdf?.let { pdf ->
                selectedFileUri = pdf.uri
                fileName = "scanned_document.pdf"
                if (docName.isBlank()) docName = "Scanned Document"
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(top = 24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            AnimatedContent(
                targetState = uploadState,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                label = "upload_state_anim"
            ) { state ->
                when (state) {
                    is UploadState.Uploading -> ProcessingContent(stringResource(R.string.add_document_uploading), accentColor)
                    is UploadState.Polling -> ProcessingContent(stringResource(R.string.add_document_ai_processing), accentColor)
                    is UploadState.Completed -> CompletedCard(state.document.originalName, accentColor)
                    is UploadState.Error -> ErrorCard(state.message) { uploadViewModel.reset() }
                    else -> {
                        // Upload Area
                        Column(verticalArrangement = Arrangement.spacedBy(20.dp)) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(240.dp)
                                    .background(accentColor.copy(alpha = 0.08f), RoundedCornerShape(24.dp))
                                    .border(
                                        BorderStroke(1.5.dp, accentColor.copy(alpha = 0.4f)),
                                        RoundedCornerShape(24.dp)
                                    )
                                    .clickable { filePickerLauncher.launch("*/*") },
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier.padding(16.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.CloudUpload,
                                        contentDescription = null,
                                        modifier = Modifier.size(64.dp),
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text(
                                        text = if (selectedFileUri == null) stringResource(R.string.add_document_drop_hint) else fileName,
                                        textAlign = TextAlign.Center,
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Button(
                                            onClick = { filePickerLauncher.launch("*/*") },
                                            shape = RoundedCornerShape(12.dp),
                                            colors = ButtonDefaults.buttonColors(containerColor = accentColor)
                                        ) {
                                            Icon(Icons.Default.UploadFile, contentDescription = null, modifier = Modifier.size(18.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                if (selectedFileUri == null) stringResource(R.string.add_document_upload_button)
                                                else stringResource(R.string.add_document_change_button),
                                                color = Color.White
                                            )
                                        }
                                        OutlinedButton(
                                            onClick = {
                                                val activity = context as? Activity ?: return@OutlinedButton
                                                scanner.getStartScanIntent(activity)
                                                    .addOnSuccessListener { intentSender ->
                                                        scannerLauncher.launch(
                                                            IntentSenderRequest.Builder(intentSender).build()
                                                        )
                                                    }
                                                    .addOnFailureListener { e ->
                                                        Log.e("AddDocumentScreen", "Scanner failed to start", e)
                                                    }
                                            },
                                            shape = RoundedCornerShape(12.dp),
                                            border = BorderStroke(1.dp, accentColor)
                                        ) {
                                            Icon(Icons.Default.DocumentScanner, contentDescription = null, tint = accentColor, modifier = Modifier.size(18.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(stringResource(R.string.add_document_scan_button), color = accentColor)
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text(
                                        text = stringResource(R.string.add_document_supported_files),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        fontSize = 10.sp
                                    )
                                }
                            }

                            Text(
                                text = stringResource(R.string.add_document_file_details),
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.fillMaxWidth(),
                                textAlign = TextAlign.Center
                            )

                            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                MockupInput(label = stringResource(R.string.add_document_name_label), value = docName, onValueChange = { docName = it }, placeholder = stringResource(R.string.add_document_name_hint))
                                MockupInput(label = stringResource(R.string.add_document_description_label), value = description, onValueChange = { description = it }, placeholder = stringResource(R.string.add_document_description_hint), isMultiline = true)

                                if (departments.isNotEmpty()) {
                                    val selectedDeptName = departments.find { it.id == selectedDepartmentId }?.name ?: stringResource(R.string.documents_no_department)

                                    Column(modifier = Modifier.fillMaxWidth()) {
                                        Text(
                                            text = stringResource(R.string.documents_field_department),
                                            fontWeight = FontWeight.Bold,
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = Color.DarkGray
                                        )
                                        Spacer(modifier = Modifier.height(6.dp))
                                        ExposedDropdownMenuBox(
                                            expanded = departmentDropdownExpanded,
                                            onExpandedChange = { departmentDropdownExpanded = it }
                                        ) {
                                            OutlinedTextField(
                                                value = selectedDeptName,
                                                onValueChange = {},
                                                readOnly = true,
                                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = departmentDropdownExpanded) },
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .menuAnchor(MenuAnchorType.PrimaryNotEditable),
                                                shape = RoundedCornerShape(20.dp),
                                                colors = OutlinedTextFieldDefaults.colors(
                                                    focusedBorderColor = accentColor,
                                                    unfocusedBorderColor = accentColor.copy(alpha = 0.5f),
                                                    focusedLabelColor = accentColor,
                                                    unfocusedLabelColor = accentColor.copy(alpha = 0.7f),
                                                    focusedTrailingIconColor = accentColor,
                                                    unfocusedTrailingIconColor = accentColor.copy(alpha = 0.7f),
                                                    unfocusedContainerColor = Color.Transparent,
                                                    focusedContainerColor = Color.Transparent
                                                )
                                            )
                                            ExposedDropdownMenu(
                                                expanded = departmentDropdownExpanded,
                                                onDismissRequest = { departmentDropdownExpanded = false },
                                                containerColor = MaterialTheme.colorScheme.surface,
                                            ) {
                                                DropdownMenuItem(
                                                    text = {
                                                        Text(
                                                            stringResource(R.string.documents_no_department),
                                                            color = if (selectedDepartmentId == null) accentColor else MaterialTheme.colorScheme.onSurface
                                                        )
                                                    },
                                                    onClick = {
                                                        selectedDepartmentId = null
                                                        departmentDropdownExpanded = false
                                                    }
                                                )
                                                departments.forEach { dept ->
                                                    DropdownMenuItem(
                                                        text = {
                                                            Text(
                                                                dept.name,
                                                                color = if (dept.id == selectedDepartmentId) accentColor else MaterialTheme.colorScheme.onSurface
                                                            )
                                                        },
                                                        onClick = {
                                                            selectedDepartmentId = dept.id
                                                            departmentDropdownExpanded = false
                                                        }
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 12.dp, bottom = 32.dp),
                                horizontalArrangement = Arrangement.End,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                OutlinedButton(
                                    onClick = onCancel,
                                    modifier = Modifier.height(44.dp).padding(horizontal = 4.dp),
                                    shape = RoundedCornerShape(14.dp),
                                    border = BorderStroke(1.dp, accentColor)
                                ) {
                                    Text(stringResource(R.string.cancel), color = accentColor, fontWeight = FontWeight.Bold)
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                Button(
                                    onClick = {
                                        val uri = selectedFileUri ?: return@Button
                                        val file = uriToFile(context, uri, fileName)
                                        if (file != null) {
                                            uploadViewModel.upload(file, description.trim().ifBlank { null }, selectedDepartmentId, docName.trim().ifBlank { null })
                                        }
                                    },
                                    modifier = Modifier.height(44.dp).padding(horizontal = 4.dp),
                                    shape = RoundedCornerShape(14.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = accentColor),
                                    enabled = selectedFileUri != null
                                ) {
                                    Text(stringResource(R.string.save), color = Color.White, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}

@Composable
fun MockupInput(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    isMultiline: Boolean = false
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(text = label, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
        Spacer(modifier = Modifier.height(6.dp))
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder, color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)) },
            modifier = Modifier.fillMaxWidth().then(if (isMultiline) Modifier.height(140.dp) else Modifier),
            shape = RoundedCornerShape(20.dp),
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedContainerColor = Color.Transparent,
                focusedContainerColor = Color.Transparent
            )
        )
    }
}

@Composable
private fun ProcessingContent(message: String, accentColor: Color) {
    Column(verticalArrangement = Arrangement.spacedBy(20.dp)) {
        UploadProgressCard(message, accentColor)

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = accentColor.copy(alpha = 0.06f)),
            border = BorderStroke(1.dp, accentColor.copy(alpha = 0.15f))
        ) {
            Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text(
                    text = stringResource(R.string.add_document_whats_happening),
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                ProcessingStep(
                    icon = Icons.Default.Upload,
                    title = stringResource(R.string.add_document_step1_title),
                    subtitle = stringResource(R.string.add_document_step1_desc),
                    accentColor = accentColor
                )
                ProcessingStep(
                    icon = Icons.Default.DocumentScanner,
                    title = stringResource(R.string.add_document_step2_title),
                    subtitle = stringResource(R.string.add_document_step2_desc),
                    accentColor = accentColor
                )
                ProcessingStep(
                    icon = Icons.Default.Psychology,
                    title = stringResource(R.string.add_document_step3_title),
                    subtitle = stringResource(R.string.add_document_step3_desc),
                    accentColor = accentColor
                )
            }
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
        ) {
            Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = stringResource(R.string.add_document_once_ready),
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                FeatureHint(Icons.Default.Chat, stringResource(R.string.add_document_feature_chat), accentColor)
                FeatureHint(Icons.Default.Summarize, stringResource(R.string.add_document_feature_summary), accentColor)
                FeatureHint(Icons.Default.Search, stringResource(R.string.add_document_feature_search), accentColor)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
private fun ProcessingStep(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, subtitle: String, accentColor: Color) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .background(accentColor.copy(alpha = 0.12f), RoundedCornerShape(10.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = accentColor, modifier = Modifier.size(18.dp))
        }
        Column {
            Text(title, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface)
            Text(subtitle, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun FeatureHint(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, accentColor: Color) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Icon(imageVector = icon, contentDescription = null, tint = accentColor, modifier = Modifier.size(18.dp))
        Text(label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface)
    }
}

@Composable
private fun UploadProgressCard(message: String, accentColor: Color) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, accentColor.copy(alpha = 0.2f))
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(contentAlignment = Alignment.Center) {
                CircularProgressIndicator(
                    modifier = Modifier.size(80.dp),
                    color = accentColor,
                    strokeWidth = 4.dp
                )
                Icon(
                    imageVector = Icons.Default.AutoAwesome,
                    contentDescription = null,
                    tint = accentColor,
                    modifier = Modifier.size(32.dp)
                )
            }
            Spacer(modifier = Modifier.height(24.dp))
            Text(
                text = message,
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.titleMedium,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = stringResource(R.string.add_document_ai_note),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
private fun CompletedCard(documentName: String, accentColor: Color) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, accentColor.copy(alpha = 0.2f))
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = accentColor, modifier = Modifier.size(64.dp))
            Spacer(modifier = Modifier.height(16.dp))
            Text(stringResource(R.string.add_document_ready), fontWeight = FontWeight.ExtraBold, style = MaterialTheme.typography.titleLarge, textAlign = TextAlign.Center)
            Text(documentName, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
        }
    }
}

@Composable
private fun ErrorCard(message: String, onRetry: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.error.copy(alpha = 0.2f))
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(stringResource(R.string.add_document_failed), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.error, textAlign = TextAlign.Center)
            Spacer(modifier = Modifier.height(8.dp))
            Text(message, textAlign = TextAlign.Center, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onErrorContainer)
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = onRetry, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)) {
                Text(stringResource(R.string.retry), color = Color.White)
            }
        }
    }
}

private fun getDisplayName(context: Context, uri: Uri): String? =
    context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
        val idx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
        if (idx != -1 && cursor.moveToFirst()) cursor.getString(idx) else null
    }

private fun uriToFile(context: Context, uri: Uri, fallbackName: String): File? = try {
    val inputStream = context.contentResolver.openInputStream(uri) ?: return null
    val tempFile = File(context.cacheDir, fallbackName.ifBlank { "upload.pdf" })
    tempFile.outputStream().use { out -> inputStream.use { it.copyTo(out) } }
    tempFile
} catch (_: Exception) {
    null
}
