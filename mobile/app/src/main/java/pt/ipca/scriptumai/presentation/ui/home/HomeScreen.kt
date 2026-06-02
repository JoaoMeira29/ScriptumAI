package pt.ipca.scriptumai.presentation.ui.home

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Article
import androidx.compose.material.icons.automirrored.filled.Help
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material.icons.filled.Contrast
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PublishedWithChanges
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.NavigationDrawerItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.annotation.StringRes
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import pt.ipca.scriptumai.ui.theme.ThemeMode
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import pt.ipca.scriptumai.R
import java.util.Locale
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import pt.ipca.scriptumai.data.model.document.DocumentApiModel
import pt.ipca.scriptumai.presentation.viewmodel.AuthViewModel
import pt.ipca.scriptumai.presentation.viewmodel.DocumentsViewModel
import pt.ipca.scriptumai.presentation.viewmodel.GlobalChatViewModel
import pt.ipca.scriptumai.presentation.viewmodel.HomeViewModel
import pt.ipca.scriptumai.presentation.viewmodel.UploadState
import pt.ipca.scriptumai.presentation.viewmodel.UploadViewModel

// ─── Bottom navigation tabs ───────────────────────────────────────────────────

private enum class BottomTab(@StringRes val labelRes: Int, val icon: ImageVector) {
    HOME(R.string.home_dashboard, Icons.Default.Home),
    DOCUMENTS(R.string.home_documents, Icons.Default.Description),
    GLOBAL_CHAT(R.string.global_chat_tab, Icons.Default.AutoAwesome),
    UPLOAD(R.string.home_upload, Icons.Default.CloudUpload),
}

