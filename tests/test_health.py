import pytest

from kavita_mcp.tools.kavita_tools import kavita_system


@pytest.mark.asyncio
async def test_status():
    r = await kavita_system("status")
    assert r["success"] is True
    assert "mock" in r or "MOCK" in r["message"]
