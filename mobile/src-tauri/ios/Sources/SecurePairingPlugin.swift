// iOS counterpart of SecurePairingPlugin.kt.
//
// Android wraps the pairing payload in an AES-GCM envelope whose key lives in
// the Android Keystore, because SharedPreferences is otherwise plaintext. iOS
// needs no envelope of its own: the Keychain is already hardware-backed
// storage, so the payload goes in directly and the class-level accessibility
// attribute carries the same guarantee.
//
// The command names and payload shapes are fixed by src/secure_store.rs —
// `save`, `load`, `clear`, `takeShared`. Change all three together (Rust
// bridge, this file, ReminderPlugin.kt's sibling) or pairing breaks silently.

import Foundation
import Security
import Tauri
import UIKit
import WebKit

private let service = "org.zamos.zam.pairing"
private let account = "pairing"

/// Upper bound mirrored from `pairing_save` in src/secure_store.rs. The Rust
/// side already rejects oversized payloads; this is defence in depth for the
/// case where the bridge is called from elsewhere.
private let maxPayloadBytes = 2_000

struct SavePayloadArgs: Decodable {
  let payload: String
}

class SecurePairingPlugin: Plugin {
  @objc public func save(_ invoke: Invoke) throws {
    let args = try invoke.parseArgs(SavePayloadArgs.self)
    let data = Data(args.payload.utf8)
    guard !data.isEmpty, data.count <= maxPayloadBytes else {
      invoke.reject("pairing payload must be between 1 and \(maxPayloadBytes) bytes")
      return
    }

    // Overwrite semantics: the Android plugin replaces whatever was stored, and
    // SecItemAdd would fail with errSecDuplicateItem otherwise.
    SecItemDelete(baseQuery() as CFDictionary)

    var attributes = baseQuery()
    attributes[kSecValueData as String] = data
    // The pairing payload is only ever needed while the learner is using the
    // device, and must never migrate to another device via an encrypted
    // backup — it carries a live database token.
    attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly

    let status = SecItemAdd(attributes as CFDictionary, nil)
    guard status == errSecSuccess else {
      invoke.reject("keychain write failed (OSStatus \(status))")
      return
    }
    invoke.resolve()
  }

  @objc public func load(_ invoke: Invoke) throws {
    var query = baseQuery()
    query[kSecReturnData as String] = true
    query[kSecMatchLimit as String] = kSecMatchLimitOne

    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)

    switch status {
    case errSecSuccess:
      guard let data = item as? Data, let payload = String(data: data, encoding: .utf8) else {
        // Unreadable entry is treated as absent so first-run pairing can recover
        // instead of dead-ending on a corrupt keychain item.
        invoke.resolve(["payload": nil])
        return
      }
      invoke.resolve(["payload": payload])
    case errSecItemNotFound:
      invoke.resolve(["payload": nil])
    default:
      invoke.reject("keychain read failed (OSStatus \(status))")
    }
  }

  @objc public func clear(_ invoke: Invoke) throws {
    let status = SecItemDelete(baseQuery() as CFDictionary)
    // Clearing an already-empty store is a success, matching the Android plugin.
    guard status == errSecSuccess || status == errSecItemNotFound else {
      invoke.reject("keychain delete failed (OSStatus \(status))")
      return
    }
    invoke.resolve()
  }

  /// Android receives shared text through an ACTION_SEND intent. The iOS
  /// equivalent is a Share Extension, which is a separate bundle target and is
  /// deliberately out of scope for the first iPad increment — quick capture
  /// from a share sheet is Android-only for now. Resolving null (rather than
  /// rejecting) keeps `shared_import_take` returning `Ok(None)`, which the
  /// WebView already treats as "nothing shared".
  @objc public func takeShared(_ invoke: Invoke) throws {
    invoke.resolve()
  }

  private func baseQuery() -> [String: Any] {
    [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: account,
    ]
  }
}

@_cdecl("init_plugin_secure_pairing")
func initPluginSecurePairing() -> Plugin {
  return SecurePairingPlugin()
}
