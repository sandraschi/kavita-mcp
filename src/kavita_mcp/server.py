"""Kavita eBook/comics/manga bridge — FastMCP server + Starlette dual-surface backend.

Dual transport: ``python -m kavita_mcp.server`` (no flags) serves MCP over stdio
for Claude Desktop; ``--port N`` / ``--http`` serves REST + streamable-HTTP /mcp
for the webapp launcher. ServeArgs in start.ps1 always passes --port, so the
launcher path is unchanged by this module's stdio default.
"""

from __future__ import annotations

import asyncio
import logging
import os
import shutil
import subprocess
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated, Any, Literal

import httpx
from fastmcp import FastMCP
from prefab_ui.app import PrefabApp
from prefab_ui.components import (
    Badge,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Column,
    Heading,
    Muted,
    Text,
)
from starlette.applications import Starlette
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, StreamingResponse
from starlette.routing import Mount, Route

from .config import API_KEY, API_URL, BACKEND_PORT, FRONTEND_PORT, MOCK_MODE
from .tools.kavita_tools import (
    kavita_library,
    kavita_reading,
    kavita_series,
    kavita_system,
    kavita_users,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mcp = FastMCP("kavita-mcp")

_SKILLS_DIR = os.path.join(os.path.dirname(__file__), "skills")
try:
    from fastmcp.server.providers.skills import SkillsDirectoryProvider

    if os.path.isdir(_SKILLS_DIR):
        mcp.add_provider(SkillsDirectoryProvider(roots=[_SKILLS_DIR]))
        logger.info("SkillsDirectoryProvider registered: %s", _SKILLS_DIR)
except Exception as exc:  # fail-soft: skills are additive, never fatal
    logger.debug("SkillsDirectoryProvider skipped: %s", exc)

SERVICE = "kavita-mcp"
VERSION = "0.1.2"

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")
LMSTUDIO_URL = os.getenv("LMSTUDIO_URL", "http://localhost:1234").rstrip("/")

EXPLICIT_ORIGINS = [
    f"http://127.0.0.1:{BACKEND_PORT}",
    f"http://localhost:{BACKEND_PORT}",
    f"http://127.0.0.1:{FRONTEND_PORT}",
    f"http://localhost:{FRONTEND_PORT}",
    "tauri://localhost",
    "http://tauri.localhost",
    "https://tauri.localhost",
]
# LAN + Tailscale MagicDNS + localhost, any port. Unconditional by design:
# dev tabs open on hostnames (goliath, 192.168.x.x, tailnet) must reach the API.
ORIGIN_REGEX = r"https?://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*)(:\d+)?"

LibraryOp = Literal["list", "get", "scan"]
SeriesOp = Literal["list", "search", "get", "get_chapters"]
ReadingOp = Literal["get_progress", "mark_progress", "get_bookmarks"]
UsersOp = Literal["list", "get"]
SystemOp = Literal["status"]


@mcp.tool(annotations={"readOnlyHint": True})
async def kavita_library_tool(
    operation: Annotated[LibraryOp, "Library operation: list, get, or scan."] = "list",
    library_id: Annotated[int | None, "Library id for get/scan."] = None,
    limit: Annotated[int, "Max items to return."] = 50,
    offset: Annotated[int, "Items to skip for pagination."] = 0,
) -> dict[str, Any]:
    """Manage Kavita libraries (list, get, scan).

    Portmanteau for library operations against the configured Kavita server.
    Returns declared MOCK data when KAVITA_URL is unset (MOCK badge in webapp).

    ## Return Format
    {"success": bool, "message": str, "result": {"items": list, "has_more": bool, ...}}

    ## Examples
    kavita_library_tool(operation="list") -> {"success": True, "message": "2 libs (MOCK)", ...}
    kavita_library_tool(operation="get", library_id=1) -> {"success": True, "message": "Mock Manga ...", ...}
    kavita_library_tool(operation="scan", library_id=1) -> {"success": True, "message": "Scan queued ...", ...}
    """
    return await kavita_library(operation, library_id, limit, offset)


@mcp.tool(annotations={"readOnlyHint": True})
async def kavita_series_tool(
    operation: Annotated[SeriesOp, "Series operation: list, search, get, or get_chapters."] = "list",
    series_id: Annotated[int | None, "Series id for get/get_chapters."] = None,
    query: Annotated[str | None, "Search text for search."] = None,
    limit: Annotated[int, "Max items to return."] = 50,
    offset: Annotated[int, "Items to skip for pagination."] = 0,
) -> dict[str, Any]:
    """Browse and search Kavita series and volumes.

    Portmanteau for series discovery: list, free-text search, single get, chapter listing.

    ## Return Format
    {"success": bool, "message": str, "result": {"items": list, "has_more": bool}}

    ## Examples
    kavita_series_tool(operation="list") -> {"success": True, "message": "2 series (MOCK)", ...}
    kavita_series_tool(operation="search", query="berserk") -> {"success": True, "message": "Found 1", ...}
    kavita_series_tool(operation="get_chapters", series_id=1) -> {"success": True, ...}
    """
    return await kavita_series(operation, series_id, query, limit, offset)


@mcp.tool(annotations={"readOnlyHint": False})
async def kavita_reading_tool(
    operation: Annotated[ReadingOp, "Reading operation: get_progress, mark_progress, get_bookmarks."] = (
        "get_progress"
    ),
    series_id: Annotated[int | None, "Series id the progress belongs to."] = None,
    volume_id: Annotated[int | None, "Volume id for mark_progress."] = None,
    progress: Annotated[float | None, "Progress 0.0-1.0 for mark_progress."] = None,
) -> dict[str, Any]:
    """Track Kavita reading progress and bookmarks.

    Mutating op (mark_progress writes). All other ops are read-only.

    ## Return Format
    {"success": bool, "message": str, "result": {"progress": float} | {"items": list}}

    ## Examples
    kavita_reading_tool(operation="get_progress", series_id=1) -> {"success": True, "progress": 0.5 ...}
    kavita_reading_tool(operation="mark_progress", volume_id=2, progress=0.75) -> {"success": True, ...}
    """
    return await kavita_reading(operation, series_id, volume_id, progress)


@mcp.tool(annotations={"readOnlyHint": True})
async def kavita_users_tool(
    operation: Annotated[UsersOp, "User operation: list or get."] = "list",
    user_id: Annotated[int | None, "User id for get."] = None,
) -> dict[str, Any]:
    """List and inspect Kavita users.

    ## Return Format
    {"success": bool, "message": str, "result": {"items": list} | user}

    ## Examples
    kavita_users_tool(operation="list") -> {"success": True, "message": "2 users (MOCK)", ...}
    kavita_users_tool(operation="get", user_id=1) -> {"success": True, "message": "Joe Mocky", ...}
    """
    return await kavita_users(operation, user_id)


@mcp.tool(annotations={"readOnlyHint": True})
async def kavita_system_tool(
    operation: Annotated[SystemOp, "System operation (status only)."] = "status",
) -> dict[str, Any]:
    """Report Kavita bridge system status (MOCK vs live).

    ## Return Format
    {"success": bool, "message": str, "result": {"status": str, "version": str}, "mock": bool}

    ## Examples
    kavita_system_tool() -> {"success": True, "message": "Kavita MOCK status ...", "mock": True}
    """
    return await kavita_system(operation)


@mcp.tool(annotations={"readOnlyHint": True})
async def kavita_help() -> dict[str, Any]:
    """List every kavita-mcp tool with its operations and when to use it.

    Start here when unsure which tool fits: returns the catalog with one-line
    recipes (libraries -> series -> chapters -> progress).

    ## Return Format
    {"success": bool, "message": str, "result": {"tools": [{"name": str, "operations": list, "use": str}]}}

    ## Examples
    kavita_help() -> {"success": True, "message": "7 tools", "result": {"tools": [...]}}
    """
    return {
        "success": True,
        "message": "7 tools",
        "result": {
            "tools": [
                {"name": "kavita_help", "operations": [], "use": "This catalog."},
                {"name": "kavita_library_tool", "operations": ["list", "get", "scan"], "use": "Libraries first."},
                {
                    "name": "kavita_series_tool",
                    "operations": ["list", "search", "get", "get_chapters"],
                    "use": "Find series, then chapters.",
                },
                {
                    "name": "kavita_reading_tool",
                    "operations": ["get_progress", "mark_progress", "get_bookmarks"],
                    "use": "Progress + bookmarks (mark_progress mutates).",
                },
                {"name": "kavita_users_tool", "operations": ["list", "get"], "use": "Who reads what."},
                {"name": "kavita_system_tool", "operations": ["status"], "use": "MOCK vs live check."},
                {"name": "show_kavita_status_prefab", "operations": [], "use": "Rich status card in chat."},
            ],
            "recipe": "kavita_library_tool(list) -> kavita_series_tool(list) -> get_chapters -> mark_progress",
        },
    }


@mcp.tool(annotations={"destructiveHint": True})
async def kavita_shutdown(
    delay_ms: Annotated[int, "Delay before exit so the 200 response flushes."] = 500,
) -> dict[str, Any]:
    """Shut the kavita-mcp server down gracefully (agents + launcher pre-restart hook).

    The fleet launcher calls POST /api/shutdown before Restart-Service; this is the MCP-side
    equivalent. Responds first, then exits the process after delay_ms.

    ## Return Format
    {"success": bool, "message": str}

    ## Examples
    kavita_shutdown() -> {"success": True, "message": "kavita-mcp exiting in 500ms"}
    """
    logger.warning("kavita_shutdown requested via MCP; exiting in %dms", delay_ms)
    loop = asyncio.get_running_loop()
    loop.call_later(max(delay_ms, 0) / 1000.0, lambda: os._exit(0))
    return {"success": True, "message": f"kavita-mcp exiting in {delay_ms}ms"}


@mcp.tool(app=True)
async def show_kavita_status_prefab() -> PrefabApp:
    """Show Kavita bridge status as a rich Prefab card.

    In-chat status card: MOCK vs live, configured server URL, tool count.
    No parameters.

    ## Return Format
    PrefabApp(view=Column[Heading, Card, Text], title="Kavita Status")

    ## Examples
    show_kavita_status_prefab() -> PrefabApp(title="Kavita Status", ...)
    """
    data = await kavita_system("status")
    live = not data.get("mock", True)
    with Column(gap=3, css_class="p-4") as view:
        Heading(f"Kavita Bridge — {'LIVE' if live else 'MOCK'}")
        with Card(), CardHeader():
            CardTitle(text="kavita-mcp status")
        with Card(), CardContent(css_class="pt-3"):
            Text(data["message"])
            Text(f"Server: {API_URL} · Tools: 8 · v{VERSION}")
            Badge(label="LIVE" if live else "MOCK", variant="success" if live else "secondary")
        if not live:
            Muted("Set KAVITA_URL + KAVITA_API_KEY in .env, then restart.")
    return PrefabApp(view=view, title="Kavita Status")


# --------------------------------------------------------------------------- #
# REST surface (consumed by the webapp; mirrors the MCP tools 1:1)
# --------------------------------------------------------------------------- #


async def health(_request: Request) -> JSONResponse:
    """Liveness probe for start.ps1, the frontend health dot, and Tauri backend-status."""
    return JSONResponse({"status": "ok", "service": SERVICE, "version": VERSION, "mock": MOCK_MODE})


async def api_status(_request: Request) -> JSONResponse:
    """Richer status: uptime is process-scoped, plus tool count and backend mode."""
    return JSONResponse(
        {
            "status": "ok",
            "service": SERVICE,
            "version": VERSION,
            "mock": MOCK_MODE,
            "tool_count": 8,
            "kavita_url": API_URL,
            "kavita_key_configured": bool(API_KEY),
        }
    )


async def api_skills(_request: Request) -> JSONResponse:
    """Skill listing for skill-first Chat (chat_skills_prefab_standard 1.2)."""
    return JSONResponse(
        {
            "skills": [
                {
                    "name": "kavita-expert",
                    "uri": "skill://kavita-mcp/kavita-expert",
                    "description": (
                        "Kavita bridge playbook: list libraries, browse series, track progress. "
                        "MOCK-first until KAVITA_URL is set."
                    ),
                }
            ]
        }
    )


def _probe(url: str, path: str, timeout_s: float = 2.0) -> dict[str, Any]:
    try:
        r = httpx.get(f"{url}{path}", timeout=timeout_s)
        return {"reachable": r.status_code < 500, "status": r.status_code}
    except Exception as exc:  # fail-soft: discovery must never 500
        logger.debug("LLM probe %s%s failed: %s", url, path, exc)
        return {"reachable": False, "status": None}


def _gpu_present() -> tuple[bool, str | None]:
    exe = shutil.which("nvidia-smi")
    if not exe:
        return False, None
    try:
        out = subprocess.run(
            [exe, "--query-gpu=name", "--format=csv,noheader"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        name = (out.stdout or "").strip().splitlines()
        return (True, name[0].strip()) if name and out.returncode == 0 else (False, None)
    except Exception as exc:
        logger.debug("nvidia-smi probe failed: %s", exc)
        return False, None


def _llm_state() -> dict[str, Any]:
    ollama = _probe(OLLAMA_URL, "/api/tags")
    studio = _probe(LMSTUDIO_URL, "/v1/models")
    gpu, gpu_name = _gpu_present()
    return {
        "providers": [
            {"id": "ollama", "label": "Ollama (local, free)", "url": OLLAMA_URL, "detected": ollama["reachable"]},
            {
                "id": "lmstudio",
                "label": "LM Studio (local, free)",
                "url": LMSTUDIO_URL,
                "detected": studio["reachable"],
            },
        ],
        "gpu": {"present": gpu, "name": gpu_name},
        "opportunity": gpu and not (ollama["reachable"] or studio["reachable"]),
    }


async def llm_discover(_request: Request) -> JSONResponse:
    """GET /api/llm/discover — local provider presence + GPU (polled on page mount)."""
    return JSONResponse(_llm_state())


async def llm_providers(request: Request) -> JSONResponse:
    """GET /api/llm/providers — superset of discover (registry shape per WEBAPP_SOTA VI-10)."""
    state = _llm_state()
    state["configured"] = {"cloud": False, "note": "Cloud providers not configured in this build."}
    return JSONResponse(state)


async def llm_models(request: Request) -> JSONResponse:
    """GET /api/llm/models?provider=ollama — live list when reachable, curated fallback."""
    provider = request.query_params.get("provider", "ollama")
    if provider == "ollama":
        try:
            r = httpx.get(f"{OLLAMA_URL}/api/tags", timeout=4.0)
            if r.status_code == 200:
                models = [m.get("name", "?") for m in r.json().get("models", [])]
                return JSONResponse({"provider": provider, "models": models, "live": True})
        except Exception as exc:
            logger.debug("ollama models fetch failed: %s", exc)
        return JSONResponse({"provider": provider, "models": ["llama3.1", "qwen2.5", "mistral"], "live": False})
    try:
        r = httpx.get(f"{LMSTUDIO_URL}/v1/models", timeout=4.0)
        if r.status_code == 200:
            models = [m.get("id", "?") for m in r.json().get("data", [])]
            return JSONResponse({"provider": provider, "models": models, "live": True})
    except Exception as exc:
        logger.debug("lmstudio models fetch failed: %s", exc)
    return JSONResponse({"provider": provider, "models": [], "live": False})


async def llm_onboarding(_request: Request) -> JSONResponse:
    """GET /api/llm/onboarding — starter facts + recommended path for the under-hero cue."""
    state = _llm_state()
    any_llm = any(p["detected"] for p in state["providers"])
    return JSONResponse(
        {
            "kavita_configured": not MOCK_MODE,
            "llm_detected": any_llm,
            "gpu": state["gpu"],
            "recommended": (
                "Connect Kavita (docs/ONBOARDING.md), then install Ollama for free local chat."
                if not any_llm
                else "Chat is ready — pick a provider + model in Settings."
            ),
        }
    )


async def llm_chat(request: Request) -> JSONResponse:
    """POST /api/llm/chat — backend-only chat proxy (keys never leave the server).

    Body: {"provider": "ollama"|"lmstudio", "model": str, "messages": [{"role","content"}]}.
    503 (declared) when no provider is reachable — the frontend shows the onboarding cue instead.
    """
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "invalid JSON body"}, status_code=400)
    provider = str(body.get("provider", "ollama"))
    model = str(body.get("model", ""))
    messages = body.get("messages", [])
    if not isinstance(messages, list) or not messages:
        return JSONResponse({"error": "messages[] required"}, status_code=400)
    try:
        if provider == "lmstudio":
            r = httpx.post(
                f"{LMSTUDIO_URL}/v1/chat/completions",
                json={"model": model, "messages": messages, "stream": False},
                timeout=120.0,
            )
        else:
            r = httpx.post(
                f"{OLLAMA_URL}/api/chat", json={"model": model, "messages": messages, "stream": False}, timeout=120.0
            )
        if r.status_code != 200:
            return JSONResponse({"error": f"provider HTTP {r.status_code}"}, status_code=502)
        data = r.json()
        if provider == "lmstudio":
            reply = (data.get("choices") or [{}])[0].get("message", {}).get("content", "")
        else:
            reply = data.get("message", {}).get("content", "")
        return JSONResponse({"reply": reply, "provider": provider, "model": model})
    except Exception as exc:
        logger.debug("llm_chat proxy failed: %s", exc)
        return JSONResponse(
            {"error": "no LLM provider reachable — install Ollama or start LM Studio (see onboarding)."},
            status_code=503,
        )


async def llm_chat_stream(request: Request) -> StreamingResponse:
    """POST /api/llm/chat/stream — SSE passthrough {(data: {"delta": str})*, data: [DONE]}.

    Same body as /api/llm/chat. 503 event when no provider is reachable.
    """

    async def gen() -> AsyncIterator[str]:
        try:
            body = await request.json()
        except Exception:
            yield 'data: {"error": "invalid JSON body"}\n\n'
            return
        provider = str(body.get("provider", "ollama"))
        model = str(body.get("model", ""))
        messages = body.get("messages", [])
        try:
            if provider == "lmstudio":
                url, payload = (
                    f"{LMSTUDIO_URL}/v1/chat/completions",
                    {
                        "model": model,
                        "messages": messages,
                        "stream": True,
                    },
                )
            else:
                url, payload = f"{OLLAMA_URL}/api/chat", {"model": model, "messages": messages, "stream": True}
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream("POST", url, json=payload) as r:
                    if r.status_code != 200:
                        yield f'data: {{"error": "provider HTTP {r.status_code}"}}\n\n'
                        return
                    async for line in r.aiter_lines():
                        if not line:
                            continue
                        text = line[6:] if line.startswith("data: ") else line
                        if provider == "lmstudio":
                            if text.strip() == "[DONE]":
                                break
                            try:
                                import json as _json

                                delta = (_json.loads(text).get("choices") or [{}])[0].get("delta", {}).get("content")
                                if delta:
                                    yield f'data: {{"delta": {_json.dumps(delta)}}}\n\n'
                            except Exception:
                                continue
                        else:
                            try:
                                import json as _json

                                obj = _json.loads(text)
                                piece = obj.get("message", {}).get("content")
                                if piece:
                                    yield f'data: {{"delta": {_json.dumps(piece)}}}\n\n'
                                if obj.get("done"):
                                    break
                            except Exception:
                                continue
        except Exception as exc:
            logger.debug("llm_chat_stream failed: %s", exc)
            yield 'data: {"error": "no LLM provider reachable"}\n\n'
        yield "data: [DONE]\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")


