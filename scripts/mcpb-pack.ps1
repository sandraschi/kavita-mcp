
$ErrorActionPreference="Stop"
$Root=$PSScriptRoot | Split-Path -Parent
$Src="$Root/src"
$Dst="$Root/mcpb/src"
if(Test-Path $Dst){ Remove-Item -Recurse -Force $Dst }
Copy-Item -Recurse -Force $Src $Dst
$sys=(Get-Content "$Root/assets/prompts/system.md" -Raw).Split(" ",[StringSplitOptions]::RemoveEmptyEntries).Count
$user=(Get-Content "$Root/assets/prompts/user.md" -Raw).Split(" ",[StringSplitOptions]::RemoveEmptyEntries).Count
$ex=(Get-Content "$Root/assets/prompts/examples.json" | ConvertFrom-Json).Count
Write-Host "system $sys user $user examples $ex"
if($sys -lt 3000){ throw "system.md <3000 words" }
if($user -lt 4000){ throw "user.md <4000 words" }
if($ex -lt 100){ throw "examples <100" }
Write-Host "Pack ready - run mcpb pack ."
