# kavita-expert — Kavita bridge playbook

Domain skill for agents driving kavita-mcp (self-hosted Kavita manga/comics/ebooks bridge).
Backend Starlette on :11189 (REST /api/*, MCP /mcp). Frontend Vite on :11190.
MOCK-first: until KAVITA_URL + KAVITA_API_KEY are set, every tool returns declared
mock data (Joe Mocky / Sandra Mockinger fixtures) with a MOCK badge. MOCK means
"not live yet", never "broken".

## Agent vs human routing

- Agents: use the MCP tools below (stdio via Claude Desktop, or HTTP /mcp). Start
  every session with `kavita_help`, then list libraries before anything deeper.
- Humans: open http://127.0.0.1:11190 — green dot means backend reachable, MOCK
  badge means env not configured. First-time setup is docs/ONBOARDING.md.

## Tool catalog (real operation names)

| Tool | Operations | Notes |
|------|------------|-------|
| kavita_help | — | Catalog + recipe. Call first. |
| kavita_library_tool | list, get, scan | list paginates (limit/offset, has_more). scan queues a library scan. |
| kavita_series_tool | list, search, get, get_chapters | search needs query. get_chapters needs series_id. |
| kavita_reading_tool | get_progress, mark_progress, get_bookmarks | mark_progress MUTATES (needs volume_id + progress 0.0–1.0). |
| kavita_users_tool | list, get | get needs user_id. |
| kavita_system_tool | status | Returns mock flag — the MOCK-vs-live oracle. |
| kavita_shutdown | — | Graceful exit (agents + launcher pre-restart hook). |
| show_kavita_status_prefab | — | Rich in-chat status card (app=True). |

REST mirrors (same-origin via Vite proxy, never hardcode the backend URL in the browser):
GET /api/health, /api/status, /api/skills, /api/llm/discover|providers|models|onboarding,
POST /api/llm/chat (+ /stream SSE), GET /api/v1/diagnostics, POST /api/shutdown.

## Workflow 1 — browse then read (copy-shape)

```
kavita_library_tool(operation="list")
  -> pick library_id
kavita_series_tool(operation="list")            # or search with query="berserk"
  -> pick series_id
kavita_series_tool(operation="get_chapters", series_id=<id>)
  -> pick volume_id
kavita_reading_tool(operation="get_progress", series_id=<id>)
kavita_reading_tool(operation="mark_progress", volume_id=<id>, progress=0.75)
```

## Workflow 2 — is it live yet? (copy-shape)

```
kavita_system_tool()                            # mock=true -> still MOCK
  -> set KAVITA_URL + KAVITA_API_KEY in .env, restart backend
kavita_system_tool()                            # mock=false -> live
open frontend :11190 -> MOCK badges gone, green health dot
```

## Workflow 3 — chat with local LLM (copy-shape)

```
GET /api/llm/discover                           # ollama/lmstudio detected? gpu present?
GET /api/llm/models?provider=ollama             # live list or curated fallback
POST /api/llm/chat {provider, model, messages}  # 503 = none reachable -> onboard Ollama
```

## Error / troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| All tools return MOCK | KAVITA_URL unset | copy .env.example to .env, fill URL + key, restart |
| "not found" error_type not_found | Wrong library_id/series_id/user_id | list first, then get with a real id |
| Frontend red/unreachable | Backend not up | start.ps1 (zombie-clears ports, polls /api/health) |
| 401 from Kavita | JWT/API key expired | Re-login / rotate key in Kavita admin, update .env |
| /api/llm/chat 503 | No local LLM running | Install Ollama (:11434) or start LM Studio (:1234) |
| /mcp bare path oddness | Starlette Mount matching | Server rewrites /mcp -> /mcp/; use a real MCP client |

## Config

Env (see .env.example): KAVITA_URL, KAVITA_API_KEY, MOCK_MODE=1, BACKEND_PORT=11189,
FRONTEND_PORT=11190, OLLAMA_URL, LMSTUDIO_URL. Never commit .env.
