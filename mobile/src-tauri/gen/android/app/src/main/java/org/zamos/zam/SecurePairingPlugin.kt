package org.zamos.zam

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import android.webkit.WebView
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

@InvokeArg
class PairingSaveArgs {
  lateinit var payload: String
}

@TauriPlugin
class SecurePairingPlugin(private val activity: Activity) : Plugin(activity) {
  private data class SharedImport(val content: String, val mimeType: String?)

  private val alias = "zam-mobile-pairing-v1"
  private val maxSharedBytes = 256_000
  private val preferences = activity.getSharedPreferences(
    "zam_secure_pairing",
    Context.MODE_PRIVATE,
  )
  private var pendingShare: SharedImport? = null
  private var pendingShareError: String? = null

  override fun load(webView: WebView) {
    captureShare(activity.intent)
  }

  override fun onNewIntent(intent: Intent) {
    captureShare(intent)
  }

  private fun readSharedUri(uri: Uri): String {
    val input = activity.contentResolver.openInputStream(uri)
      ?: error("Geteilte Datei konnte nicht geöffnet werden")
    return input.use { stream ->
      val buffer = ByteArray(8_192)
      val output = java.io.ByteArrayOutputStream()
      while (true) {
        val count = stream.read(buffer)
        if (count < 0) break
        if (output.size() + count > maxSharedBytes) {
          error("Geteilter Inhalt ist größer als 256 KB")
        }
        output.write(buffer, 0, count)
      }
      output.toString(Charsets.UTF_8.name())
    }
  }

  private fun captureShare(intent: Intent?) {
    if (intent?.action != Intent.ACTION_SEND) return
    try {
      val stream = intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
      val content = if (stream != null) {
        readSharedUri(stream)
      } else {
        intent.getCharSequenceExtra(Intent.EXTRA_TEXT)?.toString().orEmpty()
      }
      if (content.isBlank()) error("Der geteilte Inhalt ist leer")
      val byteCount = content.toByteArray(Charsets.UTF_8).size
      if (byteCount > maxSharedBytes) {
        error("Geteilter Inhalt ist größer als 256 KB")
      }
      synchronized(this) {
        pendingShare = SharedImport(content, intent.type)
        pendingShareError = null
      }
    } catch (error: Exception) {
      synchronized(this) {
        pendingShare = null
        pendingShareError = error.message ?: "Geteilter Inhalt konnte nicht gelesen werden"
      }
    }
  }

  private fun key(): SecretKey {
    val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    val existing = keyStore.getKey(alias, null)
    if (existing is SecretKey) return existing

    val generator = KeyGenerator.getInstance(
      KeyProperties.KEY_ALGORITHM_AES,
      "AndroidKeyStore",
    )
    generator.init(
      KeyGenParameterSpec.Builder(
        alias,
        KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
      )
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
        .setRandomizedEncryptionRequired(true)
        .build(),
    )
    return generator.generateKey()
  }

  @Command
  fun save(invoke: Invoke) {
    try {
      val args = invoke.parseArgs(PairingSaveArgs::class.java)
      val bytes = args.payload.toByteArray(Charsets.UTF_8)
      require(bytes.isNotEmpty() && bytes.size <= 2_000) {
        "Pairing payload must be between 1 and 2000 bytes"
      }
      val cipher = Cipher.getInstance("AES/GCM/NoPadding")
      cipher.init(Cipher.ENCRYPT_MODE, key())
      val encrypted = cipher.doFinal(bytes)
      val stored = preferences.edit()
        .putString("iv", Base64.encodeToString(cipher.iv, Base64.NO_WRAP))
        .putString("ciphertext", Base64.encodeToString(encrypted, Base64.NO_WRAP))
        .commit()
      if (!stored) error("Could not persist encrypted pairing credentials")
      invoke.resolve()
    } catch (error: Exception) {
      invoke.reject(error.message ?: "Could not encrypt pairing credentials")
    }
  }

  @Command
  fun load(invoke: Invoke) {
    try {
      val iv = preferences.getString("iv", null)
      val ciphertext = preferences.getString("ciphertext", null)
      val result = JSObject()
      if (iv == null || ciphertext == null) {
        result.put("payload", null)
        invoke.resolve(result)
        return
      }
      val cipher = Cipher.getInstance("AES/GCM/NoPadding")
      cipher.init(
        Cipher.DECRYPT_MODE,
        key(),
        GCMParameterSpec(128, Base64.decode(iv, Base64.NO_WRAP)),
      )
      val decrypted = cipher.doFinal(Base64.decode(ciphertext, Base64.NO_WRAP))
      result.put("payload", decrypted.toString(Charsets.UTF_8))
      invoke.resolve(result)
    } catch (error: Exception) {
      invoke.reject("Stored pairing credentials could not be decrypted. Pair the device again.")
    }
  }

  @Command
  fun clear(invoke: Invoke) {
    if (preferences.edit().clear().commit()) {
      invoke.resolve()
    } else {
      invoke.reject("Could not clear pairing credentials")
    }
  }

  @Command
  fun takeShared(invoke: Invoke) {
    val error: String?
    val shared: SharedImport?
    synchronized(this) {
      error = pendingShareError
      shared = pendingShare
      pendingShareError = null
      pendingShare = null
    }
    if (error != null) {
      invoke.reject(error)
      return
    }
    if (shared == null) {
      val empty = JSObject()
      empty.put("content", "")
      invoke.resolve(empty)
      return
    }
    val result = JSObject()
    result.put("content", shared.content)
    result.put("mimeType", shared.mimeType)
    invoke.resolve(result)
  }
}
