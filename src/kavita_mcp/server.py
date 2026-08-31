import logging
import os

from fastmcp import FastMCP
from starlette.applications import Starlette
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from starlette.routing import Route

from .tools.kavita_tools import kavita_library, kavita_reading, kavita_series, kavita_system, kavita_users

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
mcp = FastMCP("kavita-mcp")


@mcp.tool(annotations={"readOnlyHint": True})
async def kavita_library_tool(operation: str = "list", library_id: int | None = None, limit: int = 50, offset: int = 0):
    return await kavita_library(operation, library_id, limit, offset)


@mcp.tool(annotations={"readOnlyHint": True})
async def kavita_series_tool(
    operation: str = "list", series_id: int | None = None, query: str | None = None, limit: int = 50, offset: int = 0
):
    return await kavita_series(operation, series_id, query, limit, offset)


@mcp.tool(annotations={})
async def kavita_reading_tool(
    operation: str = "get_progress",
    series_id: int | None = None,
    volume_id: int | None = None,
    progress: float | None = None,
):
    return await kavita_reading(operation, series_id, volume_id, progress)


@mcp.tool(annotations={"readOnlyHint": True})
async def kavita_users_tool(operation: str = "list", user_id: int | None = None):
    return await kavita_users(operation, user_id)


@mcp.tool(annotations={"readOnlyHint": True})
async def kavita_system_tool(operation: str = "status"):
    return await kavita_system(operation)


@mcp.tool(app=True)
async def show_kavita_status_prefab():
    from fastmcp.tools import ToolResult
    from prefab_ui import Badge, Card, CardContent, CardHeader, CardTitle, PrefabApp, Text

    data = await kavita_system("status")
    app = PrefabApp(
        title="Kavita Status",
        cards=[
            Card(
                children=[
                    CardHeader(children=[CardTitle(text="Kavita MOCK")]),
                    CardContent(children=[Text(text=data["message"]), Badge(text="MOCK", variant="secondary")]),
                ]
            )
        ],
    )
    return ToolResult(content=str(data), structured_content=app)


async def health(request):
    return JSONResponse(
        {"status": "ok", "service": "kavita-mcp", "version": "0.1.0", "mock": os.getenv("MOCK_MODE", "1") == "1"}
    )


def create_app():
    app = Starlette(routes=[Route("/api/health", health), Route("/health", health)])
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://127.0.0.1:11190", "http://localhost:11190", "http://127.0.0.1:11189"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    return app


def run():
    import sys

    port = 11189
    if "--port" in sys.argv:
        port = int(sys.argv[sys.argv.index("--port") + 1])
    mcp.settings.port = port
    mcp.settings.host = "127.0.0.1"
    logger.info(f"Starting kavita-mcp on {port}")
    mcp.run(transport="http", port=port, host="127.0.0.1")


if __name__ == "__main__":
    run()
