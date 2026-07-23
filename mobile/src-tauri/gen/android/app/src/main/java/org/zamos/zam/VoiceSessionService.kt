package org.zamos.zam

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.IBinder
import android.os.PowerManager

class VoiceSessionService : Service() {
  private var wakeLock: PowerManager.WakeLock? = null

  override fun onCreate() {
    super.onCreate()
    val notificationManager = getSystemService(NotificationManager::class.java)
    notificationManager.createNotificationChannel(
      NotificationChannel(
        CHANNEL_ID,
        getString(R.string.voice_notification_channel),
        NotificationManager.IMPORTANCE_LOW,
      ),
    )
    val openApp = PendingIntent.getActivity(
      this,
      0,
      Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    val notification = Notification.Builder(this, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_stat_voice)
      .setContentTitle(getString(R.string.voice_notification_title))
      .setContentText(getString(R.string.voice_notification_text))
      .setContentIntent(openApp)
      .setCategory(Notification.CATEGORY_SERVICE)
      .setOngoing(true)
      .build()
    startForeground(
      NOTIFICATION_ID,
      notification,
      ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or
        ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK,
    )
    val powerManager = getSystemService(PowerManager::class.java)
    wakeLock = powerManager.newWakeLock(
      PowerManager.PARTIAL_WAKE_LOCK,
      "$packageName:voice-session",
    ).apply {
      setReferenceCounted(false)
      acquire(MAX_WAKE_LOCK_MS)
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_NOT_STICKY

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onDestroy() {
    wakeLock?.let { if (it.isHeld) it.release() }
    wakeLock = null
    super.onDestroy()
  }

  companion object {
    private const val CHANNEL_ID = "zam-voice-session"
    private const val NOTIFICATION_ID = 4071
    private const val MAX_WAKE_LOCK_MS = 2 * 60 * 60 * 1000L
  }
}
