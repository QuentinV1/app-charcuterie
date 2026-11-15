package com.quentin.charcuterie.update

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.SystemUpdate
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL

data class UpdateInfo(
    val version: String,
    val notes: String,
    val apkUrl: String,
    val htmlUrl: String,
    val source: String
)

object UpdateManager {
    const val CURRENT_VERSION = "1.1.0"
    const val GITHUB_REPO = "QuentinV1/app-charcuterie"
    private const val PREFS_NAME = "laffinoir_update_prefs"
    private const val KEY_DISMISSED_VERSION = "dismissed_version"
    private const val KEY_DISMISSED_TIME = "dismissed_time"
    private const val DISMISS_COOLDOWN_MS = 24L * 3600L * 1000L

    fun compareVersions(v1: String?, v2: String?): Int {
        val clean1 = (v1 ?: "").trim().removePrefix("v").removePrefix("V").substringBefore("-")
        val clean2 = (v2 ?: "").trim().removePrefix("v").removePrefix("V").substringBefore("-")
        val parts1 = clean1.split(".").map { it.toIntOrNull() ?: 0 }
        val parts2 = clean2.split(".").map { it.toIntOrNull() ?: 0 }
        val len = maxOf(parts1.size, parts2.size)
        for (i in 0 until len) {
            val p1 = parts1.getOrElse(i) { 0 }
            val p2 = parts2.getOrElse(i) { 0 }
            if (p1 > p2) return 1
            if (p1 < p2) return -1
        }
        return 0
    }

