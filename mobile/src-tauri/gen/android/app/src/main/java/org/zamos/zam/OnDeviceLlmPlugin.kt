package org.zamos.zam

import android.app.Activity
import android.util.Log
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import com.google.mlkit.genai.common.DownloadStatus
import com.google.mlkit.genai.common.FeatureStatus
import com.google.mlkit.genai.prompt.Generation
import com.google.mlkit.genai.prompt.GenerativeModel
import com.google.mlkit.genai.prompt.TextPart
import com.google.mlkit.genai.prompt.generateContentRequest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout
import kotlinx.coroutines.flow.first

@InvokeArg
class OnDeviceGenerateArgs {
  lateinit var prompt: String
  var maxOutputTokens: Int = 512
  var temperature: Float = 0.2f
}

/**
 * Gemini Nano (AICore) bridge for offline recall evaluation.
 *
 * Inference is routed by AICore onto the device NPU/TPU when available
 * (Pixel 9 Tensor). No audio or secrets leave the device through this path.
 */
@TauriPlugin
class OnDeviceLlmPlugin(private val activity: Activity) : Plugin(activity) {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
  private val model: GenerativeModel by lazy { Generation.getClient() }

  @Command
  fun checkStatus(invoke: Invoke) {
    scope.launch {
      try {
        val status = model.checkStatus()
        invoke.resolve(statusResult(status))
      } catch (error: Exception) {
        Log.w(TAG, "checkStatus failed", error)
        invoke.reject(error.message ?: "on-device model status check failed")
      }
    }
  }

  @Command
  fun ensureReady(invoke: Invoke) {
    scope.launch {
      try {
        ensureModelReady()
        invoke.resolve(statusResult(FeatureStatus.AVAILABLE))
      } catch (error: Exception) {
        Log.w(TAG, "ensureReady failed", error)
        invoke.reject(error.message ?: "on-device model prepare failed")
      }
    }
  }

  @Command
  fun generate(invoke: Invoke) {
    val args = invoke.parseArgs(OnDeviceGenerateArgs::class.java)
    val prompt = args.prompt.trim()
    if (prompt.isEmpty() || prompt.length > 12_000) {
      invoke.reject("prompt must be between 1 and 12000 characters")
      return
    }
    scope.launch {
      try {
        ensureModelReady()
        // Gemini Nano Prompt API rejects values outside 1..256.
        val maxTokens = args.maxOutputTokens.coerceIn(1, 256)
        val temperature = args.temperature.coerceIn(0f, 1f)
        val request = generateContentRequest(TextPart(prompt)) {
          this.temperature = temperature
          this.maxOutputTokens = maxTokens
          candidateCount = 1
        }
        val response = withTimeout(45_000) {
          model.generateContent(request)
        }
        val text = response.candidates
          .asSequence()
          .mapNotNull { candidate -> candidate.text?.trim() }
          .firstOrNull { it.isNotEmpty() }
          ?: throw IllegalStateException("on-device model returned empty text")

        val result = JSObject()
        result.put("text", text)
        result.put("backend", "gemini-nano")
        invoke.resolve(result)
      } catch (error: Exception) {
        Log.w(TAG, "generate failed", error)
        invoke.reject(error.message ?: "on-device generation failed")
      }
    }
  }

  private suspend fun ensureModelReady() {
    when (val status = model.checkStatus()) {
      FeatureStatus.AVAILABLE -> return
      FeatureStatus.DOWNLOADABLE, FeatureStatus.DOWNLOADING -> {
        withTimeout(10 * 60 * 1000L) {
          val terminal = model.download().first { download ->
            download is DownloadStatus.DownloadCompleted ||
              download is DownloadStatus.DownloadFailed
          }
          if (terminal is DownloadStatus.DownloadFailed) {
            throw IllegalStateException(
              terminal.e.message ?: "Gemini Nano download failed",
            )
          }
        }
        if (model.checkStatus() != FeatureStatus.AVAILABLE) {
          throw IllegalStateException("Gemini Nano download did not complete")
        }
      }
      FeatureStatus.UNAVAILABLE -> {
        throw IllegalStateException("Gemini Nano is unavailable on this device")
      }
      else -> {
        throw IllegalStateException(
          "Gemini Nano status is unsupported: ${featureStatusName(status)}",
        )
      }
    }
  }

  private fun statusResult(status: Int): JSObject {
    val result = JSObject()
    result.put("status", featureStatusName(status))
    result.put("available", status == FeatureStatus.AVAILABLE)
    result.put("downloadable", status == FeatureStatus.DOWNLOADABLE)
    return result
  }

  private fun featureStatusName(status: Int): String {
    return when (status) {
      FeatureStatus.AVAILABLE -> "available"
      FeatureStatus.DOWNLOADABLE -> "downloadable"
      FeatureStatus.DOWNLOADING -> "downloading"
      FeatureStatus.UNAVAILABLE -> "unavailable"
      else -> "unknown"
    }
  }

  companion object {
    private const val TAG = "ZamOnDeviceLlm"
  }
}
