from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import aiosqlite
from fastapi import Request

DB_PATH = Path(__file__).parent.parent / "data" / "meta.db"


async def init_db(conn: aiosqlite.Connection) -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS collection_meta (
            name          TEXT PRIMARY KEY,
            system_prompt TEXT NOT NULL DEFAULT '',
            created_at    TEXT NOT NULL
        )
    """)
    await conn.commit()


async def upsert_meta(conn: aiosqlite.Connection, name: str, system_prompt: str) -> None:
    now = datetime.now(timezone.utc).isoformat()
    await conn.execute(
        """
        INSERT INTO collection_meta (name, system_prompt, created_at)
        VALUES (?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET system_prompt = excluded.system_prompt
        """,
        (name, system_prompt, now),
    )
    await conn.commit()


async def get_system_prompt(conn: aiosqlite.Connection, name: str) -> str | None:
    async with conn.execute(
        "SELECT system_prompt FROM collection_meta WHERE name = ?", (name,)
    ) as cursor:
        row = await cursor.fetchone()
        return row[0] if row else None


async def delete_meta(conn: aiosqlite.Connection, name: str) -> None:
    await conn.execute("DELETE FROM collection_meta WHERE name = ?", (name,))
    await conn.commit()


async def get_all_meta(conn: aiosqlite.Connection) -> dict[str, str]:
    async with conn.execute("SELECT name, system_prompt FROM collection_meta") as cursor:
        return {row[0]: row[1] async for row in cursor}


def get_db(request: Request) -> aiosqlite.Connection:
    return request.app.state.db
