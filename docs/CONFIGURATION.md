# Configuration — kavita-mcp

Ports: Backend 11189 / Frontend 11190 (see WEBAPP_PORTS.md). CORS allowlist explicit localhost.

Env (.env from .env.example):
- KAVITA_URL, KAVITA_API_KEY (or KAVITA_USER/KAVITA_PASSWORD -> JWT)
- `MOCK_MODE=1` forces mock data (default). Set `0` + real URL to go live.
- `OLLAMA_URL`, `LMSTUDIO_URL` for Chat/Settings provider probe.

Health: GET http://127.0.0.1:11189/api/health
Tools: GET http://127.0.0.1:11189/api/tools

Start: `start.ps1` (zombie-clears ports, polls health, launches bun dev), `start.bat`, or fleet `mcp-central-docs/starts/kavita-mcp-start.bat`.

Mock data: 16-32 items, filter/sort/paginate demo, Joe Mocky / Sandra Mockinger names, clears when live.
