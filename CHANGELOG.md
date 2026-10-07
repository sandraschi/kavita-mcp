# Changelog

## 0.1.2 - 2026-10-07 (assfix)
### Fixed (assfix audit 2026-10-07, score 0 -> rescore pending)
- CRITICAL: stdio transport restored — `python -m kavita_mcp.server` speaks MCP stdio again
  (Claude Desktop bundle was launching uvicorn HTTP instead). `--port`/`--http` selects HTTP.
- Mount bugs: parent lifespan now drives the MCP session manager (BUG-038 class); bare /mcp
  rewritten to /mcp/ (Mount only matches /mcp/*); http_app(path="/") (no double prefix).
- CORS: explicit origins incl. tauri://localhost + unconditional LAN/Tailscale/localhost regex.
- Added kavita_help, kavita_shutdown (+ POST /api/shutdown), /api/status, /api/skills,
  /api/llm/{discover,providers,models,onboarding,chat,chat/stream}, /api/v1/diagnostics.
- All 8 MCP tools now carry docstrings (Return Format + Examples); Literal-typed ops (pyright clean).
- Prefab status card rebuilt on the installed prefab-ui 0.18 API (was call-time broken).
- Fresh-clone `just test` green: pytest/pytest-asyncio/pyright/ruff moved to dependency-groups dev,
  asyncio_mode=auto. Ruff enforces T20 now. justfile: bootstrap, typecheck, build-web, check-web,
  gates-green (all -File recipes, no Set-Location fragility).
- CI: pyright + frontend gates (bun setup, check, biome:ci). pre-commit config + biome hook script.
  renovate.json. reports/ gitignored (docs/assess-reports/ committed).
- Session context: .cursorrules/.windsurfrules, .claude-plugin + hooks, copilot instructions,
  opencode + antigravity skills. Domain skill skills/kavita-expert/SKILL.md via SkillsDirectoryProvider.
- glama.json tool list; llms.txt links llms-full.txt; README Claude one-liner + uvx config.
- Tauri frontendDist corrected to ../webapp/frontend/dist.
### Deferred (open, with reasons)
- Verb-led tool renames (would break existing clients; namespaced domain names kept).
- MCPB fleet-shim migration (needs mcpb/manifest.json relocation + release pipeline; local pack
  script correctly wipes+recopies and enforces 3-4-100).
- Playwright e2e + cua-webapp-test (no e2e specs yet).
- Frontend Chat/Settings depth (streaming UI, personalities) — backend ready, UI pass pending.

## 0.1.1 - 2026-08-31
### Changed
- Webapp: Libraries/Series/Books now paginated (12-16/page), filtered (search), sorted (name/count/newest), grid + list toggle, Pagination (prev/next), total-count + page-indicator, data-testids. 18/24/32 mock items to demo paging.
- Docs: Added PRD.md, expanded TOOLS.md/CONFIGURATION.md/TROUBLESHOOTING.md.

## 0.1.0 - 2026-08-31
- Initial scaffold mock-first — FastMCP 3.4, Starlette, Prefab card, SOTA webapp shell, MCPB 3-4-100, ports 11189/11190, komga/kavita alignment to calibre-mcp comparison memop 2026-08-31.
