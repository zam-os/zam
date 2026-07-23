package org.zamos.zam

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import org.json.JSONObject
import java.io.BufferedInputStream
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

@InvokeArg
class UpdateManifestUrlArgs {
  lateinit var url: String
}

@InvokeArg
class UpdateInstallArgs {
  lateinit var url: String
}

/**
 * Sideload update path for field-test APKs published on GitHub Releases.
 *
 * Manifest shape (mobile-latest.json):
 * { "version": "0.16.2", "versionCode": 1602, "url": "https://.../ZAM_Mobile_....apk" }
 */
@TauriPlugin
class UpdatePlugin(private val activity: Activity) : Plugin(activity) {
  private val executor = Executors.newSingleThreadExecutor()

  @Command
  fun getVersion(invoke: Invoke) {
    val result = JSObject()
    result.put("versionName", BuildConfig.VERSION_NAME)
    result.put("versionCode", BuildConfig.VERSION_CODE)
    invoke.resolve(result)
  }

  @Command
  fun check(invoke: Invoke) {
    val args = invoke.parseArgs(UpdateManifestUrlArgs::class.java)
    val manifestUrl = args.url.trim()
    if (manifestUrl.isEmpty() || !manifestUrl.startsWith("https://")) {
      invoke.reject("update manifest URL must be https")
      return
    }
    executor.execute {
      try {
        val body = httpGetText(manifestUrl)
        val json = JSONObject(body)
        val version = json.getString("version")
        val versionCode = json.optInt("versionCode", 0)
        val apkUrl = json.getString("url")
        val notes = json.optString("notes", "")
        val result = JSObject()
        result.put("version", version)
        result.put("versionCode", versionCode)
        result.put("url", apkUrl)
        result.put("notes", notes)
        result.put("currentVersionName", BuildConfig.VERSION_NAME)
        result.put("currentVersionCode", BuildConfig.VERSION_CODE)
        result.put(
          "updateAvailable",
          versionCode > BuildConfig.VERSION_CODE ||
            (versionCode == 0 && isNewerSemver(version, BuildConfig.VERSION_NAME)),
        )
        invoke.resolve(result)
      } catch (error: Exception) {
        invoke.reject(error.message ?: "update check failed")
      }
    }
  }

  @Command
  fun install(invoke: Invoke) {
    val args = invoke.parseArgs(UpdateInstallArgs::class.java)
    val apkUrl = args.url.trim()
    if (apkUrl.isEmpty() || !apkUrl.startsWith("https://")) {
      invoke.reject("APK URL must be https")
      return
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
      !activity.packageManager.canRequestPackageInstalls()
    ) {
      // Ask the learner to allow installs from this app, then retry.
      val intent = Intent(
        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
        Uri.parse("package:${activity.packageName}"),
      )
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      activity.startActivity(intent)
      invoke.reject("Bitte Installation aus unbekannten Quellen für ZAM erlauben und erneut versuchen")
      return
    }
    executor.execute {
      try {
        val apk = downloadApk(apkUrl)
        activity.runOnUiThread {
          try {
            val uri = FileProvider.getUriForFile(
              activity,
              "${activity.packageName}.fileprovider",
              apk,
            )
            val intent = Intent(Intent.ACTION_VIEW).apply {
              setDataAndType(uri, "application/vnd.android.package-archive")
              addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
              addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            activity.startActivity(intent)
            val result = JSObject()
            result.put("started", true)
            invoke.resolve(result)
          } catch (error: Exception) {
            invoke.reject(error.message ?: "APK-Installation konnte nicht gestartet werden")
          }
        }
      } catch (error: Exception) {
        invoke.reject(error.message ?: "APK-Download fehlgeschlagen")
      }
    }
  }

  private fun downloadApk(apkUrl: String): File {
    val dir = File(activity.cacheDir, "updates").apply { mkdirs() }
    val target = File(dir, "zam-mobile-update.apk")
    if (target.exists()) target.delete()
    val connection = (URL(apkUrl).openConnection() as HttpURLConnection).apply {
      connectTimeout = 30_000
      readTimeout = 120_000
      instanceFollowRedirects = true
      requestMethod = "GET"
    }
    connection.connect()
    if (connection.responseCode !in 200..299) {
      throw IllegalStateException("APK download HTTP ${connection.responseCode}")
    }
    BufferedInputStream(connection.inputStream).use { input ->
      FileOutputStream(target).use { output ->
        input.copyTo(output)
      }
    }
    connection.disconnect()
    if (target.length() < 1_000_000L) {
      throw IllegalStateException("Downloaded APK is suspiciously small")
    }
    return target
  }

  private fun httpGetText(url: String): String {
    val connection = (URL(url).openConnection() as HttpURLConnection).apply {
      connectTimeout = 15_000
      readTimeout = 15_000
      instanceFollowRedirects = true
      requestMethod = "GET"
      setRequestProperty("Accept", "application/json")
    }
    connection.connect()
    if (connection.responseCode !in 200..299) {
      throw IllegalStateException("Update check HTTP ${connection.responseCode}")
    }
    val text = connection.inputStream.bufferedReader().use { it.readText() }
    connection.disconnect()
    return text
  }

  companion object {
    /** Compare dotted semver strings; returns true when remote > current. */
    fun isNewerSemver(remote: String, current: String): Boolean {
      val r = remote.trim().removePrefix("v").split('.').mapNotNull { it.toIntOrNull() }
      val c = current.trim().removePrefix("v").split('.').mapNotNull { it.toIntOrNull() }
      val len = maxOf(r.size, c.size)
      for (i in 0 until len) {
        val rv = r.getOrElse(i) { 0 }
        val cv = c.getOrElse(i) { 0 }
        if (rv != cv) return rv > cv
      }
      return false
    }
  }
}
