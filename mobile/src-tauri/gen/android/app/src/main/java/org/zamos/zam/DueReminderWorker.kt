package org.zamos.zam

import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.work.Worker
import androidx.work.WorkerParameters

/**
 * Posts the daily due-card reminder from the last count the app stored. No
 * stored count, an empty queue, or disabled notifications means no
 * notification — the reminder never nags (FR-5, no gamification).
 */
class DueReminderWorker(
  context: Context,
  params: WorkerParameters,
) : Worker(context, params) {
  @SuppressLint("MissingPermission")
  override fun doWork(): Result {
    val context = applicationContext
    val dueCount = context
      .getSharedPreferences(ReminderStore.PREFS, Context.MODE_PRIVATE)
      .getInt(ReminderStore.KEY_DUE_COUNT, 0)
    if (dueCount <= 0) return Result.success()

    val manager = NotificationManagerCompat.from(context)
    if (!manager.areNotificationsEnabled()) return Result.success()

    ensureChannel(context)

    val text = if (dueCount == 1) "1 Karte ist fällig" else "$dueCount Karten sind fällig"
    val builder = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_stat_reminder)
      .setContentTitle("ZAM")
      .setContentText(text)
      .setAutoCancel(true)
      .setPriority(NotificationCompat.PRIORITY_DEFAULT)

    context.packageManager.getLaunchIntentForPackage(context.packageName)?.let { launch ->
      builder.setContentIntent(
        PendingIntent.getActivity(
          context,
          0,
          launch,
          PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        ),
      )
    }

    return try {
      manager.notify(NOTIFICATION_ID, builder.build())
      Result.success()
    } catch (_: SecurityException) {
      // POST_NOTIFICATIONS revoked between the check and notify.
      Result.success()
    }
  }

  private fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val channel = NotificationChannel(
      CHANNEL_ID,
      "Fällige Wiederholungen",
      NotificationManager.IMPORTANCE_DEFAULT,
    ).apply { description = "Tägliche Erinnerung an fällige Karten" }
    context.getSystemService(NotificationManager::class.java)
      ?.createNotificationChannel(channel)
  }

  companion object {
    const val CHANNEL_ID = "zam-due-reminder"
    const val NOTIFICATION_ID = 4201
  }
}
