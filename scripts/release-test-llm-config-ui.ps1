# Pre-release smoke test for LLM Configuration UI (v0.5.2).
# Runs automated bridge acceptance tests, then optionally launches ZAM Studio
# for manual/computer-use verification.
param(
    [switch]$LaunchStudio,
    [string]$ZamHome = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"
$repoRoot = Join-Path $PSScriptRoot ".."

Write-Host "==> Building CLI..." -ForegroundColor Cyan
Push-Location $repoRoot
try {
    npm run build | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "build failed" }

    Write-Host "==> Running release integration tests..." -ForegroundColor Cyan
    npm run test -- tests/integration/llm-config-release.test.ts tests/cli/bridge-provider.test.ts | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "tests failed" }

    Write-Host "==> Typechecking desktop..." -ForegroundColor Cyan
    Push-Location (Join-Path $repoRoot "desktop")
    npx tsc --noEmit | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "desktop typecheck failed" }
    Pop-Location

    Write-Host "==> Syncing CLI into desktop resources..." -ForegroundColor Cyan
    npm run desktop:prepare | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "desktop:prepare failed" }

    Write-Host "==> All automated checks passed." -ForegroundColor Green

    if ($LaunchStudio) {
        Write-Host "==> Launching ZAM Studio (dev) with ZAM_HOME=$ZamHome" -ForegroundColor Cyan
        $env:ZAM_HOME = $ZamHome
        Push-Location (Join-Path $repoRoot "desktop")
        Start-Process -FilePath "npm" -ArgumentList "run","tauri","dev" -WorkingDirectory (Get-Location)
        Start-Sleep -Seconds 75
        Write-Host "==> Running computer-use UI smoke..." -ForegroundColor Cyan
        & (Join-Path $repoRoot "scripts/studio-ui-smoke.ps1") -TimeoutSec 90
        $uiExit = $LASTEXITCODE
        if ($uiExit -eq 0) {
            Write-Host "==> UI smoke passed." -ForegroundColor Green
        } elseif ($uiExit -eq 2) {
            Write-Host "==> UI smoke partial — manual form check recommended." -ForegroundColor Yellow
        } else {
            throw "UI smoke failed (exit $uiExit)"
        }
    }
}
finally {
    Pop-Location
}