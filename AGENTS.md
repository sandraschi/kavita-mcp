# kavita-mcp AGENTS

Kavita manga/comics/ebooks bridge. Backend :11189 (Starlette REST + MCP), frontend :11190 (Vite).

## Session Context (kavita-mcp)

Before starting work: kavita_library_tool(operation="list"), then kavita_series_tool.
MOCK-first until KAVITA_URL is set — MOCK badge means not live, not broken.
At end of work: just gates-green; sync docs/ when tools or endpoints change.

## Quick ref

| What | Where |
|---|---|
| Server + REST | src/kavita_mcp/server.py |
| Tool impls | src/kavita_mcp/tools/kavita_tools.py |
| Skill | src/kavita_mcp/skills/kavita-expert/SKILL.md |
| Frontend | webapp/frontend/src/App.tsx (proxy /api, never hardcode backend URL) |
| Docs | docs/ONBOARDING.md, CONFIGURATION.md, TOOLS.md, TROUBLESHOOTING.md |
| Start | start.ps1 (probes /api/health) |
| Gates | just gates-green |
