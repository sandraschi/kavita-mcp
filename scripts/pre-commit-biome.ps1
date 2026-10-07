#Requires -Version 5.1
<#
.SYNOPSIS
Pre-commit Biome gate: lints the Vite frontend. No-op when no webapp exists.
#>
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Front = Join-Path $Root "webapp\frontend"
if (-not (Test-Path (Join-Path $Front "package.json"))) { exit 0 }
$Bun = Join-Path $env:USERPROFILE ".bun\bin\bun.exe"
if (-not (Test-Path $Bun)) { $Bun = "bun" }
& $Bun run --cwd $Front biome:ci
