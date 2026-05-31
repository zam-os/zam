/**
 * Shell hook code generation for zsh, bash, and PowerShell.
 *
 * Pure functions that return shell code strings. The CLI command
 * `zam monitor start/stop` calls these and prints to stdout.
 */

function psSingleQuoted(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Generate zsh hooks that capture commands to a JSONL file.
 * Uses $EPOCHREALTIME for sub-second timestamp precision.
 */
export function generateZshHooks(
  monitorFile: string,
  sessionId: string,
): string {
  return `
# ZAM monitor hooks for session ${sessionId}
export __ZAM_MONITOR_FILE="${monitorFile}"
export __ZAM_MONITOR_SEQ=0
export __ZAM_MONITOR_SESSION="${sessionId}"

__zam_ts() {
  if [[ -n "\${EPOCHREALTIME:-}" ]]; then
    local sec="\${EPOCHREALTIME%%.*}"
    local frac="\${EPOCHREALTIME##*.}"
    frac="\${frac:0:3}"
    printf '%s.%sZ' "$(date -u -r "$sec" '+%Y-%m-%dT%H:%M:%S' 2>/dev/null || date -u '+%Y-%m-%dT%H:%M:%S')" "$frac"
  else
    date -u '+%Y-%m-%dT%H:%M:%SZ'
  fi
}

__zam_preexec() {
  (( __ZAM_MONITOR_SEQ++ ))
  local cmd="\${1//\\"/\\\\\\"}"
  local cwd="\${PWD//\\"/\\\\\\"}"
  local ts="$(__zam_ts)"
  printf '{"type":"command_start","ts":"%s","command":"%s","cwd":"%s","seq":%d,"pid":%d}\\n' \\
    "$ts" "$cmd" "$cwd" "$__ZAM_MONITOR_SEQ" "$$" \\
    >> "$__ZAM_MONITOR_FILE"
}

__zam_precmd() {
  local exit_code=$?
  [[ $__ZAM_MONITOR_SEQ -eq 0 ]] && return
  local ts="$(__zam_ts)"
  printf '{"type":"command_end","ts":"%s","exit_code":%d,"seq":%d,"pid":%d}\\n' \\
    "$ts" "$exit_code" "$__ZAM_MONITOR_SEQ" "$$" \\
    >> "$__ZAM_MONITOR_FILE"
}

autoload -Uz add-zsh-hook
add-zsh-hook preexec __zam_preexec
add-zsh-hook precmd __zam_precmd

echo "ZAM monitor active for session $__ZAM_MONITOR_SESSION"
`.trim();
}

/**
 * Generate bash hooks that capture commands to a JSONL file.
 * Uses DEBUG trap for preexec, PROMPT_COMMAND for precmd.
 */
export function generateBashHooks(
  monitorFile: string,
  sessionId: string,
): string {
  return `
# ZAM monitor hooks for session ${sessionId}
export __ZAM_MONITOR_FILE="${monitorFile}"
export __ZAM_MONITOR_SEQ=0
export __ZAM_MONITOR_SESSION="${sessionId}"
export __ZAM_MONITOR_CMD_ACTIVE=0

__zam_ts() {
  date -u '+%Y-%m-%dT%H:%M:%SZ'
}

__zam_debug_trap() {
  [[ "$__ZAM_MONITOR_CMD_ACTIVE" -eq 1 ]] && return
  __ZAM_MONITOR_CMD_ACTIVE=1
  (( __ZAM_MONITOR_SEQ++ ))
  local cmd="\${BASH_COMMAND//\\"/\\\\\\"}"
  local cwd="\${PWD//\\"/\\\\\\"}"
  local ts="$(__zam_ts)"
  printf '{"type":"command_start","ts":"%s","command":"%s","cwd":"%s","seq":%d,"pid":%d}\\n' \\
    "$ts" "$cmd" "$cwd" "$__ZAM_MONITOR_SEQ" "$$" \\
    >> "$__ZAM_MONITOR_FILE"
}

__zam_prompt_cmd() {
  local exit_code=$?
  if [[ "$__ZAM_MONITOR_CMD_ACTIVE" -eq 1 ]]; then
    __ZAM_MONITOR_CMD_ACTIVE=0
    local ts="$(__zam_ts)"
    printf '{"type":"command_end","ts":"%s","exit_code":%d,"seq":%d,"pid":%d}\\n' \\
      "$ts" "$exit_code" "$__ZAM_MONITOR_SEQ" "$$" \\
      >> "$__ZAM_MONITOR_FILE"
  fi
}

trap '__zam_debug_trap' DEBUG
PROMPT_COMMAND="__zam_prompt_cmd;\${PROMPT_COMMAND:-}"

echo "ZAM monitor active for session $__ZAM_MONITOR_SESSION"
`.trim();
}

/**
 * Generate PowerShell hooks that capture completed commands to a JSONL file.
 * PowerShell has no zsh-style preexec hook, so this records the most recent
 * history item from the prompt function after each command completes.
 */
export function generatePowerShellHooks(
  monitorFile: string,
  sessionId: string,
): string {
  return `
# ZAM monitor hooks for session ${sessionId}
$global:__ZAM_MONITOR_FILE = ${psSingleQuoted(monitorFile)}
$global:__ZAM_MONITOR_SEQ = 0
$global:__ZAM_MONITOR_SESSION = ${psSingleQuoted(sessionId)}
$global:__ZAM_MONITOR_SKIP_NEXT_PROMPT = $true

function global:__zam_write_monitor_event {
  param([hashtable]$Event)
  $json = $Event | ConvertTo-Json -Compress -Depth 4
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::AppendAllText($global:__ZAM_MONITOR_FILE, $json + [Environment]::NewLine, $utf8NoBom)
}

function global:__zam_iso_utc {
  param([datetime]$Date)
  if ($Date -eq [datetime]::MinValue) {
    return (Get-Date).ToUniversalTime().ToString("o")
  }
  return $Date.ToUniversalTime().ToString("o")
}

function global:__zam_update_last_history_id {
  $history = Get-History -Count 1
  if ($null -ne $history) {
    $global:__ZAM_MONITOR_LAST_HISTORY_ID = $history.Id
  } elseif ($null -eq $global:__ZAM_MONITOR_LAST_HISTORY_ID) {
    $global:__ZAM_MONITOR_LAST_HISTORY_ID = 0
  }
}

function global:__zam_record_last_history {
  param(
    [bool]$Success,
    [object]$NativeExitCode
  )

  $history = Get-History -Count 1
  if ($null -eq $history) { return }
  if ($history.Id -le $global:__ZAM_MONITOR_LAST_HISTORY_ID) { return }

  $global:__ZAM_MONITOR_LAST_HISTORY_ID = $history.Id
  $global:__ZAM_MONITOR_SEQ += 1

  $exitCode = 0
  if (-not $Success) {
    if ($NativeExitCode -is [int] -and $NativeExitCode -ne 0) {
      $exitCode = $NativeExitCode
    } else {
      $exitCode = 1
    }
  }

  $cwd = (Get-Location).Path
  __zam_write_monitor_event @{
    type = "command_start"
    ts = (__zam_iso_utc $history.StartExecutionTime)
    command = $history.CommandLine
    cwd = $cwd
    seq = $global:__ZAM_MONITOR_SEQ
    pid = $PID
  }
  __zam_write_monitor_event @{
    type = "command_end"
    ts = (__zam_iso_utc $history.EndExecutionTime)
    exit_code = $exitCode
    seq = $global:__ZAM_MONITOR_SEQ
    pid = $PID
  }
}

if (-not (Test-Path function:\\__zam_previous_prompt) -and (Test-Path function:\\prompt)) {
  Set-Item -Path function:\\__zam_previous_prompt -Value (Get-Item function:\\prompt).ScriptBlock
}
__zam_update_last_history_id

function global:prompt {
  $zamSuccess = $?
  $zamNativeExitCode = $global:LASTEXITCODE

  if ($global:__ZAM_MONITOR_SKIP_NEXT_PROMPT) {
    __zam_update_last_history_id
    $global:__ZAM_MONITOR_SKIP_NEXT_PROMPT = $false
  } else {
    __zam_record_last_history -Success $zamSuccess -NativeExitCode $zamNativeExitCode
  }

  if (Test-Path function:\\__zam_previous_prompt) {
    & (Get-Item function:\\__zam_previous_prompt).ScriptBlock
  } else {
    "PS $($executionContext.SessionState.Path.CurrentLocation)$('>' * ($nestedPromptLevel + 1)) "
  }
}

Write-Host "ZAM monitor active for session $global:__ZAM_MONITOR_SESSION"
`.trim();
}

/** Generate zsh code to remove monitor hooks. */
export function generateZshUnhooks(): string {
  return `
# Remove ZAM monitor hooks
add-zsh-hook -d preexec __zam_preexec 2>/dev/null
add-zsh-hook -d precmd __zam_precmd 2>/dev/null
unset -f __zam_preexec __zam_precmd __zam_ts 2>/dev/null
unset __ZAM_MONITOR_FILE __ZAM_MONITOR_SEQ __ZAM_MONITOR_SESSION 2>/dev/null
echo "ZAM monitor stopped."
`.trim();
}

/** Generate bash code to remove monitor hooks. */
export function generateBashUnhooks(): string {
  return `
# Remove ZAM monitor hooks
trap - DEBUG
PROMPT_COMMAND="\${PROMPT_COMMAND/__zam_prompt_cmd;/}"
unset -f __zam_debug_trap __zam_prompt_cmd __zam_ts 2>/dev/null
unset __ZAM_MONITOR_FILE __ZAM_MONITOR_SEQ __ZAM_MONITOR_SESSION __ZAM_MONITOR_CMD_ACTIVE 2>/dev/null
echo "ZAM monitor stopped."
`.trim();
}

/** Generate PowerShell code to remove monitor hooks. */
export function generatePowerShellUnhooks(): string {
  return `
# Remove ZAM monitor hooks
if (Test-Path function:\\__zam_previous_prompt) {
  Set-Item -Path function:\\prompt -Value (Get-Item function:\\__zam_previous_prompt).ScriptBlock
  Remove-Item function:\\__zam_previous_prompt -Force -ErrorAction SilentlyContinue
}
Remove-Item function:\\__zam_write_monitor_event,function:\\__zam_iso_utc,function:\\__zam_update_last_history_id,function:\\__zam_record_last_history -ErrorAction SilentlyContinue
Remove-Variable -Name __ZAM_MONITOR_FILE,__ZAM_MONITOR_SEQ,__ZAM_MONITOR_SESSION,__ZAM_MONITOR_LAST_HISTORY_ID,__ZAM_MONITOR_SKIP_NEXT_PROMPT -Scope Global -ErrorAction SilentlyContinue
Write-Host "ZAM monitor stopped."
`.trim();
}
