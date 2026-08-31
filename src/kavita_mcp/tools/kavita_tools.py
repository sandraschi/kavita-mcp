import logging
from typing import Annotated, Literal

from pydantic import Field

logger = logging.getLogger(__name__)
MOCK_LIBS = [{"id": 1, "name": "Mock Manga - Joe Mocky"}, {"id": 2, "name": "Sandra Mockinger Library"}]
MOCK_SERIES = [
    {"id": 1, "name": "Mock Berserk - Joe Mocky", "libraryId": 1},
    {"id": 2, "name": "Sandra Mockinger Saga", "libraryId": 2},
]
MOCK_BOOKS = [{"id": 1, "title": "Vol 1", "seriesId": 1}, {"id": 2, "title": "Vol 2", "seriesId": 1}]


def _error(msg, typ="general"):
    logger.exception("Tool error %s [%s]", msg, typ)
    return {
        "success": False,
        "error": msg,
        "error_type": typ,
        "suggestions": ["Set KAVITA_URL and KAVITA_API_KEY", "MOCK returns mock"],
    }


async def kavita_library(
    operation: Annotated[Literal["list", "get", "scan"], Field(description="Op")] = "list",
    library_id: int | None = None,
    limit: int = 50,
    offset: int = 0,
):
    """[RATIONALE] Portmanteau for Kavita libraries.
    ## Return Format
    {"success": bool, "message": str, "result": {"items": list, "has_more": bool}}
    """
    try:
        if operation == "list":
            items = MOCK_LIBS[offset : offset + limit]
            return {
                "success": True,
                "message": f"{len(items)} libs (MOCK)",
                "result": {"items": items, "has_more": False, "total": len(items)},
                "mock": True,
            }
        if operation == "get":
            for x in MOCK_LIBS:
                if x["id"] == library_id:
                    return {"success": True, "message": x["name"], "result": x, "mock": True}
            return _error("not found", "not_found")
        if operation == "scan":
            return {
                "success": True,
                "message": f"Scan queued for {library_id} (MOCK)",
                "result": {"library_id": library_id},
                "mock": True,
            }
    except Exception as e:
        return _error(str(e))


async def kavita_series(
    operation: Annotated[Literal["list", "search", "get", "get_chapters"], Field(description="Op")] = "list",
    series_id: int | None = None,
    query: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    try:
        if operation == "list":
            items = MOCK_SERIES[offset : offset + limit]
            return {
                "success": True,
                "message": f"{len(items)} series (MOCK)",
                "result": {"items": items, "has_more": False},
                "mock": True,
            }
        if operation == "search":
            items = [s for s in MOCK_SERIES if query and query.lower() in s["name"].lower()]
            return {"success": True, "message": f"Found {len(items)}", "result": {"items": items}, "mock": True}
        if operation == "get":
            for s in MOCK_SERIES:
                if s["id"] == series_id:
                    return {"success": True, "message": s["name"], "result": s, "mock": True}
            return _error("not found", "not_found")
        if operation == "get_chapters":
            return {
                "success": True,
                "message": f"Chapters for {series_id} (MOCK)",
                "result": {"items": MOCK_BOOKS},
                "mock": True,
            }
    except Exception as e:
        return _error(str(e))


async def kavita_reading(
    operation: Annotated[
        Literal["get_progress", "mark_progress", "get_bookmarks"], Field(description="Op")
    ] = "get_progress",
    series_id: int | None = None,
    volume_id: int | None = None,
    progress: float | None = None,
):
    try:
        if operation == "get_progress":
            return {"success": True, "message": "Progress 0.5 (MOCK)", "result": {"progress": 0.5}, "mock": True}
        if operation == "mark_progress":
            return {
                "success": True,
                "message": f"Marked {progress} (MOCK)",
                "result": {"progress": progress},
                "mock": True,
            }
        if operation == "get_bookmarks":
            return {
                "success": True,
                "message": "1 bookmark (MOCK)",
                "result": {"items": [{"id": 1, "page": 5}]},
                "mock": True,
            }
    except Exception as e:
        return _error(str(e))


async def kavita_users(
    operation: Annotated[Literal["list", "get"], Field(description="Op")] = "list", user_id: int | None = None
):
    try:
        mock = [{"id": 1, "username": "Joe Mocky"}, {"id": 2, "username": "Sandra Mockinger"}]
        if operation == "list":
            return {"success": True, "message": "2 users (MOCK)", "result": {"items": mock}, "mock": True}
        for u in mock:
            if u["id"] == user_id:
                return {"success": True, "message": u["username"], "result": u, "mock": True}
        return _error("not found", "not_found")
    except Exception as e:
        return _error(str(e))


async def kavita_system(operation: Annotated[Literal["status"], Field(description="Op")] = "status"):
    try:
        return {
            "success": True,
            "message": "Kavita MOCK status - configure KAVITA_URL",
            "result": {"status": "mock", "version": "MOCK v0.9.1", "mock": True},
            "mock": True,
        }
    except Exception as e:
        return _error(str(e))
