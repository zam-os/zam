#!/usr/bin/env bash
# Seed a Bitwarden vault with ZAM test secrets and run a real-bw E2E against
# an isolated HOME. Requires: bw on PATH, logged-in + unlocked vault.
#
# Usage:
#   bw login                          # once
#   export BW_SESSION="$(bw unlock --raw)"
#   ./scripts/e2e-bitwarden-vault.sh
#
# Optional env:
#   ZAM_E2E_TURSO_URL   — default libsql://e2e-placeholder.turso.io
#   ZAM_E2E_TURSO_TOKEN — secret stored in vault (random if unset)
#   ZAM_E2E_API_KEY     — secret stored in vault (random if unset)
#   BW_SESSION          — required unlocked session

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLI_JS="$ROOT/dist/cli/index.js"
export PATH="${HOME}/.local/bin:/Users/thomas/.hermes/node/bin:${PATH:-}"

if ! command -v bw >/dev/null 2>&1; then
  echo "bw not found. Install: npm install -g @bitwarden/cli" >&2
  echo "and ensure the global npm bin dir is on PATH." >&2
  exit 1
fi

if [[ ! -f "$CLI_JS" ]]; then
  echo "Built CLI missing at $CLI_JS — run: npm run build" >&2
  exit 1
fi

STATUS_JSON="$(bw status 2>/dev/null || true)"
STATUS="$(printf '%s' "$STATUS_JSON" | node -e '
  let s=""; process.stdin.on("data",d=>s+=d); process.stdin.on("end",()=>{
    try { console.log(JSON.parse(s).status || "unknown"); }
    catch { console.log("unknown"); }
  });
')"

if [[ "$STATUS" == "unauthenticated" ]]; then
  echo "Not logged in. Create a free account at https://vault.bitwarden.com/#/register" >&2
  echo "then run:" >&2
  echo "  bw login" >&2
  echo "  export BW_SESSION=\"\$(bw unlock --raw)\"" >&2
  echo "  $0" >&2
  exit 1
fi

if [[ "$STATUS" == "locked" || -z "${BW_SESSION:-}" ]]; then
  if [[ -z "${BW_SESSION:-}" ]]; then
    echo "Vault is locked and BW_SESSION is unset." >&2
    echo "Run:  export BW_SESSION=\"\$(bw unlock --raw)\"" >&2
    exit 1
  fi
fi

# Confirm session works
if ! bw sync --session "$BW_SESSION" >/dev/null 2>&1; then
  echo "BW_SESSION is invalid or expired. Re-run: export BW_SESSION=\"\$(bw unlock --raw)\"" >&2
  exit 1
fi

TURSO_URL="${ZAM_E2E_TURSO_URL:-libsql://e2e-placeholder.turso.io}"
TURSO_TOKEN="${ZAM_E2E_TURSO_TOKEN:-$(openssl rand -hex 24)}"
API_KEY="${ZAM_E2E_API_KEY:-sk-e2e-$(openssl rand -hex 16)}"

echo "==> Seeding Bitwarden items (zam-turso, zam-openrouter)…"

# Create or update a login item with a custom field via bw encode | create.
# Uses name search; deletes existing e2e items first so the run is idempotent.
delete_item_if_exists() {
  local name="$1"
  local id
  id="$(bw list items --search "$name" --session "$BW_SESSION" \
    | node -e '
      let s=""; process.stdin.on("data",d=>s+=d); process.stdin.on("end",()=>{
        const items = JSON.parse(s || "[]");
        const hit = items.find(i => i.name === process.argv[1]);
        if (hit) process.stdout.write(hit.id);
      });
    ' "$name")"
  if [[ -n "$id" ]]; then
    bw delete item "$id" --session "$BW_SESSION" >/dev/null
    echo "    deleted existing item: $name"
  fi
}

create_item() {
  local name="$1"
  local password="$2"
  local field_name="$3"
  local field_value="$4"
  local payload
  payload="$(node -e '
    const [name, password, fieldName, fieldValue] = process.argv.slice(1);
    const item = {
      type: 1,
      name,
      notes: "ZAM E2E seed — safe to delete",
      login: {
        username: "zam-e2e",
        password,
        totp: null,
        uris: [],
      },
      fields: [
        { name: fieldName, value: fieldValue, type: 0 },
      ],
      favorite: false,
      reprompt: 0,
    };
    process.stdout.write(JSON.stringify(item));
  ' "$name" "$password" "$field_name" "$field_value" | bw encode)"
  bw create item "$payload" --session "$BW_SESSION" >/dev/null
  echo "    created: $name (field $field_name)"
}

