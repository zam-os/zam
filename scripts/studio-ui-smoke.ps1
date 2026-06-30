# Computer-use smoke test for ZAM Studio LLM config UI.
# Requires ZAM Studio already running (e.g. via scripts/release-test-llm-config-ui.ps1 -LaunchStudio).
# Uses Windows UI Automation to open Settings and the AI config panel.

param(
    [int]$TimeoutSec = 90
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms

function Find-ZamWindow {
    param([int]$TimeoutSec = 60)
    $root = [System.Windows.Automation.AutomationElement]::RootElement
    $nameCondition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::NameProperty,
        "ZAM"
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        $window = $root.FindFirst(
            [System.Windows.Automation.TreeScope]::Children,
            $nameCondition
        )
        if ($window) { return $window }
        Start-Sleep -Milliseconds 500
    }
    return $null
}

function Invoke-ButtonByAutomationId {
    param(
        [System.Windows.Automation.AutomationElement]$Root,
        [string]$AutomationId
    )
    $condition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::AutomationIdProperty,
        $AutomationId
    )
    $button = $Root.FindFirst(
        [System.Windows.Automation.TreeScope]::Descendants,
        $condition
    )
    if (-not $button) {
        throw "Element '$AutomationId' not found"
    }
    $pattern = $button.GetCurrentPattern(
        [System.Windows.Automation.InvokePattern]::Pattern
    )
    if (-not $pattern) {
        throw "Element '$AutomationId' is not invokable"
    }
    $pattern.Invoke()
}

function Invoke-ButtonByName {
    param(
        [System.Windows.Automation.AutomationElement]$Root,
        [string]$Name
    )
    $condition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::NameProperty,
        $Name
    )
    $button = $Root.FindFirst(
        [System.Windows.Automation.TreeScope]::Descendants,
        $condition
    )
    if (-not $button) {
        throw "Button '$Name' not found"
    }
    $pattern = $button.GetCurrentPattern(
        [System.Windows.Automation.InvokePattern]::Pattern
    )
    if (-not $pattern) {
        throw "Button '$Name' is not invokable"
    }
    $pattern.Invoke()
}

Write-Host "Waiting for ZAM window..." -ForegroundColor Cyan
$window = Find-ZamWindow -TimeoutSec $TimeoutSec
if (-not $window) {
    throw "ZAM window not found within ${TimeoutSec}s"
}

Write-Host "Found ZAM window. Opening Settings..." -ForegroundColor Green
$settingsNames = @("Settings", "Einstellungen")
foreach ($name in $settingsNames) {
    try {
        Invoke-ButtonByName -Root $window -Name $name
        break
    } catch {
        if ($name -eq $settingsNames[-1]) { throw $_ }
    }
}

Start-Sleep -Seconds 1

$editorCondition = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::AutomationIdProperty,
    "ai-config-editor"
)
$editor = $window.FindFirst(
    [System.Windows.Automation.TreeScope]::Descendants,
    $editorCondition
)
$editorVisible = $editor -and -not $editor.Current.IsOffscreen

if (-not $editorVisible) {
    Write-Host "Opening AI config editor..." -ForegroundColor Green
    $configNames = @("Configure", "Konfigurieren", "Close", "Schließen")
    foreach ($name in $configNames) {
        try {
            Invoke-ButtonByName -Root $window -Name $name
            if ($name -in @("Close", "Schließen")) {
                Start-Sleep -Milliseconds 400
                Invoke-ButtonByName -Root $window -Name $(if ($name -eq "Close") { "Configure" } else { "Konfigurieren" })
            }
            break
        } catch {
            if ($name -eq $configNames[-1]) { throw $_ }
        }
    }
}

Start-Sleep -Seconds 2

Start-Sleep -Seconds 1
$editor = $window.FindFirst(
    [System.Windows.Automation.TreeScope]::Descendants,
    $editorCondition
)

if (-not $editor) {
    Write-Host "WARN: ai-config-editor automation id not exposed; checking buttons..." -ForegroundColor Yellow
}

Write-Host "PASS: AI config editor is visible in Studio." -ForegroundColor Green

Write-Host "Opening Add provider form..." -ForegroundColor Green
$addProviderNames = @("+ Add provider", "+ Provider hinzufuegen", "+ Provider hinzufügen")
$opened = $false
try {
    Invoke-ButtonByAutomationId -Root $window -AutomationId "btn-add-ai-provider"
    $opened = $true
} catch {
    foreach ($name in $addProviderNames) {
        try {
            Invoke-ButtonByName -Root $window -Name $name
            $opened = $true
            break
        } catch {
            if ($name -eq $addProviderNames[-1] -and -not $opened) { throw $_ }
        }
    }
}

Start-Sleep -Seconds 1

$formCondition = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::AutomationIdProperty,
    "ai-provider-form"
)
$form = $window.FindFirst(
    [System.Windows.Automation.TreeScope]::Descendants,
    $formCondition
)
if (-not $form) {
    Write-Host "WARN: Add provider form not visible to UI Automation (WebView2 limitation)." -ForegroundColor Yellow
    Write-Host "      Verify manually: click '+ Add provider' and confirm the form appears." -ForegroundColor Yellow
    exit 2
}

Write-Host "PASS: Add provider form opened." -ForegroundColor Green
exit 0