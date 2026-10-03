package com.mindspace.app

import android.app.Activity
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.regex.Pattern
import kotlin.concurrent.thread

/**
 * Headless, transparent share target activity for Android.
 * Handles share intents instantly without opening the main React Native application UI.
 * Saves links to the backend in the background and posts a high-priority Dynamic Island /
 * heads-up notification once saving completes 100%.
 */
class ShareActivity : Activity() {

    companion object {
        private const val TAG = "MindspaceShare"
        private const val CHANNEL_ID = "mindspace_island_v2"
        private const val PREFS_NAME = "MindspacePrefs"
        private const val KEY_PENDING_BOOKMARKS = "pendingBookmarks"
        private const val KEY_AUTH_TOKEN = "mindspace_auth_token"
        private const val KEY_API_URL = "mindspace_api_url"
        private const val KEY_AUTO_AI = "mindspace_auto_ai"
        private const val DEFAULT_API_URL = "https://mindspace-link-web-scrapper.onrender.com/api/v1"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        @Suppress("DEPRECATION")
        overridePendingTransition(0, 0)

        // 1. Instant tactile haptic feedback to confirm the user's tap on the share sheet
        triggerInstantHaptic()

        // 2. Extract shared text and target URL
        val rawText = extractRawText(intent)
        val titleExtra = extractTitle(intent)
        val targetUrl = extractUrl(rawText)

        if (targetUrl.isEmpty()) {
            Log.w(TAG, "No valid URL found in share intent. rawText: $rawText")
            finish()
            @Suppress("DEPRECATION")
            overridePendingTransition(0, 0)
            return
        }

        val host = extractHost(targetUrl)
        val displayTitle = if (titleExtra.isNotBlank()) titleExtra else host

        val appContext = applicationContext
        val pendingId = "bm_${System.currentTimeMillis()}"

        // 3. Queue in SharedPreferences (guarantees zero data loss if network drops)
        queuePendingBookmark(appContext, pendingId, targetUrl, displayTitle)

        // 4. Immediately finish this Activity so the user stays in their current app (Chrome, Twitter, etc.)
        finish()
        @Suppress("DEPRECATION")
        overridePendingTransition(0, 0)

        // 5. Asynchronously save bookmark in background thread and show Dynamic Island banner once saved 100%
        thread(isDaemon = false) {
            saveBookmarkInBackground(appContext, pendingId, targetUrl, displayTitle, host)
        }
    }

