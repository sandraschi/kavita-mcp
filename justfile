
set windows-shell := ["powershell.exe", "-NoProfile", "-Command"]
default:
    @just --list
sync:
    uv sync
bootstrap:
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/bootstrap.ps1
lint:
    uv run ruff check .
fmt:
    uv run ruff check . --fix
    uv run ruff format .
typecheck:
    uv run pyright src/
test:
    uv run pytest -q
build-web:
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/build-web.ps1
check-web:
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/check-web.ps1
gates-green:
    just lint
    just typecheck
    just test
    just check-web
    @echo "ALL GATES GREEN"
ci: lint test
    @echo "CI green"
serve:
    uv run python -m kavita_mcp.server --http
serve-stdio:
    uv run python -m kavita_mcp.server
mcpb-pack:
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/mcpb-pack.ps1