// ─── Root screen ──────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onNavigateToNotifications: () -> Unit = {},
    onNavigateToProfile: () -> Unit = {},
    onNavigateToHelpDesk: () -> Unit = {},
    themeMode: ThemeMode = ThemeMode.SYSTEM,
    onThemeModeChange: (ThemeMode) -> Unit = {},
    onLanguageChange: (String) -> Unit = {},
) {
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    var selectedTab by remember { mutableStateOf(BottomTab.HOME) }

    val authViewModel: AuthViewModel = viewModel()
    val homeViewModel: HomeViewModel = viewModel()
    val documentsViewModel: DocumentsViewModel = viewModel()
    val uploadViewModel: UploadViewModel = viewModel()
    val globalChatViewModel: GlobalChatViewModel = viewModel()

    val homeUiState by homeViewModel.uiState.collectAsState()
    val documentsUiState by documentsViewModel.uiState.collectAsState()
    val uploadState by uploadViewModel.state.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(Unit) {
        documentsViewModel.snackbar.collect { message ->
            snackbarHostState.showSnackbar(message, withDismissAction = true)
        }
    }

    data class DocSelection(val document: DocumentApiModel, val departmentName: String?)
    var selection by remember { mutableStateOf<DocSelection?>(null) }

    // Navigate to detail when upload + AI processing finishes
    LaunchedEffect(uploadState) {
        if (uploadState is UploadState.Completed) {
            val doc = (uploadState as UploadState.Completed).document
            documentsViewModel.loadData()
            documentsViewModel.prepareChat(doc.id)
            selection = DocSelection(doc, null)
            selectedTab = BottomTab.DOCUMENTS
            uploadViewModel.reset()
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        if (selection != null) {
            val listDoc = documentsUiState.documents.find { it.id == selection!!.document.id }
            val liveDoc = if (listDoc != null) {
                listDoc.copy(downloadUrl = listDoc.downloadUrl ?: selection!!.document.downloadUrl)
            } else {
                selection!!.document
            }

            LaunchedEffect(liveDoc.id) {
                documentsViewModel.refreshDocument(liveDoc.id)
            }

            LaunchedEffect(liveDoc.id, liveDoc.aiStatus) {
                if (liveDoc.aiStatus?.uppercase() == "PROCESSING") {
                    while (true) {
                        delay(10_000)
                        documentsViewModel.refreshDocument(liveDoc.id)
                    }
                }
            }

            DocumentDetailScreen(
                document = liveDoc,
                departmentName = selection!!.departmentName,
                departments = documentsUiState.userDepartments,
                operationInProgress = documentsUiState.operationInProgress,
                chatMessages = documentsUiState.chatMessages,
                chatMessagesSent = documentsUiState.chatMessagesSent,
                chatMessagesLimit = documentsUiState.chatMessagesLimit,
                isChatSending = documentsUiState.isChatSending,
                onBack = { selection = null },
                onRefresh = { documentsViewModel.refreshDocument(liveDoc.id) },
                onDelete = {
                    documentsViewModel.deleteDocument(selection!!.document.id)
                    selection = null
                },
                onEdit = { request ->
                    documentsViewModel.updateDocument(selection!!.document.id, request)
                },
                onSendChatMessage = { msg ->
                    documentsViewModel.sendChatMessage(liveDoc.id, msg)
                }
            )
        } else {
            ModalNavigationDrawer(
                drawerState = drawerState,
                drawerContent = {
                    AppDrawerContent(
                        userName = homeUiState.displayName,
                        userEmail = homeUiState.userEmail,
                        themeMode = themeMode,
                        onThemeModeChange = onThemeModeChange,
                        onLanguageChange = onLanguageChange,
                        onNotifications = {
                            scope.launch { drawerState.close() }
                            onNavigateToNotifications()
                        },
                        onProfile = {
                            scope.launch { drawerState.close() }
                            onNavigateToProfile()
                        },
                        onHelp = {
                            scope.launch { drawerState.close() }
                            onNavigateToHelpDesk()
                        },
                        onLogout = {
                            scope.launch { drawerState.close() }
                            authViewModel.logout()
                        }
                    )
                }
            ) {
                Scaffold(
                    topBar = {
                        TopAppBar(
                            title = {
                                Text(
                                    text = stringResource(selectedTab.labelRes),
                                    fontWeight = FontWeight.Bold,
                                    style = MaterialTheme.typography.titleLarge
                                )
                            },
                            navigationIcon = {
                                IconButton(onClick = { scope.launch { drawerState.open() } }) {
                                    Icon(Icons.Default.Menu, contentDescription = stringResource(R.string.home_menu))
                                }
                            },
                            actions = {
                                IconButton(onClick = onNavigateToNotifications) {
                                    Icon(Icons.Default.Notifications, contentDescription = stringResource(R.string.home_notifications))
                                }
                                IconButton(onClick = onNavigateToProfile) {
                                    ProfileCircle(initials = homeUiState.initials)
                                }
                            },
                            colors = TopAppBarDefaults.topAppBarColors(
                                containerColor = MaterialTheme.colorScheme.surface,
                                titleContentColor = MaterialTheme.colorScheme.onSurface,
                                navigationIconContentColor = MaterialTheme.colorScheme.onSurface,
                                actionIconContentColor = MaterialTheme.colorScheme.onSurface
                            )
                        )
                    },
                    bottomBar = {
                        NavigationBar(
                            containerColor = MaterialTheme.colorScheme.surface,
                            tonalElevation = 4.dp
                        ) {
                            BottomTab.entries.forEach { tab ->
                                NavigationBarItem(
                                    selected = selectedTab == tab,
                                    onClick = { selectedTab = tab },
                                    icon = { Icon(tab.icon, contentDescription = stringResource(tab.labelRes)) },
                                    label = { Text(stringResource(tab.labelRes), style = MaterialTheme.typography.labelSmall) },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = MaterialTheme.colorScheme.primary,
                                        selectedTextColor = MaterialTheme.colorScheme.primary,
                                        indicatorColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)
                                    )
                                )
                            }
                        }
                    },
                    containerColor = MaterialTheme.colorScheme.background
                ) { innerPadding ->
                    Box(modifier = Modifier.padding(innerPadding)) {
                        when (selectedTab) {
                            BottomTab.HOME -> DashboardContent(
                                    onNavigateToTab = { selectedTab = it },
                                    documents = documentsUiState.documents,
                                    isLoading = documentsUiState.isLoading,
                                    welcomeName = homeUiState.displayName,
                                )
                            BottomTab.DOCUMENTS -> DocumentsScreen(
                                onDocumentClick = { doc, deptName ->
                                    documentsViewModel.prepareChat(doc.id)
                                    selection = DocSelection(doc, deptName)
                                },
                                viewModel = documentsViewModel,
                            )
                            BottomTab.GLOBAL_CHAT -> GlobalChatScreen(
                                viewModel = globalChatViewModel,
                            )
                            BottomTab.UPLOAD -> AddDocumentScreen(
                                onCancel = {
                                    uploadViewModel.reset()
                                    selectedTab = BottomTab.HOME
                                },
                                uploadViewModel = uploadViewModel,
                                departments = documentsUiState.userDepartments,
                            )
                        }
                    }
                }
            }
        }

        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier.align(Alignment.BottomCenter),
            snackbar = { data ->
                Snackbar(
                    snackbarData = data,
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary,
                )
            }
        )
    }
}

