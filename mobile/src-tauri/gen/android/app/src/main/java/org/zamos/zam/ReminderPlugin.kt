package org.zamos.zam

import android.Manifest
import android.app.Activity
import android.content.Context
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequest
import androidx.work.WorkManager
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.Permission
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.Plugin
import java.util.concurrent.TimeUnit

@InvokeArg
class ReminderScheduleArgs {
  var enabled: Boolean = false
  var initialDelayMs: Long = 0
}

@InvokeArg
class ReminderDueArgs {
  var count: Int = 0
}

@TauriPlugin(
  permissions = [
    Permission(strings = [Manifest.permission.POST_NOTIFICATIONS], alias = "notifications"),
  ],
)
class ReminderPlugin(private val activity: Activity) : Plugin(activity) {
  private val preferences = activity.getSharedPreferences(
    ReminderStore.PREFS,
    Context.MODE_PRIVATE,
  )

  @Command
  fun schedule(invoke: Invoke) {
    val args = invoke.parseArgs(ReminderScheduleArgs::class.java)
    val workManager = WorkManager.getInstance(activity.applicationContext)
    if (!args.enabled) {
      workManager.cancelUniqueWork(UNIQUE_WORK)
      invoke.resolve()
      return
    }
    val request = PeriodicWorkRequest.Builder(
      DueReminderWorker::class.java,
      24,
      TimeUnit.HOURS,
    )
      .setInitialDelay(args.initialDelayMs.coerceAtLeast(0), TimeUnit.MILLISECONDS)
      .build()
    workManager.enqueueUniquePeriodicWork(
      UNIQUE_WORK,
      ExistingPeriodicWorkPolicy.UPDATE,
      request,
    )
    invoke.resolve()
  }

  @Command
  fun updateDueCount(invoke: Invoke) {
    val args = invoke.parseArgs(ReminderDueArgs::class.java)
    preferences.edit()
      .putInt(ReminderStore.KEY_DUE_COUNT, args.count.coerceAtLeast(0))
      .commit()
    invoke.resolve()
  }

  companion object {
    const val UNIQUE_WORK = "zam-due-reminder"
  }
}

/** Shared preference names for the reminder due count, read by the worker. */
object ReminderStore {
  const val PREFS = "zam_reminder"
  const val KEY_DUE_COUNT = "due_count"
}
