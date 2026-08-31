# PRD — kavita-mcp

**Version:** 0.1.1 (2026-08-31)
**Status:** MVP mock-first — live when server configured
**Upstream:** Kareadita/Kavita v0.9.1.0 (28 Aug 2026)
**Ports:** Backend 11189 (REST /api, MCP /mcp) / Frontend 11190

## 1. Vision
Lightweight sidecar to calibre-mcp (10720/21). Calibre remains HQ for curation/conversion (the 1000+ book library). kavita-mcp serves comics/manga/BD for fast mobile/reader sharing, OPDS for Tachiyomi/Mihon/KOReader, and MCP tooling for agents. Not a replacement — a fleet member.

## 2. Users
Sandra (primary) + family/friends via shared Komga/Kavita libraries. Agents via MCP.

## 3. Scope — MVP (shipped 0.1.1)
- Portmanteau MCP tools with pagination (limit/offset, has_more), mock-first (Joe Mocky/Sandra Mockinger), Prefab status card (app=True)
- Webapp SOTA: AppLayout sidebar+topbar, Dashboard hero + KPIs (MOCK badges), big red onboarding cue (data-testid=onboarding-cue), Libraries/Series/Books(-or-ReadingLists) with **paginated, filtered, sorted grid/list** (search input data-testid=filter-input, sort-select, view-grid/view-list, prev/next, page-indicator, total-count, 12-16/page), Inbox, Tools (dynamic), Skills, Chat (localStorage), Settings (LLM provider probe), Help (page), Logs
- REST: GET /api/health, GET /api/tools, CORS explicit localhost
- Onboarding: docs/ONBOARDING.md + MOCK-until-onboarded UX
- MCPB 3-4-100 + start.ps1/start.bat + fleet start helper

## 4. Tool contracts
All tools return {success, message, result: {items, has_more, total}, mock, suggestions on error}. Pagination mandatory for lists. No planned stubs.

## 5. Non-goals
No conversion (Komga/Kavita serve-only), no calibre DB ownership, no Tauri in 0.1.x (webapp-only).

## 6. Roadmap
0.2: Live HTTP client (httpx + retries, JWT for Kavita, Basic for Komga), OPDS proxy, webhook inbox. 0.3: LanceDB RAG over series metadata. 1.0: Tauri NSIS if needed.

## 7. Success
`uv sync --extra dev && ruff check && tsc --noEmit && biome check && pytest` green; webapp grids demonstrate filter/sort/paginate; onboarding clears MOCK badges when env set.