async def api_shutdown(request: Request) -> JSONResponse:
    """POST /api/shutdown — orderly exit for the fleet launcher pre-restart hook.

    Responds 200 immediately, then exits so crawlers/DB writers checkpoint first.
    (No mid-write workload exists in this repo yet; the hook keeps the contract.)
    """
    logger.warning("POST /api/shutdown — exiting in 500ms")
    loop = asyncio.get_running_loop()
    loop.call_later(0.5, lambda: os._exit(0))
    return JSONResponse({"status": "shutting down", "service": SERVICE})


async def api_diagnostics(_request: Request) -> JSONResponse:
    """GET /api/v1/diagnostics — tool list + system info for CUA-NSIS smoke tests."""
    tools = [t.name for t in await mcp.list_tools()]
    return JSONResponse(
        {
            "service": SERVICE,
            "version": VERSION,
            "mock": MOCK_MODE,
            "tools": tools,
            "rest": ["/api/health", "/api/status", "/api/skills", "/api/llm/*", "/api/v1/diagnostics"],
            "kavita_url": API_URL,
            "errors": [],
        }
    )


# --------------------------------------------------------------------------- #
# App factory (BUG-008 path + BUG-038 lifespan + bare-/mcp rewrite)
# --------------------------------------------------------------------------- #

