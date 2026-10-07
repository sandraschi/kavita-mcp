# kavita-mcp CLAUDE

MCP bridge to a self-hosted Kavita server (manga/comics/ebooks): libraries, series,
volumes, reading lists, progress, users. MOCK-first until KAVITA_URL is set.

## Entry points

- `uv run python -m kavita_mcp.server` — stdio (Claude Desktop). Add `--port N` / `--http` for HTTP.
- `start.ps1` / `start.bat` — launcher (zombie-clears ports, polls /api/health, starts Vite).
- `just gates-green` — all gates (ruff + pyright + pytest + tsc + biome). Run before commit.

## Standards

Fleet SOTA: FastMCP >=3.4.4,<4 · Starlette dual-surface (REST /api/* + MCP /mcp) ·
direct returns {success, message, result} · Prefab card on status · MOCK badges declared.

## Key files

- src/kavita_mcp/server.py — tools + REST + lifespan/mount wiring
- src/kavita_mcp/tools/kavita_tools.py — portmanteau implementations
- src/kavita_mcp/skills/kavita-expert/SKILL.md — agent playbook (skill://)
- webapp/frontend/src/App.tsx — dashboard (same-origin /api via Vite proxy)
- docs/ (ONBOARDING, CONFIGURATION, TOOLS, TROUBLESHOOTING) — sync on tool/endpoint changes
- Ports: backend 11189, frontend 11190 (fleet registry, adjacent, non-forbidden)
