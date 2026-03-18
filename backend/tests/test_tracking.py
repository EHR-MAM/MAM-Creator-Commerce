"""Tracking link tests — create, list, redirect, click counting."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_tracking_link(client: AsyncClient, influencer_token: str, influencer_record: dict):
    """Influencer can create a tracking link."""
    resp = await client.post(
        "/tracking/links",
        json={"label": "TikTok post Mar 15"},
        headers={"Authorization": f"Bearer {influencer_token}"},
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["label"] == "TikTok post Mar 15"
    assert "short_url" in data
    assert data["click_count"] == 0
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_list_tracking_links(client: AsyncClient, influencer_token: str, influencer_record: dict):
    resp = await client.get(
        "/tracking/links",
        headers={"Authorization": f"Bearer {influencer_token}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_redirect_increments_click(client: AsyncClient, influencer_token: str, influencer_record: dict):
    link_resp = await client.post(
        "/tracking/links",
        json={"label": "Click Test Link"},
        headers={"Authorization": f"Bearer {influencer_token}"},
    )
    assert link_resp.status_code == 201, link_resp.text
    code = link_resp.json()["code"]

    resp = await client.get(f"/tracking/r/{code}", follow_redirects=False)
    assert resp.status_code == 302

    links_resp = await client.get(
        "/tracking/links",
        headers={"Authorization": f"Bearer {influencer_token}"},
    )
    links = links_resp.json()
    matching = [lnk for lnk in links if lnk["code"] == code]
    assert len(matching) == 1
    assert matching[0]["click_count"] == 1


@pytest.mark.asyncio
async def test_deactivate_link(client: AsyncClient, influencer_token: str, influencer_record: dict):
    link_resp = await client.post(
        "/tracking/links",
        json={"label": "Deactivate Me"},
        headers={"Authorization": f"Bearer {influencer_token}"},
    )
    assert link_resp.status_code == 201, link_resp.text
    link_id = link_resp.json()["id"]
    code = link_resp.json()["code"]

    resp = await client.patch(
        f"/tracking/links/{link_id}/deactivate",
        headers={"Authorization": f"Bearer {influencer_token}"},
    )
    assert resp.status_code == 200

    resp2 = await client.get(f"/tracking/r/{code}", follow_redirects=False)
    assert resp2.status_code == 404


@pytest.mark.asyncio
async def test_unknown_link_code_404(client: AsyncClient):
    resp = await client.get("/tracking/r/BADCODE00", follow_redirects=False)
    assert resp.status_code == 404