    private fun triggerInstantHaptic() {
        try {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vibratorManager?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                vibrator?.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK))
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createOneShot(40, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(40)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Haptic feedback error: ${e.message}")
        }
    }

    private fun extractRawText(intent: Intent): String {
        var text = intent.getStringExtra(Intent.EXTRA_TEXT) ?: ""
        if (text.isEmpty() && intent.data != null) {
            text = intent.data.toString()
        }
        if (text.isEmpty() && intent.clipData != null && intent.clipData!!.itemCount > 0) {
            text = intent.clipData!!.getItemAt(0).text?.toString() ?: ""
        }
        return text.trim()
    }

    private fun extractTitle(intent: Intent): String {
        var title = intent.getStringExtra(Intent.EXTRA_SUBJECT) ?: ""
        if (title.isEmpty()) {
            val charSeq = intent.getCharSequenceExtra(Intent.EXTRA_TITLE)
            if (charSeq != null) title = charSeq.toString()
        }
        return title.trim()
    }

    private fun extractUrl(text: String): String {
        val trimmed = text.trim()
        if (trimmed.isEmpty()) return ""

        val lower = trimmed.lowercase(Locale.ROOT)
        if (lower.startsWith("file:") || lower.startsWith("content:") || lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("blob:")) {
            return ""
        }

        val pattern = Pattern.compile("https?://[^\\s]+", Pattern.CASE_INSENSITIVE)
        val matcher = pattern.matcher(trimmed)
        val candidate = if (matcher.find()) {
            matcher.group()
        } else if (trimmed.startsWith("http://", ignoreCase = true) || trimmed.startsWith("https://", ignoreCase = true)) {
            trimmed
        } else {
            return ""
        }

        return try {
            val uri = Uri.parse(candidate)
            val scheme = uri.scheme?.lowercase(Locale.ROOT)
            val host = uri.host
            // Strictly enforce http or https protocol and non-empty host
            if ((scheme == "http" || scheme == "https") && !host.isNullOrBlank()) {
                candidate
            } else {
                ""
            }
        } catch (e: Exception) {
            ""
        }
    }

    private fun extractHost(urlStr: String): String {
        return try {
            val uri = Uri.parse(urlStr)
            uri.host?.removePrefix("www.") ?: "Saved Link"
        } catch (e: Exception) {
            "Saved Link"
        }
    }

    private fun queuePendingBookmark(
        context: Context,
        pendingId: String,
        targetUrl: String,
        displayTitle: String
    ) {
        try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val existingRaw = prefs.getString(KEY_PENDING_BOOKMARKS, "[]") ?: "[]"
            val array = try { JSONArray(existingRaw) } catch (e: Exception) { JSONArray() }

            val item = JSONObject().apply {
                put("id", pendingId)
                put("url", targetUrl)
                put("title", displayTitle)
                val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }
                put("created_at", sdf.format(Date()))
            }
            array.put(item)
            prefs.edit().putString(KEY_PENDING_BOOKMARKS, array.toString()).apply()
            Log.d(TAG, "Queued pending bookmark: $pendingId")
        } catch (e: Exception) {
            Log.e(TAG, "Error saving pending bookmark: ${e.message}")
        }
    }

    private fun removePendingBookmark(context: Context, pendingId: String, targetUrl: String) {
        try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val existingRaw = prefs.getString(KEY_PENDING_BOOKMARKS, "[]") ?: "[]"
            val array = try { JSONArray(existingRaw) } catch (e: Exception) { JSONArray() }
            val newArray = JSONArray()

            for (i in 0 until array.length()) {
                val item = array.optJSONObject(i) ?: continue
                val id = item.optString("id")
                val url = item.optString("url")
                if (id != pendingId && url != targetUrl) {
                    newArray.put(item)
                }
            }
            prefs.edit().putString(KEY_PENDING_BOOKMARKS, newArray.toString()).apply()
        } catch (e: Exception) {
            Log.e(TAG, "Error removing pending bookmark: ${e.message}")
        }
    }

    private fun saveBookmarkInBackground(
        context: Context,
        pendingId: String,
        targetUrl: String,
        displayTitle: String,
        host: String
    ) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val token = prefs.getString(KEY_AUTH_TOKEN, null)
        val storedApiUrl = prefs.getString(KEY_API_URL, null)

        // Security: In production/release builds, strictly enforce the hardcoded production API endpoint
        // to prevent rogue URL redirection and token harvesting.
        val apiUrl = if (!BuildConfig.DEBUG) {
            DEFAULT_API_URL
        } else {
            val candidate = (storedApiUrl ?: DEFAULT_API_URL).trim().removeSuffix("/")
            if (candidate.startsWith("https://") || candidate.startsWith("http://")) candidate else DEFAULT_API_URL
        }
        val autoAi = prefs.getString(KEY_AUTO_AI, "true") != "false"

        val endpointUrl = "$apiUrl/bookmarks"
        Log.d(TAG, "Saving to endpoint: $endpointUrl (token present: ${!token.isNullOrEmpty()})")

        var connection: HttpURLConnection? = null
        try {
            val url = URL(endpointUrl)
            connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "POST"
            connection.connectTimeout = 10000
            connection.readTimeout = 15000
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("Accept", "application/json")
            connection.setRequestProperty("X-Auto-AI-Context", if (autoAi) "true" else "false")

            if (!token.isNullOrEmpty()) {
                connection.setRequestProperty("Authorization", "Bearer $token")
            }

            val body = JSONObject().apply {
                put("url", targetUrl)
            }

            OutputStreamWriter(connection.outputStream).use { writer ->
                writer.write(body.toString())
                writer.flush()
            }

            val statusCode = connection.responseCode
            val responseStream = if (statusCode in 200..299) connection.inputStream else connection.errorStream
            val responseBody = responseStream?.let {
                BufferedReader(InputStreamReader(it)).use { reader -> reader.readText() }
            } ?: ""

            Log.d(TAG, "POST result: $statusCode, body: $responseBody")

            val responseJson = try { JSONObject(responseBody) } catch (e: Exception) { null }

            when (statusCode) {
                201 -> {
                    removePendingBookmark(context, pendingId, targetUrl)
                    val parsedTitle = responseJson?.optString("title")?.takeIf { it.isNotBlank() } ?: displayTitle
                    showDynamicIslandNotification(
                        context = context,
                        title = "Saved to Mindspace",
                        message = "$parsedTitle • Link saved",
                        badgeText = "Saved",
                        isError = false
                    )
                }
                200 -> {
                    removePendingBookmark(context, pendingId, targetUrl)
                    val alreadyExists = responseJson?.optBoolean("already_exists", false) ?: false
                    val parsedTitle = responseJson?.optString("title")?.takeIf { it.isNotBlank() } ?: displayTitle
                    if (alreadyExists) {
                        showDynamicIslandNotification(
                            context = context,
                            title = "Link Already Saved",
                            message = "$parsedTitle • In Your Mindspace",
                            badgeText = "Existing",
                            isError = false
                        )
                    } else {
                        showDynamicIslandNotification(
                            context = context,
                            title = "Saved to Mindspace",
                            message = "$parsedTitle • Link saved",
                            badgeText = "Saved",
                            isError = false
                        )
                    }
                }
                403 -> {
                    removePendingBookmark(context, pendingId, targetUrl)
                    val errorMsg = responseJson?.optString("error", "") ?: ""
                    if (errorMsg.contains("credit", ignoreCase = true)) {
                        showDynamicIslandNotification(
                            context = context,
                            title = "Mindspace: No Free Credits",
                            message = "Upgrade your plan in Mindspace to save more links",
                            badgeText = "Upgrade",
                            isError = true
                        )
                    } else {
                        showDynamicIslandNotification(
                            context = context,
                            title = "Mindspace: Plan Limit Reached",
                            message = if (errorMsg.isNotBlank()) errorMsg else "Check your account subscription",
                            badgeText = "Limit",
                            isError = true
                        )
                    }
                }
                401 -> {
                    showDynamicIslandNotification(
                        context = context,
                        title = "Mindspace: Sign In Required",
                        message = "Link saved offline. Open Mindspace to log in and sync.",
                        badgeText = "Sign In",
                        isError = true
                    )
                }
                400 -> {
                    removePendingBookmark(context, pendingId, targetUrl)
                    val errorMsg = responseJson?.optString("error", "The link could not be processed")
                    showDynamicIslandNotification(
                        context = context,
                        title = "Mindspace: Invalid Link",
                        message = errorMsg ?: "Invalid link",
                        badgeText = "Error",
                        isError = true
                    )
                }
                else -> {
                    showDynamicIslandNotification(
                        context = context,
                        title = "Saved Offline",
                        message = "$displayTitle • Will sync when you open Mindspace",
                        badgeText = "Offline",
                        isError = false
                    )
                }
            }

        } catch (e: Exception) {
            Log.e(TAG, "Network error saving bookmark: ${e.message}", e)
            showDynamicIslandNotification(
                context = context,
                title = "Saved Offline",
                message = "$displayTitle • Will sync when you open Mindspace",
                badgeText = "Offline",
                isError = false
            )
        } finally {
            connection?.disconnect()
        }
    }

    private fun showDynamicIslandNotification(
        context: Context,
        title: String,
        message: String,
        badgeText: String,
        isError: Boolean
    ) {
        createNotificationChannel(context)

        // Launch Mindspace app when the user taps on the capsule/banner
        val launchIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            (System.currentTimeMillis() % 10000).toInt(),
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Create Custom RemoteViews Dynamic Island Capsule layout
        val remoteViews = RemoteViews(context.packageName, R.layout.notification_dynamic_island).apply {
            setTextViewText(R.id.island_title, title)
            setTextViewText(R.id.island_subtitle, message)
            setTextViewText(R.id.island_badge, badgeText)
            if (isError) {
                setImageViewResource(R.id.island_icon, R.drawable.ic_error_circle)
                setTextColor(R.id.island_badge, Color.parseColor("#f59e0b"))
            } else {
                setImageViewResource(R.id.island_icon, R.drawable.ic_check_circle)
                setTextColor(R.id.island_badge, Color.parseColor("#10b981"))
            }
        }

        // Build high-priority Heads-up / Dynamic Island capsule notification
        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.DecoratedCustomViewStyle())
            .setCustomContentView(remoteViews)
            .setCustomHeadsUpContentView(remoteViews)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_STATUS)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setDefaults(NotificationCompat.DEFAULT_ALL)

        val notificationManager = NotificationManagerCompat.from(context)
        try {
            notificationManager.notify((System.currentTimeMillis() % 100000).toInt(), builder.build())
            Log.d(TAG, "Dynamic Island Notification posted: $title - $message")
        } catch (se: SecurityException) {
            Log.e(TAG, "SecurityException posting notification: ${se.message}")
        }
    }

    private fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = context.getSystemService(NotificationManager::class.java) ?: return
            val existing = notificationManager.getNotificationChannel(CHANNEL_ID)
            if (existing == null) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "Mindspace Saves",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Dynamic Island and heads-up banner confirmations for saved links"
                    enableVibration(true)
                    vibrationPattern = longArrayOf(0, 100, 50, 150)
                    enableLights(true)
                    setShowBadge(true)
                    lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
                    val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                    val audioAttributes = AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                    setSound(soundUri, audioAttributes)
                }
                notificationManager.createNotificationChannel(channel)
            }
        }
    }
}
