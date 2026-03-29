"""
Supabase REST client — replaces SQLAlchemy/asyncpg.

Uses httpx to call the PostgREST API at /rest/v1/{table}.
Service key is used for all server-side operations (bypasses RLS).
"""
import httpx
from typing import Any, Optional
from app.core.config import settings

HEADERS = {
    "apikey": settings.SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",  # always return the upserted/inserted row
}


class SupabaseClient:
    def __init__(self):
        self.base = f"{settings.SUPABASE_URL}/rest/v1"
        self._client: Optional[httpx.AsyncClient] = None

    async def client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(headers=HEADERS, timeout=15.0)
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    # ── SELECT ──────────────────────────────────────────────────────────────

    async def select(
        self,
        table: str,
        filters: Optional[dict] = None,
        *,
        columns: str = "*",
        order: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        single: bool = False,
    ) -> Any:
        """
        GET /rest/v1/{table}?col=eq.value&select=...
        Returns list of dicts, or single dict if single=True.
        """
        c = await self.client()
        params: dict = {"select": columns}
        if filters:
            for key, val in filters.items():
                params[key] = val
        if order:
            params["order"] = order
        if limit is not None:
            params["limit"] = limit
        if offset is not None:
            params["offset"] = offset

        headers = dict(HEADERS)
        if single:
            headers["Accept"] = "application/vnd.pgrst.object+json"

        r = await c.get(f"{self.base}/{table}", params=params, headers=headers)
        _raise(r)
        return r.json()

    async def select_one(self, table: str, filters: dict) -> Optional[dict]:
        """Convenience: returns first match or None."""
        rows = await self.select(table, filters, limit=1)
        return rows[0] if rows else None

    # ── INSERT ──────────────────────────────────────────────────────────────

    async def insert(self, table: str, data: dict) -> dict:
        """POST /rest/v1/{table} — returns inserted row."""
        c = await self.client()
        r = await c.post(f"{self.base}/{table}", json=_clean(data))
        _raise(r)
        result = r.json()
        return result[0] if isinstance(result, list) else result

    async def insert_many(self, table: str, rows: list[dict]) -> list[dict]:
        c = await self.client()
        r = await c.post(f"{self.base}/{table}", json=[_clean(d) for d in rows])
        _raise(r)
        return r.json()

    # ── UPDATE ──────────────────────────────────────────────────────────────

    async def update(self, table: str, filters: dict, data: dict) -> list[dict]:
        """PATCH /rest/v1/{table}?col=eq.val — returns updated rows."""
        c = await self.client()
        params = {k: v for k, v in filters.items()}
        r = await c.patch(f"{self.base}/{table}", params=params, json=_clean(data))
        _raise(r)
        return r.json()

    async def update_one(self, table: str, filters: dict, data: dict) -> Optional[dict]:
        rows = await self.update(table, filters, data)
        return rows[0] if rows else None

    # ── DELETE ──────────────────────────────────────────────────────────────

    async def delete(self, table: str, filters: dict) -> list[dict]:
        c = await self.client()
        params = {k: v for k, v in filters.items()}
        r = await c.delete(f"{self.base}/{table}", params=params)
        _raise(r)
        return r.json()

    # ── RPC (Postgres functions) ─────────────────────────────────────────────

    async def rpc(self, fn: str, params: dict) -> Any:
        c = await self.client()
        r = await c.post(f"{self.base}/rpc/{fn}", json=params)
        _raise(r)
        return r.json()


# ── Helpers ──────────────────────────────────────────────────────────────────

def _raise(r: httpx.Response):
    if r.status_code >= 400:
        raise httpx.HTTPStatusError(
            f"Supabase {r.status_code}: {r.text[:300]}",
            request=r.request,
            response=r,
        )


def _clean(d: dict) -> dict:
    """Remove None values and convert non-serialisable types to str."""
    out = {}
    for k, v in d.items():
        if v is None:
            continue
        import uuid as _uuid
        from decimal import Decimal
        from datetime import datetime
        if isinstance(v, _uuid.UUID):
            out[k] = str(v)
        elif isinstance(v, Decimal):
            out[k] = str(v)
        elif isinstance(v, datetime):
            out[k] = v.isoformat()
        else:
            out[k] = v
    return out


# Singleton — shared across all requests
_sb = SupabaseClient()


async def get_sb() -> SupabaseClient:
    """FastAPI dependency — yields the shared Supabase client."""
    return _sb