    fun dismissVersion(context: Context, version: String) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_DISMISSED_VERSION, normalizeVersionTag(version))
            .putLong(KEY_DISMISSED_TIME, System.currentTimeMillis())
            .apply()
    }

    private fun isVersionDismissedRecently(context: Context, version: String): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val dismissedVer = prefs.getString(KEY_DISMISSED_VERSION, null) ?: return false
        val dismissedTime = prefs.getLong(KEY_DISMISSED_TIME, 0L)
        return dismissedVer == normalizeVersionTag(version) &&
            (System.currentTimeMillis() - dismissedTime) < DISMISS_COOLDOWN_MS
    }

    private fun normalizeVersionTag(version: String): String {
        val clean = version.trim().removePrefix("v").removePrefix("V")
        return "v$clean"
    }

    suspend fun checkForUpdate(context: Context, isManual: Boolean): UpdateInfo? = withContext(Dispatchers.IO) {
        val (releaseInfo, mainInfo) = coroutineScope {
            val relDeferred = async { fetchLatestReleaseInfo() }
            val mainDeferred = async { fetchMainBranchInfo() }
            relDeferred.await() to mainDeferred.await()
        }

        val bestUpdate = when {
            releaseInfo != null && mainInfo != null -> {
                if (compareVersions(mainInfo.version, releaseInfo.version) >= 0) mainInfo else releaseInfo
            }
            else -> mainInfo ?: releaseInfo
        } ?: return@withContext null

        val currentVersion = runCatching {
            val info = context.packageManager.getPackageInfo(context.packageName, 0)
            info.versionName ?: CURRENT_VERSION
        }.getOrDefault(CURRENT_VERSION)

        if (compareVersions(bestUpdate.version, currentVersion) <= 0) {
            return@withContext null
        }

        if (!isManual && isVersionDismissedRecently(context, bestUpdate.version)) {
            return@withContext null
        }

        bestUpdate
    }

    private fun fetchLatestReleaseInfo(): UpdateInfo? = runCatching {
        val jsonText = httpGetText(
            urlStr = "https://api.github.com/repos/$GITHUB_REPO/releases/latest",
            accept = "application/vnd.github.v3+json"
        ) ?: return null
        val json = JSONObject(jsonText)
        val rawVersion = json.optString("tag_name").ifBlank { json.optString("name") }
        if (rawVersion.isBlank()) return null

        var apkUrl = ""
        val assets = json.optJSONArray("assets")
        if (assets != null) {
            for (i in 0 until assets.length()) {
                val asset = assets.optJSONObject(i) ?: continue
                val name = asset.optString("name")
                if (name.lowercase().endsWith(".apk")) {
                    apkUrl = asset.optString("browser_download_url")
                    if (apkUrl.isNotBlank()) break
                }
            }
        }

        val htmlUrl = json.optString("html_url", "https://github.com/$GITHUB_REPO/releases")
        if (apkUrl.isBlank()) apkUrl = htmlUrl

        UpdateInfo(
            version = normalizeVersionTag(rawVersion),
            notes = json.optString("body").trim().ifBlank { "Nouvelle version publiée sur GitHub Releases." },
            apkUrl = apkUrl,
            htmlUrl = htmlUrl,
            source = "release"
        )
    }.getOrNull()

    private fun fetchMainBranchInfo(): UpdateInfo? = runCatching {
        val manifestText = httpGetText(
            urlStr = "https://raw.githubusercontent.com/$GITHUB_REPO/main/version.json?t=${System.currentTimeMillis()}",
            accept = "application/json"
        ) ?: return null
        val manifest = JSONObject(manifestText)
        val rawVersion = manifest.optString("version")
        if (rawVersion.isBlank()) return null

        val commitNotes = runCatching {
            val commitText = httpGetText(
                urlStr = "https://api.github.com/repos/$GITHUB_REPO/commits/main",
                accept = "application/vnd.github.v3+json"
            )
            if (commitText != null) {
                JSONObject(commitText).optJSONObject("commit")?.optString("message")?.trim().orEmpty()
            } else {
                ""
            }
        }.getOrDefault("")

        val manifestNotes = manifest.optString("notes").trim()
        val notes = listOf(manifestNotes, commitNotes)
            .filter { it.isNotBlank() }
            .distinct()
            .joinToString("\n\n")
            .ifBlank { "Nouvelle mise à jour disponible sur Git (branche main)." }

        val apkUrl = manifest.optString("apkUrl")
            .ifBlank { "https://github.com/$GITHUB_REPO/raw/main/LAffinoir.apk" }

        UpdateInfo(
            version = normalizeVersionTag(rawVersion),
            notes = notes,
            apkUrl = apkUrl,
            htmlUrl = "https://github.com/$GITHUB_REPO",
            source = "git-main"
        )
    }.getOrNull()

    private fun httpGetText(urlStr: String, accept: String): String? {
        var conn: HttpURLConnection? = null
        return try {
            conn = (URL(urlStr).openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 8000
                readTimeout = 8000
                useCaches = false
                setRequestProperty("Accept", accept)
                setRequestProperty("Cache-Control", "no-cache")
                setRequestProperty("User-Agent", "LAffinoir-Android/$CURRENT_VERSION")
            }
            if (conn.responseCode in 200..299) {
                conn.inputStream.bufferedReader().use { it.readText() }
            } else {
                null
            }
        } catch (_: Exception) {
            null
        } finally {
            conn?.disconnect()
        }
    }

    suspend fun downloadAndInstallApk(
        context: Context,
        apkUrl: String,
        onProgress: (Float) -> Unit
    ): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val updatesDir = File(context.cacheDir, "updates").apply { mkdirs() }
            val apkFile = File(updatesDir, "LAffinoir.apk")
            if (apkFile.exists()) apkFile.delete()

            var currentUrl = apkUrl
            var conn: HttpURLConnection? = null
            var redirects = 0
            try {
                while (redirects < 5) {
                    conn = (URL(currentUrl).openConnection() as HttpURLConnection).apply {
                        instanceFollowRedirects = false
                        connectTimeout = 15000
                        readTimeout = 30000
                        useCaches = false
                        setRequestProperty("User-Agent", "LAffinoir-Android/$CURRENT_VERSION")
                    }
                    val code = conn.responseCode
                    if (code in 300..399) {
                        val nextUrl = conn.getHeaderField("Location")
                        conn.disconnect()
                        if (nextUrl.isNullOrBlank()) break
                        currentUrl = nextUrl
                        redirects++
                    } else {
                        break
                    }
                }

                val activeConn = conn ?: error("Connexion impossible")
                if (activeConn.responseCode !in 200..299) {
                    error("HTTP ${activeConn.responseCode}")
                }

                val totalBytes = activeConn.contentLengthLong
                var downloaded = 0L
                val buffer = ByteArray(8192)

                activeConn.inputStream.use { input ->
                    FileOutputStream(apkFile).use { output ->
                        while (true) {
                            val read = input.read(buffer)
                            if (read <= 0) break
                            output.write(buffer, 0, read)
                            downloaded += read
                            if (totalBytes > 0L) {
                                val progress = (downloaded.toFloat() / totalBytes.toFloat()).coerceIn(0f, 1f)
                                withContext(Dispatchers.Main) { onProgress(progress) }
                            }
                        }
                    }
                }
            } finally {
                conn?.disconnect()
            }

            withContext(Dispatchers.Main) {
                onProgress(1f)
                launchApkInstaller(context, apkFile, apkUrl)
            }
        }.onFailure {
            withContext(Dispatchers.Main) {
                openUrlInBrowser(context, apkUrl)
            }
        }
    }

    private fun launchApkInstaller(context: Context, apkFile: File, fallbackUrl: String) {
        try {
            val apkUri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                apkFile
            )
            val installIntent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(apkUri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(installIntent)
        } catch (_: Exception) {
            openUrlInBrowser(context, fallbackUrl)
        }
    }

    private fun openUrlInBrowser(context: Context, url: String) {
        runCatching {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        }
    }
}