// ─── Drawer content ───────────────────────────────────────────────────────────

@Composable
private fun AppDrawerContent(
    userName: String,
    userEmail: String,
    themeMode: ThemeMode,
    onThemeModeChange: (ThemeMode) -> Unit,
    onLanguageChange: (String) -> Unit,
    onNotifications: () -> Unit,
    onProfile: () -> Unit,
    onHelp: () -> Unit,
    onLogout: () -> Unit,
) {
    ModalDrawerSheet(
        drawerContainerColor = MaterialTheme.colorScheme.surface,
        modifier = Modifier.width(320.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp)
        ) {
            // Header: Profile info
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onProfile() }
            ) {
                Box(contentAlignment = Alignment.BottomEnd) {
                    Surface(
                        modifier = Modifier.size(70.dp),
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.2f),
                        border = BorderStroke(2.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.3f))
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                Icons.Default.Person,
                                contentDescription = null,
                                modifier = Modifier.size(40.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                    Surface(
                        modifier = Modifier.size(24.dp),
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.surface,
                        shadowElevation = 2.dp,
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(Icons.Default.Edit, contentDescription = stringResource(R.string.home_edit_profile), modifier = Modifier.size(14.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }

                Spacer(modifier = Modifier.width(16.dp))

                Column {
                    Text(
                        text = userName,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = userEmail,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Settings Section
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                // Notifications Toggle
                SettingsRow(
                    icon = Icons.Default.Notifications,
                    label = stringResource(R.string.home_notifications)
                ) {
                    var notificationsEnabled by remember { mutableStateOf(true) }
                    Switch(
                        checked = notificationsEnabled,
                        onCheckedChange = { notificationsEnabled = it },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White,
                            checkedTrackColor = MaterialTheme.colorScheme.primary,
                            uncheckedThumbColor = Color.White,
                            uncheckedTrackColor = Color.LightGray
                        ),
                        modifier = Modifier.scale(0.8f)
                    )
                }

                // Theme Selector
                SettingsRow(
                    icon = Icons.Default.Contrast,
                    label = stringResource(R.string.home_theme)
                ) {
                    val themeOptions = listOf(
                        ThemeMode.LIGHT to stringResource(R.string.home_theme_light),
                        ThemeMode.DARK to stringResource(R.string.home_theme_dark),
                        ThemeMode.SYSTEM to stringResource(R.string.home_theme_system),
                    )
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(MaterialTheme.colorScheme.surfaceVariant)
                            .padding(2.dp)
                    ) {
                        themeOptions.forEach { (mode, label) ->
                            val isSelected = themeMode == mode
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.2f) else Color.Transparent)
                                    .clickable { onThemeModeChange(mode) }
                                    .padding(horizontal = 8.dp, vertical = 4.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = label,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                            }
                        }
                    }
                }

                // Language Selector
                SettingsRow(
                    icon = Icons.Default.Language,
                    label = stringResource(R.string.home_language)
                ) {
                    val currentLang = Locale.getDefault().language
                    val langOptions = listOf("EN" to "en", "PT" to "pt")
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(MaterialTheme.colorScheme.surfaceVariant)
                            .padding(2.dp)
                    ) {
                        langOptions.forEach { (label, code) ->
                            val isSelected = currentLang == code
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.2f) else Color.Transparent)
                                    .clickable { if (!isSelected) onLanguageChange(code) }
                                    .padding(horizontal = 14.dp, vertical = 4.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = label,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // Action Buttons at Bottom
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                ActionRowButton(icon = Icons.Default.Settings, label = stringResource(R.string.home_settings), onClick = onProfile)
                ActionRowButton(icon = Icons.AutoMirrored.Filled.Help, label = stringResource(R.string.home_help), onClick = onHelp)
                ActionRowButton(
                    icon = Icons.AutoMirrored.Filled.Logout,
                    label = stringResource(R.string.home_logout),
                    onClick = onLogout
                )
            }
        }
    }
}

