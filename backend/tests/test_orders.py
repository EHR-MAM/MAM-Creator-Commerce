"""Order creation and state machine tests.

These are integration tests — they create a vendor, product, influencer,
then place and advance an order through the full lifecycle.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_order_state_machine(client: AsyncClient, admin_token: str):
    """Create a product, place an order, advance through all valid states."""

    # 1. Create a vendor
    vendor_resp = await client.post(
        "/vendors",
        json={
            "name": "Test Vendor GH",
            "contact_email": "tv@test.com",
            "region": "Accra",
            "whatsapp_number": "+233501234567",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert vendor_resp.status_code == 201, vendor_resp.text
    vendor_id = vendor_resp.json()["id"]

    # 2. Create an influencer record (register user first)
    await client.post("/auth/register", json={
        "email": "inf_order@test.com",
        "password": "Inf1234!",
        "name": "Test Influencer",
        "role": "influencer",
    })
    inf_login = await client.post("/auth/login", json={"email": "inf_order@test.com", "password": "Inf1234!"})
    inf_token = inf_login.json()["access_token"]

    inf_resp = await client.post(
        "/influencers",
        json={"handle": "test_inf_order", "platform_name": "tiktok", "audience_region": "Ghana"},
        headers={"Authorization": f"Bearer {inf_token}"},
    )
    assert inf_resp.status_code == 201, inf_resp.text
    influencer_id = inf_resp.json()["id"]

    # 3. Create a product
    product_resp = await client.post(
        "/products",
        json={
            "name": "Order Test Product",
            "price": "100.00",
            "currency": "GHS",
            "category": "accessories",
            "inventory_count": 5,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert product_resp.status_code == 201, product_resp.text
    product_id = product_resp.json()["id"]

    # 4. Place order
    order_resp = await client.post(
        f"/orders?influencer_id={influencer_id}&vendor_id={vendor_id}",
        json={
            "items": [{"product_id": product_id, "quantity": 1}],
            "source_channel": "tiktok",
        },
    )
    assert order_resp.status_code == 201, order_resp.text
    order = order_resp.json()
    order_id = order["id"]
    assert order["status"] == "pending"
    assert float(order["total"]) == 120.00  # 100 + 20 delivery

    # 5. Advance through states
    for transition in ["confirmed", "processing", "shipped", "delivered"]:
        resp = await client.patch(
            f"/orders/{order_id}/status",
            json={"status": transition},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200, f"Transition to {transition} failed: {resp.text}"
        assert resp.json()["status"] == transition

    # 6. After delivery, commission should exist
    commissions_resp = await client.get(
        "/commissions",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert commissions_resp.status_code == 200
    commissions = commissions_resp.json()
    order_commissions = [c for c in commissions if c["order_id"] == order_id]
    assert len(order_commissions) == 1
    assert order_commissions[0]["commission_status"] == "payable"


@pytest.mark.asyncio
async def test_invalid_status_transition(client: AsyncClient, admin_token: str):
    """Cannot skip states (pending → shipped is invalid)."""
    # Create minimal order setup
    vendor_resp = await client.post(
        "/vendors",
        json={"name": "Skip Vendor", "contact_email": "skip@test.com", "region": "Accra"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    vendor_id = vendor_resp.json()["id"]

    product_resp = await client.post(
        "/products",
        json={"name": "Skip Product", "price": "50.00", "currency": "GHS",
              "category": "test", "inventory_count": 3},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = product_resp.json()["id"]

    # Need an influencer_id — reuse from any existing or create one
    await client.post("/auth/register", json={
        "email": "inf_skip@test.com", "password": "Skip1234!",
        "name": "Skip Inf", "role": "influencer",
    })
    skip_login = await client.post("/auth/login", json={"email": "inf_skip@test.com", "password": "Skip1234!"})
    skip_token = skip_login.json()["access_token"]
    inf_resp = await client.post(
        "/influencers",
        json={"handle": "skip_inf", "platform_name": "tiktok", "audience_region": "Ghana"},
        headers={"Authorization": f"Bearer {skip_token}"},
    )
    influencer_id = inf_resp.json()["id"]

    order_resp = await client.post(
        f"/orders?influencer_id={influencer_id}&vendor_id={vendor_id}",
        json={"items": [{"product_id": product_id, "quantity": 1}], "source_channel": "direct"},
    )
    order_id = order_resp.json()["id"]

    # Try invalid transition: pending → shipped
    resp = await client.patch(
        f"/orders/{order_id}/status",
        json={"status": "shipped"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 400
