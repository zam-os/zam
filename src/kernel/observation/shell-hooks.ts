/**
 * Shell hook code generation for zsh and bash.
 *
 * Pure functions that return shell code strings. The CLI command
 * `zam monitor start/stop` calls these and prints to stdout.
 * The user wraps with `eval "$(zam monitor start ...)"`.
 */

/**
 * Generate zsh hooks that capture commands to a JSONL file.
 * Uses $EPOCHREALTIME for sub-second timestamp precision.
 */
export function generateZshHooks(monitorFile: string, sessionId: string): string {
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
    printf '%s.%sZ' "$(date -u -r "\$sec" '+%Y-%m-%dT%H:%M:%S' 2>/dev/null || date -u '+%Y-%m-%dT%H:%M:%S')" "\$frac"
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
    "\$ts" "\$cmd" "\$cwd" "\$__ZAM_MONITOR_SEQ" "\$\$" \\
    >> "\$__ZAM_MONITOR_FILE"
}

__zam_precmd() {
  local exit_code=\$?
  [[ \$__ZAM_MONITOR_SEQ -eq 0 ]] && return
  local ts="$(__zam_ts)"
  printf '{"type":"command_end","ts":"%s","exit_code":%d,"seq":%d,"pid":%d}\\n' \\
    "\$ts" "\$exit_code" "\$__ZAM_MONITOR_SEQ" "\$\$" \\
    >> "\$__ZAM_MONITOR_FILE"
}

autoload -Uz add-zsh-hook
add-zsh-hook preexec __zam_preexec
add-zsh-hook precmd __zam_precmd

echo "ZAM monitor active for session \$__ZAM_MONITOR_SESSION"
`.trim();
}

/**
 * Generate bash hooks that capture commands to a JSONL file.
 * Uses DEBUG trap for preexec, PROMPT_COMMAND for precmd.
 */
export function generateBashHooks(monitorFile: string, sessionId: string): string {
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
  [[ "\$__ZAM_MONITOR_CMD_ACTIVE" -eq 1 ]] && return
  __ZAM_MONITOR_CMD_ACTIVE=1
  (( __ZAM_MONITOR_SEQ++ ))
  local cmd="\${BASH_COMMAND//\\"/\\\\\\"}"
  local cwd="\${PWD//\\"/\\\\\\"}"
  local ts="$(__zam_ts)"
  printf '{"type":"command_start","ts":"%s","command":"%s","cwd":"%s","seq":%d,"pid":%d}\\n' \\
    "\$ts" "\$cmd" "\$cwd" "\$__ZAM_MONITOR_SEQ" "\$\$" \\
    >> "\$__ZAM_MONITOR_FILE"
}

__zam_prompt_cmd() {
  local exit_code=\$?
  if [[ "\$__ZAM_MONITOR_CMD_ACTIVE" -eq 1 ]]; then
    __ZAM_MONITOR_CMD_ACTIVE=0
    local ts="$(__zam_ts)"
    printf '{"type":"command_end","ts":"%s","exit_code":%d,"seq":%d,"pid":%d}\\n' \\
      "\$ts" "\$exit_code" "\$__ZAM_MONITOR_SEQ" "\$\$" \\
      >> "\$__ZAM_MONITOR_FILE"
  fi
}

trap '__zam_debug_trap' DEBUG
PROMPT_COMMAND="__zam_prompt_cmd;\${PROMPT_COMMAND:-}"

echo "ZAM monitor active for session \$__ZAM_MONITOR_SESSION"
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
