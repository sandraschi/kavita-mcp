
# kavita-mcp

Kavita eBook/comics/manga server bridge

**Ports:** Backend 11189 (REST /api, MCP /mcp) / Frontend 11190 (Vite)

## How it runs
Headless via `start.ps1` (zombie clears ports). Webapp optional. MCP via stdio or HTTP.

## Hands-in / Hands-out
Hands-in: webapp + Claude tools. Hands-out: headless `uv run python -m kavita_mcp.server`.

## Documentation
| Doc | Link |
| Onboarding | docs/ONBOARDING.md |
| Configuration | docs/CONFIGURATION.md |
| Tools | docs/TOOLS.md |

## Tools
Portmanteau + prefab card. See docs/TOOLS.md.

## Install
See INSTALL.md then docs/ONBOARDING.md.

## Preview
![Dashboard](docs/screenshots/dashboard.png)

## Onboarding
Requires server - see docs/ONBOARDING.md.
