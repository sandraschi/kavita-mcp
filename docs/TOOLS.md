# Tools — kavita-mcp

| Tool | Operations | Params |
|------|------------|--------|
| `kavita_help` | — | Catalog + recipe (call first) |
| `kavita_library_tool` | `list`, `get`, `scan` | `library_id?`, `limit`, `offset` |
| `kavita_series_tool` | `list`, `search`, `get`, `get_chapters` | `series_id?`, `query?` |
| `kavita_reading_tool` | `get_progress`, `mark_progress`, `get_bookmarks` | `series_id?`, `volume_id?`, `progress?` |
| `kavita_users_tool` | `list`, `get` | `user_id?` |
| `kavita_system_tool` | `status` | — (MOCK-vs-live oracle) |
| `kavita_shutdown` | — | Graceful exit (`delay_ms?`) |
| `show_kavita_status_prefab` | — | Prefab card |

All paginated, mock-first (MOCK badges). See `src/kavita_mcp/tools/kavita_tools.py`.
Skill: `skill://kavita-mcp/kavita-expert` (`src/kavita_mcp/skills/kavita-expert/SKILL.md`).

## REST mirrors (same-origin /api via Vite proxy)

| Endpoint | Purpose |
|----------|---------|
| GET /api/health, /health | Liveness (launcher, health dot, Tauri backend-status) |
| GET /api/status | Status + tool_count + key-configured flags |
| GET /api/skills | Skill listing (skill-first Chat) |
| GET /api/llm/discover | Ollama/LM Studio presence + GPU + opportunity |
| GET /api/llm/providers | Discover superset (registry shape) |
| GET /api/llm/models?provider= | Live model list or curated fallback |
| GET /api/llm/onboarding | Starter facts + recommended path |
| POST /api/llm/chat | Backend-only chat proxy (503 when none reachable) |
| POST /api/llm/chat/stream | SSE variant (data: {"delta"} … [DONE]) |
| GET /api/v1/diagnostics | Tool list + system info (CUA smoke) |
| POST /api/shutdown | Orderly exit (launcher pre-restart hook) |