@Composable
fun UpdateAvailableDialog(
    updateInfo: UpdateInfo,
    currentVersion: String = UpdateManager.CURRENT_VERSION,
    onDismissLater: () -> Unit,
    onFinishedOrDismissed: () -> Unit
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val scope = rememberCoroutineScope()
    var isDownloading by remember { mutableStateOf(false) }
    var progress by remember { mutableFloatStateOf(0f) }
    var statusMessage by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = {
            if (!isDownloading) onDismissLater()
        },
        icon = {
            Icon(
                imageVector = Icons.Default.SystemUpdate,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(32.dp)
            )
        },
        title = {
            Text(
                text = "Mise à jour disponible",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(
                        text = "Version ${updateInfo.version} disponible (actuelle : v$currentVersion)",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                    )
                }

                Text(
                    text = "Nouveautés :",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = FontWeight.Bold
                )
                Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = updateInfo.notes,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.padding(12.dp)
                    )
                }

                if (isDownloading) {
                    Spacer(Modifier.height(2.dp))
                    if (progress > 0f) {
                        LinearProgressIndicator(
                            progress = { progress },
                            modifier = Modifier.fillMaxWidth()
                        )
                        Text(
                            text = "Téléchargement de l'APK : ${(progress * 100).toInt()} %",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    } else {
                        LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                        Text(
                            text = "Téléchargement de l'APK depuis Git…",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }

                statusMessage?.let { msg ->
                    Text(
                        text = msg,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
            }
        },
        confirmButton = {
            Button(
                enabled = !isDownloading,
                onClick = {
                    isDownloading = true
                    progress = 0f
                    statusMessage = null
                    scope.launch {
                        val res = UpdateManager.downloadAndInstallApk(context, updateInfo.apkUrl) { p ->
                            progress = p
                        }
                        isDownloading = false
                        if (res.isSuccess) {
                            statusMessage = "Installateur Android ouvert. Validez l'installation pour passer en ${updateInfo.version}."
                            onFinishedOrDismissed()
                        } else {
                            statusMessage = "Ouverture du téléchargement dans le navigateur…"
                        }
                    }
                }
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(if (isDownloading) "Téléchargement…" else "Télécharger et installer")
                }
            }
        },
        dismissButton = {
            TextButton(
                enabled = !isDownloading,
                onClick = onDismissLater
            ) {
                Text("Plus tard")
            }
        }
    )
}
