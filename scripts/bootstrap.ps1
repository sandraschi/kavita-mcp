#Requires -Version 5.1
<#
.SYNOPSIS
Dev bootstrap: Python deps + frontend deps.
Resolves repo root from its own location; safe to call from any cwd.
#>
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Uv = Join-Path $env:USERPROFILE ".local\bin\uv.exe"
if (-not (Test-Path $Uv)) { $Uv = "uv" }
& $Uv sync
Set-Location $Root
$PreCommit = Join-Path $env:USERPROFILE ".local\bin\pre-commit.exe"
if (Test-Path $PreCommit) { & $PreCommit install } else { Write-Host "pre-commit not found; skipping hook install" }
$Front = Join-Path $Root "webapp\frontend"
if (Test-Path (Join-Path $Front "package.json")) {
    $Bun = Join-Path $env:USERPROFILE ".bun\bin\bun.exe"
    if (-not (Test-Path $Bun)) { $Bun = "bun" }
    & $Bun install --cwd $Front
}
Write-Host "bootstrap done" -ForegroundColor Green
