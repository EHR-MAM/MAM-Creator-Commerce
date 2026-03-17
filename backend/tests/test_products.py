"""Product catalog endpoint tests."""
import pytest
from httpx import AsyncClient


PRODUCT_PAYLOAD = {
    "name": "Test Wig",
    "description": "A beautiful test wig",
    "price": "150.00",
    "currency": "GHS",
    "category": "hair",
    "inventory_count": 10,
}


@pytest.mark.asyncio
async def test_list_products_public(client: AsyncClient):
    """Public can list active products (no auth required)."""
    resp = await client.get("/products")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_create_product_requires_admin(client: AsyncClient, influencer_token: str):
    resp = await client.post(
        "/products",
        json=PRODUCT_PAYLOAD,
        headers={"Authorization": f"Bearer {influencer_token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_create_and_get_product(client: AsyncClient, admin_token: str):
    resp = await client.post(
        "/products",
        json=PRODUCT_PAYLOAD,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Wig"
    assert data["status"] == "active"
    product_id = data["id"]

    # Get by ID
    resp2 = await client.get(f"/products/{product_id}")
    assert resp2.status_code == 200
    assert resp2.json()["id"] == product_id


@pytest.mark.asyncio
async def test_create_product_inventory_validation(client: AsyncClient, admin_token: str):
    bad_payload = {**PRODUCT_PAYLOAD, "inventory_count": -5}
    resp = await client.post(
        "/products",
        json=bad_payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 422
