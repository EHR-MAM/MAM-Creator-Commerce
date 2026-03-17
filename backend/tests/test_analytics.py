"""Analytics endpoint tests — event ingestion, KPI report, daily rollup."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_ingest_event_no_auth(client: AsyncClient):
    """Public can POST analytics events (storefront view from browser)."""
    resp = await client.post("/analytics/events", json={
        "event_name": "storefront.viewed",
        "entity_type": "influencer",
        "payload": {"creator_handle": "sweet200723", "utm_source": "tiktok"},
    })
    assert resp.status_code == 201
    assert resp.json()["status"] == "recorded"


@pytest.mark.asyncio
async def test_kpis_requires_admin(client: AsyncClient, influencer_token: str):
    resp = await client.get(
        "/analytics/reports/kpis",
        headers={"Authorization": f"Bearer {influencer_token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_kpis_admin(client: AsyncClient, admin_token: str):
    resp = await client.get(
        "/analytics/reports/kpis",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "total_orders" in data
    assert "total_gmv_GHS" in data
    assert "delivery_success_rate" in data


@pytest.mark.asyncio
async def test_daily_trend_report(client: AsyncClient, admin_token: str):
    # Ingest a few events first
    for _ in range(3):
        await client.post("/analytics/events", json={
            "event_name": "storefront.viewed",
            "payload": {"utm_source": "tiktok"},
        })

    resp = await client.get(
        "/analytics/reports/daily?days=7",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    # At least today's row should have storefront_views >= 3
    if data:
        total_views = sum(row["storefront_views"] for row in data)
        assert total_views >= 3


@pytest.mark.asyncio
async def test_attribution_breakdown(client: AsyncClient, admin_token: str):
    resp = await client.get(
        "/analytics/reports/attribution",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    for row in data:
        assert "source" in row
        assert "views" in row
