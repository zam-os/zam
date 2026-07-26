// iOS counterpart of ReminderPlugin.kt / DueReminderWorker.kt.
//
// Android schedules a WorkManager job that wakes up, reads the last stored due
// count, and posts a notification. iOS has no equivalent background worker for
// this: an app that is not running cannot compute anything at fire time. So the
// notification content is baked in when it is scheduled, and refreshed whenever
// the WebView reports a new due count via `updateDueCount`.
//
// Consequence, recorded in ADR 2026-07-26: the iOS reminder shows the due count
// as of the last time the app was open, not as of the moment it fires. For a
// daily study reminder that is accurate enough — the count only grows while the
// app is closed, so the reminder understates rather than nags falsely.
//
// Command names and payload shapes are fixed by src/reminder.rs.

import Foundation
import Tauri
import UIKit
import UserNotifications
import WebKit

private let requestIdentifier = "zam-due-reminder"
private let dueCountKey = "zam_reminder_due_count"
private let reminderHourKey = "zam_reminder_hour"
private let reminderMinuteKey = "zam_reminder_minute"

struct SchedulePayloadArgs: Decodable {
  let enabled: Bool
  let initialDelayMs: Int64
}

struct DuePayloadArgs: Decodable {
  let count: Int64
}

class ReminderPlugin: Plugin {
  @objc public override func checkPermissions(_ invoke: Invoke) {
    UNUserNotificationCenter.current().getNotificationSettings { settings in
      invoke.resolve(["notifications": Self.permissionState(from: settings.authorizationStatus)])
    }
  }

  @objc public override func requestPermissions(_ invoke: Invoke) {
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) {
      _, error in
      if let error = error {
        invoke.reject("notification authorization failed: \(error.localizedDescription)")
        return
      }
      // Re-read rather than trusting the granted flag: the user may have
      // allowed a provisional or time-sensitive-only variant.
      UNUserNotificationCenter.current().getNotificationSettings { settings in
        invoke.resolve(["notifications": Self.permissionState(from: settings.authorizationStatus)])
      }
    }
  }

  /// `initialDelayMs` is the wait until the next configured local reminder time,
  /// computed in the WebView so both platforms share one clock. Android feeds it
  /// to WorkManager as an initial delay; here it is converted back into a
  /// wall-clock hour/minute and used for a repeating calendar trigger. A
  /// repeating *interval* trigger would drift across DST, a calendar one does not.
  @objc public func schedule(_ invoke: Invoke) throws {
    let args = try invoke.parseArgs(SchedulePayloadArgs.self)
    let center = UNUserNotificationCenter.current()

    guard args.enabled else {
      center.removePendingNotificationRequests(withIdentifiers: [requestIdentifier])
      UserDefaults.standard.removeObject(forKey: reminderHourKey)
      UserDefaults.standard.removeObject(forKey: reminderMinuteKey)
      invoke.resolve()
      return
    }

    let fireDate = Date().addingTimeInterval(TimeInterval(max(args.initialDelayMs, 0)) / 1000.0)
    let parts = Calendar.current.dateComponents([.hour, .minute], from: fireDate)
    guard let hour = parts.hour, let minute = parts.minute else {
      invoke.reject("could not derive a reminder time from initialDelayMs")
      return
    }

    UserDefaults.standard.set(hour, forKey: reminderHourKey)
    UserDefaults.standard.set(minute, forKey: reminderMinuteKey)

    reschedule(hour: hour, minute: minute) { error in
      if let error = error {
        invoke.reject("could not schedule reminder: \(error.localizedDescription)")
      } else {
        invoke.resolve()
      }
    }
  }

  /// Stores the latest due count and refreshes the pending notification so its
  /// body matches. Mirrors ReminderStore.KEY_DUE_COUNT on Android.
  @objc public func updateDueCount(_ invoke: Invoke) throws {
    let args = try invoke.parseArgs(DuePayloadArgs.self)
    let count = max(args.count, 0)
    UserDefaults.standard.set(Int(count), forKey: dueCountKey)

    let defaults = UserDefaults.standard
    guard
      defaults.object(forKey: reminderHourKey) != nil,
      defaults.object(forKey: reminderMinuteKey) != nil
    else {
      // Reminders are off; nothing pending to refresh.
      invoke.resolve()
      return
    }

    reschedule(
      hour: defaults.integer(forKey: reminderHourKey),
      minute: defaults.integer(forKey: reminderMinuteKey)
    ) { _ in
      // A failed refresh must not fail the review loop that triggered it; the
      // stored count is already updated and the next schedule() call recovers.
      invoke.resolve()
    }
  }

  private func reschedule(hour: Int, minute: Int, completion: @escaping (Error?) -> Void) {
    let center = UNUserNotificationCenter.current()
    center.removePendingNotificationRequests(withIdentifiers: [requestIdentifier])

    let dueCount = UserDefaults.standard.integer(forKey: dueCountKey)
    // Matches DueReminderWorker.kt: no notification when nothing is due.
    guard dueCount > 0 else {
      completion(nil)
      return
    }

    let content = UNMutableNotificationContent()
    content.title = "ZAM"
    // Same German strings as DueReminderWorker.kt — keep the two in sync.
    content.body = dueCount == 1 ? "1 Karte ist fällig" : "\(dueCount) Karten sind fällig"
    content.sound = .default
    content.badge = NSNumber(value: dueCount)

    var components = DateComponents()
    components.hour = hour
    components.minute = minute

    let request = UNNotificationRequest(
      identifier: requestIdentifier,
      content: content,
      trigger: UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
    )
    center.add(request) { error in completion(error) }
  }

  private static func permissionState(from status: UNAuthorizationStatus) -> String {
    switch status {
    case .authorized, .provisional, .ephemeral:
      return "granted"
    case .denied:
      return "denied"
    case .notDetermined:
      return "prompt"
    @unknown default:
      return "denied"
    }
  }
}

@_cdecl("init_plugin_reminder")
func initPluginReminder() -> Plugin {
  return ReminderPlugin()
}
