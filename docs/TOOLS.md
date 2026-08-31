# Tools — kavita-mcp

| Tool | Operations | Params |
|------|------------|--------|
| `kavita_library` | `list`, `get`, `scan` | `library_id?`, `limit`, `offset` |
| `kavita_series` | `list`, `search`, `get`, `get_chapters` | `series_id?`, `query?` |
| `kavita_reading` | `get_progress`, `mark_progress`, `get_bookmarks` | `series_id?`, `volume_id?`, `progress?` |
| `kavita_users` | `list`, `get` | `user_id?` |
| `kavita_system` | `status` | — |
| `show_kavita_status_prefab` | — | Prefab card |

All paginated, mock-first (MOCK badges). See `src/kavita_mcp/tools/kavita_tools.py`.
