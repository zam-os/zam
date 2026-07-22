package org.zamos.zam

import android.app.Activity
import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
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
  private val alias = "zam-mobile-pairing-v1"
  private val preferences = activity.getSharedPreferences(
    "zam_secure_pairing",
    Context.MODE_PRIVATE,
  )

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
}