@Composable
private fun SettingsRow(
    icon: ImageVector,
    label: String,
    content: @Composable () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 52.dp)
            .border(1.dp, Color.LightGray.copy(alpha = 0.5f), RoundedCornerShape(26.dp))
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text(label, style = MaterialTheme.typography.bodyMedium)
        }
        content()
    }
}

@Composable
private fun ActionRowButton(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit,
    color: Color = MaterialTheme.colorScheme.onSurface
) {
    Surface(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp),
        shape = RoundedCornerShape(26.dp),
        border = BorderStroke(1.dp, Color.LightGray.copy(alpha = 0.5f)),
        color = Color.Transparent
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp), tint = color)
            Spacer(modifier = Modifier.width(12.dp))
            Text(label, style = MaterialTheme.typography.bodyMedium, color = color, fontWeight = FontWeight.Medium)
        }
    }
}

// ─── Profile circle ───────────────────────────────────────────────────────────

@Composable
private fun ProfileCircle(initials: String = "U") {
    Box(
        modifier = Modifier
            .size(34.dp)
            .clip(CircleShape)
            .background(MaterialTheme.colorScheme.primary),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = initials,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onPrimary
        )
    }
}

// ─── Dashboard content ────────────────────────────────────────────────────────

@Composable
private fun DashboardContent(
    onNavigateToTab: (BottomTab) -> Unit,
    documents: List<DocumentApiModel>,
    isLoading: Boolean,
    welcomeName: String,
) {
    val totalDocs = documents.size
    val processedDocs = documents.count { it.aiStatus == "COMPLETED" }
    val pendingDocs = documents.count { it.aiStatus == "PENDING" || it.aiStatus == null }
    val recentDocs = documents.sortedByDescending { it.createdAt }.take(5)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(
                text = stringResource(R.string.home_welcome_back, welcomeName),
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
            Text(
                text = stringResource(R.string.home_overview),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(stringResource(R.string.home_documents), "$totalDocs", Icons.Default.Description, Modifier.weight(1f)) { onNavigateToTab(BottomTab.DOCUMENTS) }
            StatCard(stringResource(R.string.home_processed), "$processedDocs", Icons.Default.AutoAwesome, Modifier.weight(1f)) { onNavigateToTab(BottomTab.DOCUMENTS) }
            StatCard(stringResource(R.string.home_pending), "$pendingDocs", Icons.Default.PublishedWithChanges, Modifier.weight(1f)) { onNavigateToTab(BottomTab.DOCUMENTS) }
        }

        Text(
            text = stringResource(R.string.home_recent_documents),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onBackground
        )

        if (isLoading) {
            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                androidx.compose.material3.CircularProgressIndicator(modifier = Modifier.size(24.dp))
            }
        } else if (recentDocs.isEmpty()) {
            Text(
                text = stringResource(R.string.home_no_documents),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                recentDocs.forEach { doc ->
                    DocumentRow(
                        title = doc.originalName,
                        status = aiStatusLabel(doc.aiStatus),
                        date = doc.createdAt.take(10),
                        isActive = doc.aiStatus == "COMPLETED",
                        onClick = { onNavigateToTab(BottomTab.DOCUMENTS) }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(4.dp))
    }
}

// ─── Reusable components ──────────────────────────────────────────────────────

@Composable
private fun StatCard(
    label: String,
    value: String,
    icon: ImageVector,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
) {
    Card(
        modifier = modifier.then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
            }
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun DocumentRow(
    title: String,
    status: String,
    date: String,
    isActive: Boolean,
    onClick: (() -> Unit)? = null,
) {
    val statusColor = if (isActive) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant

    Card(
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth().then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.AutoMirrored.Filled.Article, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                Text(date, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Surface(shape = RoundedCornerShape(20.dp), color = statusColor.copy(alpha = 0.12f)) {
                Text(
                    text = status,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Medium,
                    color = statusColor,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                )
            }
        }
    }
}