delete_item_if_exists "zam-turso"
delete_item_if_exists "zam-openrouter"
create_item "zam-turso" "$TURSO_TOKEN" "token" "$TURSO_TOKEN"
create_item "zam-openrouter" "unused" "apiKey" "$API_KEY"
bw sync --session "$BW_SESSION" >/dev/null

echo "==> Verifying bw get item resolves custom fields…"
BW_GET_TOKEN="$(bw get item zam-turso --session "$BW_SESSION" \
  | node -e '
    let s=""; process.stdin.on("data",d=>s+=d); process.stdin.on("end",()=>{
      const item = JSON.parse(s);
      const f = (item.fields || []).find(x => x.name === "token");
      if (!f || !f.value) { console.error("token field missing"); process.exit(1); }
      process.stdout.write(f.value);
    });
  ')"
BW_GET_KEY="$(bw get item zam-openrouter --session "$BW_SESSION" \
  | node -e '
    let s=""; process.stdin.on("data",d=>s+=d); process.stdin.on("end",()=>{
      const item = JSON.parse(s);
      const f = (item.fields || []).find(x => x.name === "apiKey");
      if (!f || !f.value) { console.error("apiKey field missing"); process.exit(1); }
      process.stdout.write(f.value);
    });
  ')"
if [[ "$BW_GET_TOKEN" != "$TURSO_TOKEN" || "$BW_GET_KEY" != "$API_KEY" ]]; then
  echo "FAIL: vault round-trip mismatch" >&2
  exit 1
fi
echo "    bw item fields OK"

# Isolated ZAM home so we never touch the learner's real credentials.json
TMP="$(mktemp -d "${TMPDIR:-/tmp}/zam-bw-e2e.XXXXXX")"
E2E_HOME="$TMP/home"
mkdir -p "$E2E_HOME"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

echo "==> Running ZAM against real bw (HOME=$E2E_HOME)…"
export HOME="$E2E_HOME"
export USERPROFILE="$E2E_HOME"
# BW_SESSION must remain set so bw can unlock without prompts.
# Session key is never written to credentials.json.

echo "--- provider set-key --key-from ---"
node "$CLI_JS" provider set-key openrouter --key-from bw://zam-openrouter/apiKey

echo "--- write turso ref into credentials.json ---"
node -e '
  const fs = require("fs");
  const path = require("path");
  const p = path.join(process.env.HOME, ".zam", "credentials.json");
  const cur = JSON.parse(fs.readFileSync(p, "utf8"));
  cur.turso = {
    url: process.argv[1],
    token: { "$secret": "bw://zam-turso/token" },
    mode: "remote",
  };
  fs.writeFileSync(p, JSON.stringify(cur, null, 2) + "\n", { mode: 0o600 });
' "$TURSO_URL"

echo "--- credentials check ---"
node "$CLI_JS" credentials check
CHECK_JSON="$(node "$CLI_JS" credentials check --json)"
echo "$CHECK_JSON"

# Assert both refs ok and secrets never appear in CLI output or on disk
DISK="$(cat "$E2E_HOME/.zam/credentials.json")"
if printf '%s\n%s\n' "$CHECK_JSON" "$DISK" | grep -Fq "$TURSO_TOKEN"; then
  echo "FAIL: turso token leaked into check output or disk" >&2
  exit 1
fi
if printf '%s\n%s\n' "$CHECK_JSON" "$DISK" | grep -Fq "$API_KEY"; then
  echo "FAIL: api key leaked into check output or disk" >&2
  exit 1
fi

echo "$CHECK_JSON" | node -e '
  let s=""; process.stdin.on("data",d=>s+=d); process.stdin.on("end",()=>{
    const report = JSON.parse(s);
    const by = Object.fromEntries(report.credentials.map(c => [c.field, c]));
    for (const field of ["turso.token", "llmProviders.openrouter.apiKey"]) {
      const e = by[field];
      if (!e || !e.ok || e.kind !== "reference") {
        console.error("FAIL: expected ok reference for", field, e);
        process.exit(1);
      }
    }
    console.log("==> E2E PASS: real Bitwarden vault resolved both refs; secrets stayed out of disk/output");
  });
'
