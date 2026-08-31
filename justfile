
set windows-shell := ["powershell.exe", "-NoProfile", "-Command"]
default:
    @just --list
sync:
    uv sync
lint:
    uv run ruff check .
fmt:
    uv run ruff check . --fix
    uv run ruff format .
test:
    uv run pytest -q
ci: lint test
    @echo "CI green"
serve:
    uv run python -m kavita_mcp.server
mcpb-pack:
    pwsh.exe -NoProfile -ExecutionPolicy Bypass -File scripts/mcpb-pack.ps1