mcp_app = mcp.http_app(path="/")


@asynccontextmanager
async def lifespan(app: Starlette):  # noqa: ARG001
    """Parent lifespan that also drives the mounted MCP sub-app (BUG-038).

    Uses the sub-app lifespan object directly — .router.lifespan_context does NOT
    start FastMCP 3.4.x session management (verified upstream 2026-10-05).
    """
    async with mcp_app.lifespan(app):
        yield


class _RewriteApp:
    """Thin ASGI wrapper applying the bare-/mcp rewrite ahead of the router."""

    def __init__(self, application: Starlette) -> None:
        self._app = application

    async def __call__(self, scope: Any, receive: Any, send: Any) -> None:
        if scope.get("type") == "http" and scope.get("path") == "/mcp":
            scope = dict(scope)
            scope["path"] = "/mcp/"
            scope["raw_path"] = b"/mcp/"
        await self._app(scope, receive, send)


def create_app() -> _RewriteApp:
    """Build the dual-surface Starlette app (REST routes + mounted MCP at /mcp)."""
    application = Starlette(
        routes=[
            Route("/api/health", health),
            Route("/health", health),
            Route("/api/status", api_status),
            Route("/api/skills", api_skills),
            Route("/api/llm/discover", llm_discover),
            Route("/api/llm/providers", llm_providers),
            Route("/api/llm/models", llm_models),
            Route("/api/llm/onboarding", llm_onboarding),
            Route("/api/llm/chat", llm_chat, methods=["POST"]),
            Route("/api/llm/chat/stream", llm_chat_stream, methods=["POST"]),
            Route("/api/shutdown", api_shutdown, methods=["POST"]),
            Route("/api/v1/diagnostics", api_diagnostics),
            Mount("/mcp", app=mcp_app),
        ],
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=EXPLICIT_ORIGINS,
        allow_origin_regex=ORIGIN_REGEX,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    return _RewriteApp(application)


def run() -> None:
    """Entry point: stdio by default (Claude Desktop), HTTP with --port/--http (launcher)."""
    import sys

    args = sys.argv[1:]
    http = "--http" in args
    port = BACKEND_PORT
    if "--port" in args:
        idx = args.index("--port")
        try:
            port = int(args[idx + 1])
        except (IndexError, ValueError):
            logger.warning("Invalid --port value; falling back to %d", BACKEND_PORT)
        http = True
    if not http and os.getenv("MCP_PORT"):
        try:
            port = int(os.getenv("MCP_PORT", str(port)))
            http = True
        except ValueError:
            pass
    if http:
        logger.info("Starting %s HTTP on %d (REST /api, MCP /mcp)", SERVICE, port)
        import uvicorn

        uvicorn.run(create_app(), host="127.0.0.1", port=port)
    else:
        logger.info("Starting %s over stdio", SERVICE)
        mcp.run()


if __name__ == "__main__":
    run()
