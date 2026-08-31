
Param([switch]$Headless, [switch]$BackendOnly, [switch]$NoBrowser)
$ErrorActionPreference="Stop"
$BackendPort=11189
$FrontendPort=11190
$Root=$PSScriptRoot
$env:PYTHONUNBUFFERED="1"
if($Headless -and ($Host.UI.RawUI.WindowTitle -notmatch "Hidden")){ Start-Process pwsh -ArgumentList "-NoProfile","-File",$PSCommandPath,"-Headless" -WindowStyle Hidden; exit }
$Host.UI.RawUI.WindowTitle="kavita-mcp - backend :$BackendPort / frontend :$FrontendPort"
Write-Host "  kavita-mcp" -ForegroundColor Cyan
Write-Host "  BACKEND   http://127.0.0.1:$BackendPort   (REST /api, MCP /mcp)" -ForegroundColor Gray
Write-Host "  FRONTEND  http://127.0.0.1:$FrontendPort  (webapp UI)" -ForegroundColor Gray
foreach($p in @($BackendPort,$FrontendPort)){ try{ Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | ForEach-Object{ Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } }catch{} }
if(-not $BackendOnly){
  $b=Start-Job -Name "backend" -ScriptBlock{ param($R,$P) Set-Location $R; $env:PYTHONUNBUFFERED="1"; & "C:\Users\sandr\.local\bin\uv.exe" run python -m kavita_mcp.server --port $P } -ArgumentList $Root,$BackendPort
  for($i=0;$i -lt 30;$i++){ try{ $r=Invoke-WebRequest -Uri "http://127.0.0.1:$BackendPort/api/health" -TimeoutSec 2 -UseBasicParsing; if($r.StatusCode -eq 200){ break } }catch{}; Start-Sleep 1 }
  if(Test-Path "$Root/webapp/frontend/package.json"){ try{ Start-Process -NoNewWindow -FilePath "cmd" -ArgumentList "/c bun run dev --port $FrontendPort --host" -WorkingDirectory "$Root/webapp/frontend" }catch{} }
  if(-not $NoBrowser){ Start-Sleep 2; try{ Start-Process "http://127.0.0.1:$FrontendPort" }catch{} }
  Write-Host "Started backend job $($b.Id)" -ForegroundColor Green
  while($true){ if($b.State -in @("Completed","Failed")){ Receive-Job $b; break }; Start-Sleep 2 }
} else {
  & "C:\Users\sandr\.local\bin\uv.exe" run python -m kavita_mcp.server --port $BackendPort
}
