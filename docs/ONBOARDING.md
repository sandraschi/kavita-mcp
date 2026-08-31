
# Onboarding - kavita-mcp

## What this is for
Kavita eBook/comics/manga server bridge. Bridges your self-hosted server to Claude/Cursor via MCP. Lets you list libraries, browse series, track progress, and read via OPDS. Not a replacement for Calibre - sidecar for comics/manga sharing.

## Cost and accounts (money / CC)
| Question | Answer |
| Do I need an account? | Yes - Komga/Kavita admin account on your server |
| Free tier? | Self-hosted, free forever |
| Credit card required? | No |
| Ongoing cost? | Free (your hardware/electricity) |
| Who bills? | None |

## Prerequisites outside this repo
- Server running (Docker recommended: gotson/komga or jvmilazz0/kavita)
- Admin login & API key / user pass
- Library folders mounted
- uv + bun installed (start.ps1 installs if missing)

## First-timer setup steps
1. `docker run -d -p 25600:25600 gotson/komga` or kavita equivalent
2. Open server web UI, create admin, create library
3. Copy API key / password
4. `copy .env.example .env` and fill KAVITA_URL
5. `uv sync && start.ps1`
6. Open http://127.0.0.1:11190 - green dot means connected, MOCK badge if not.

## Pitfalls (read before you click Publish)
- MOCK mode returns Joe Mocky/Sandra Mockinger data until env configured - not live.
- Komga NextUI beta: refresh loads old UI, not a bug.
- Kavita JWT expiry: re-login if 401.
- Firewall: keep backend/frontend ports open.
