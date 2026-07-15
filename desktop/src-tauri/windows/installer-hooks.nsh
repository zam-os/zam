; NSIS installer hooks for the ZAM desktop bundle (issue #164).
;
; A running ZAM process keeps the native libsql module
; (resources\zam-cli\node_modules\@libsql\...\index.node) open, which makes
; the installer fail with "Error opening file for writing". The desktop app
; is not the only holder: agent harnesses (Claude Code, VS Code, Copilot)
; spawn `zam mcp` servers via node.exe from this install's resources, and
; those outlive the app window. Stop them all before files are written.

!macro NSIS_HOOK_PREINSTALL
  DetailPrint "Closing running ZAM processes..."
  ; The desktop app itself (and its child processes).
  nsExec::Exec "taskkill /F /T /IM zam-app.exe"
  Pop $0
  ; MCP server / CLI processes launched from an installed zam-cli. Matched by
  ; command line so unrelated node.exe processes are left untouched.
  nsExec::Exec "powershell -NoProfile -ExecutionPolicy Bypass -Command $\"Get-CimInstance Win32_Process | Where-Object { $$_.CommandLine -like '*zam-cli*' } | ForEach-Object { Stop-Process -Id $$_.ProcessId -Force -ErrorAction SilentlyContinue }$\""
  Pop $0
  ; Give Windows a moment to release the file handles.
  Sleep 500
!macroend
