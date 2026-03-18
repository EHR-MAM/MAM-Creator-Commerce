"""Product catalog endpoint tests."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_products_public(client: AsyncClient):
    resp = await client.get("/products")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_create_product_requires_admin(client: AsyncClient, influencer_token: str):
    resp = await client.post(
        "/products",
        json={"sku": "TEST-403", "name": "Forbidden Wig", "price": "100.00", "currency": "GHS", "category": "hair", "inventory_count": 1},
        headers={"Authorization": f"Bearer {influencer_token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_create_and_get_product(client: AsyncClient, admin_token: str):
    # Create vendor first
    vendor_resp = await client.post(
        "/vendors",
        json={"business_name": "Prod Test Vendor", "location": "Accra", "email": "prodvendor@test.com", "password": "Vendor1234!"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert vendor_resp.status_code == 201, vendor_resp.text
    vendor_id = vendor_resp.json()["id"]

    resp = await client.post(
        "/products",
        json={"sku": "TEST-WIG-001", "name": "Test Wig", "description": "A beautiful wig", "price": "150.00", "currency": "GHS", "category": "hair", "inventory_count": 10, "vendor_id": vendor_id},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["name"] == "Test Wig"
    product_id = data["id"]

    resp2 = await client.get(f"/products/{product_id}")
    assert resp2.status_code == 200
    assert resp2.json()["id"] == product_id


@pytest.mark.asyncio
async def test_create_product_inventory_validation(client: AsyncClient, admin_token: str):
    vendor_resp = await client.post(
        "/vendors",
        json={"business_name": "Val Vendor", "location": "Accra", "email": "valvendor@test.com", "password": "Vendor1234!"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    vendor_id = vendor_resp.json()["id"]
    resp = await client.post(
        "/products",
        json={"sku": "TEST-WIG-BAD", "name": "Bad Wig", "price": "100.00", "currency": "GHS", "category": "hair", "inventory_count": -5, "vendor_id": vendor_id},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 422
