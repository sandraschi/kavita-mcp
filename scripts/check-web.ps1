#Requires -Version 5.1
<#
.SYNOPSIS
Frontend gates: tsc typecheck + biome lint. Resolves repo root from its own location.
#>
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Front = Join-Path $Root "webapp\frontend"
$Bun = Join-Path $env:USERPROFILE ".bun\bin\bun.exe"
if (-not (Test-Path $Bun)) { $Bun = "bun" }
& $Bun run --cwd $Front check
& $Bun run --cwd $Front biome:ci
