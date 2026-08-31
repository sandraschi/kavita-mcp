import pytest

from kavita_mcp.tools.kavita_tools import kavita_library


@pytest.mark.asyncio
async def test_list():
    r = await kavita_library("list")
    assert r["success"] is True
    assert "items" in r["result"]
