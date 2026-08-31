# Troubleshooting — kavita-mcp

**MOCK badge still showing?** Set .env URL + key, `MOCK_MODE=0`, restart `start.ps1`.

**Komga NextUI beta F5 loads old UI?** Expected in 1.26.0 — not a bug, use sidebar link.

**Kavita 401?** JWT expired — re-login, new KAVITA_API_KEY.

**Port in use?** `start.ps1` kills zombies via Get-NetTCPConnection. Manual: `Get-NetTCPConnection -LocalPort 11189 | % { Stop-Process $_.OwningProcess -Force }`.

**Biome/tsc fails?** `bun install` in webapp/frontend, then `npx tsc --noEmit`, `npx biome check --write`.
