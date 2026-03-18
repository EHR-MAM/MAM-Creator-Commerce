"""Order creation and state machine tests."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_order_state_machine(client: AsyncClient, admin_token: str):
    """Create a product, place an order, advance through all valid states."""

    # 1. Create vendor
    vendor_resp = await client.post(
        "/vendors",
        json={"business_name": "Test Vendor GH", "location": "Accra", "email": "tv_sm@test.com", "password": "Vendor1234!"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert vendor_resp.status_code == 201, vendor_resp.text
    vendor_id = vendor_resp.json()["id"]

    # 2. Create influencer via admin
    inf_resp = await client.post(
        "/influencers",
        json={"name": "Test Inf", "handle": "testinf", "email": "testinf@test.com", "password": "Inf1234!", "platform": "tiktok"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert inf_resp.status_code == 201, inf_resp.text
    influencer_id = inf_resp.json()["id"]

    # 3. Create product
    product_resp = await client.post(
        "/products",
        json={"sku": "WIG-SM-001", "name": "SM Test Wig", "price": "150.00", "currency": "GHS", "category": "hair", "inventory_count": 10, "vendor_id": vendor_id},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert product_resp.status_code == 201, product_resp.text
    product_id = product_resp.json()["id"]

    # 4. Place order
    order_resp = await client.post(
        f"/orders?influencer_id={influencer_id}&vendor_id={vendor_id}",
        json={
            "items": [{"product_id": product_id, "quantity": 1}],
            "customer_name": "Ama Mensah",
            "customer_phone": "+233201234567",
            "delivery_address": "Accra, Ghana",
        },
    )
    assert order_resp.status_code == 201, order_resp.text
    order_id = order_resp.json()["id"]

    # 5. Advance states
    for next_status in ["confirmed", "processing", "shipped", "delivered"]:
        r = await client.patch(
            f"/orders/{order_id}/status",
            json={"status": next_status},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200, f"Failed to advance to {next_status}: {r.text}"


@pytest.mark.asyncio
async def test_invalid_status_transition(client: AsyncClient, admin_token: str):
    """Cannot jump from pending directly to delivered."""
    vendor_resp = await client.post(
        "/vendors",
        json={"business_name": "Bad Trans Vendor", "location": "Kumasi", "email": "btv2@test.com", "password": "Vendor1234!"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    vendor_id = vendor_resp.json()["id"]

    inf_resp = await client.post(
        "/influencers",
        json={"name": "Bad Inf", "handle": "badinf", "email": "badinf@test.com", "password": "Inf1234!", "platform": "tiktok"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    influencer_id = inf_resp.json()["id"]

    product_resp = await client.post(
        "/products",
        json={"sku": "WIG-BAD-002", "name": "Bad Wig", "price": "100.00", "currency": "GHS", "category": "hair", "inventory_count": 5, "vendor_id": vendor_id},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = product_resp.json()["id"]

    order_resp = await client.post(
        f"/orders?influencer_id={influencer_id}&vendor_id={vendor_id}",
        json={
            "items": [{"product_id": product_id, "quantity": 1}],
            "customer_name": "Kofi Test",
            "customer_phone": "+233209999999",
            "delivery_address": "Kumasi, Ghana",
        },
    )
    order_id = order_resp.json()["id"]

    r = await client.patch(
        f"/orders/{order_id}/status",
        json={"status": "delivered"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code in (400, 422), r.text
