"""
Seed script — run once to populate pilot data
Usage: python seed.py

Creates:
- Admin user (David Bezar)
- Christiana's influencer account
- 3 placeholder vendors
- 12 pilot SKUs
- Christiana's first campaign
"""
import asyncio
from decimal import Decimal
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.influencer import Influencer
from app.models.vendor import Vendor
from app.models.product import Product
from app.models.campaign import Campaign, ProductCampaignLink


async def seed():
    async with AsyncSessionLocal() as db:

        # ── Admin user (David Bezar) ──────────────────────────────────────
        admin = User(
            role="admin",
            name="David Bezar",
            email="airatpack@gmail.com",
            hashed_password=hash_password("ChangeMe2025!"),
            status="active",
        )
        db.add(admin)
        await db.flush()
        print(f"✓ Admin created: {admin.email}")

        # ── Christiana's user account ─────────────────────────────────────
        christiana_user = User(
            role="influencer",
            name="Christiana Amankwaah",
            email="uchik9935@gmail.com",
            hashed_password=hash_password("ChangeMe2025!"),
            status="active",
        )
        db.add(christiana_user)
        await db.flush()

        christiana = Influencer(
            user_id=christiana_user.id,
            handle="sweet200723",
            platform_name="tiktok",
            audience_region="Ghana",
            payout_method="momo",
            status="active",
        )
        db.add(christiana)
        await db.flush()
        print(f"✓ Influencer created: @{christiana.handle} (id: {christiana.id})")

        # ── Vendor 1: Fashion ─────────────────────────────────────────────
        vendor1_user = User(
            role="vendor",
            name="Accra Style Hub",
            email="accastylehub@example.com",
            hashed_password=hash_password("ChangeMe2025!"),
            status="active",
        )
        db.add(vendor1_user)
        await db.flush()

        vendor1 = Vendor(
            user_id=vendor1_user.id,
            business_name="Accra Style Hub",
            location="East Legon, Accra",
            contact_phone="+233200000001",
            fulfillment_sla_hours=48,
            status="active",
        )
        db.add(vendor1)
        await db.flush()
        print(f"✓ Vendor 1: {vendor1.business_name}")

        # ── Vendor 2: Hair ────────────────────────────────────────────────
        vendor2_user = User(
            role="vendor",
            name="Ghana Wig Queen",
            email="ghanawigsqueen@example.com",
            hashed_password=hash_password("ChangeMe2025!"),
            status="active",
        )
        db.add(vendor2_user)
        await db.flush()

        vendor2 = Vendor(
            user_id=vendor2_user.id,
            business_name="Ghana Wig Queen",
            location="Spintex Road, Accra",
            contact_phone="+233200000002",
            fulfillment_sla_hours=72,
            status="active",
        )
        db.add(vendor2)
        await db.flush()
        print(f"✓ Vendor 2: {vendor2.business_name}")

        # ── Vendor 3: Accessories ─────────────────────────────────────────
        vendor3_user = User(
            role="vendor",
            name="Gold Coast Accessories",
            email="goldcoastacc@example.com",
            hashed_password=hash_password("ChangeMe2025!"),
            status="active",
        )
        db.add(vendor3_user)
        await db.flush()

        vendor3 = Vendor(
            user_id=vendor3_user.id,
            business_name="Gold Coast Accessories",
            location="Osu, Accra",
            contact_phone="+233200000003",
            fulfillment_sla_hours=48,
            status="active",
        )
        db.add(vendor3)
        await db.flush()
        print(f"✓ Vendor 3: {vendor3.business_name}")

        # ── Products ──────────────────────────────────────────────────────
        pilot_products = [
            # Fashion (vendor1)
            dict(vendor_id=vendor1.id, sku="FASH-001", name="Ankara Wrap Dress", category="fashion",
                 color="blue/gold", price=Decimal("180.00"), inventory_count=15),
            dict(vendor_id=vendor1.id, sku="FASH-002", name="Kente Coord Set", category="fashion",
                 color="multicolor", price=Decimal("220.00"), inventory_count=10),
            dict(vendor_id=vendor1.id, sku="FASH-003", name="Lace Bodycon Dress", category="fashion",
                 color="black", price=Decimal("150.00"), inventory_count=20),
            dict(vendor_id=vendor1.id, sku="FASH-004", name="Puff Sleeve Blouse", category="fashion",
                 color="white", price=Decimal("95.00"), inventory_count=25),
            dict(vendor_id=vendor1.id, sku="FASH-005", name="High-Waist Ankara Skirt", category="fashion",
                 color="green/orange", price=Decimal("120.00"), inventory_count=18),
            # Hair (vendor2)
            dict(vendor_id=vendor2.id, sku="HAIR-001", name="Body Wave Wig 18\"", category="hair",
                 color="natural black", price=Decimal("380.00"), inventory_count=8),
            dict(vendor_id=vendor2.id, sku="HAIR-002", name="Straight Lace Front Wig 20\"", category="hair",
                 color="natural black", price=Decimal("420.00"), inventory_count=6),
            dict(vendor_id=vendor2.id, sku="HAIR-003", name="Curly Bob Wig 12\"", category="hair",
                 color="dark brown", price=Decimal("280.00"), inventory_count=12),
            # Accessories (vendor3)
            dict(vendor_id=vendor3.id, sku="ACC-001", name="Gold Cowrie Statement Necklace", category="accessories",
                 color="gold", price=Decimal("65.00"), inventory_count=30),
            dict(vendor_id=vendor3.id, sku="ACC-002", name="Beaded Waist Beads Set", category="accessories",
                 color="multicolor", price=Decimal("45.00"), inventory_count=50),
            dict(vendor_id=vendor3.id, sku="ACC-003", name="Straw Tote Bag", category="accessories",
                 color="natural", price=Decimal("85.00"), inventory_count=20),
            dict(vendor_id=vendor3.id, sku="ACC-004", name="Kente Print Bucket Hat", category="accessories",
                 color="multicolor", price=Decimal("55.00"), inventory_count=25),
        ]

        product_objects = []
        for p in pilot_products:
            product = Product(currency="GHS", status="active", **p)
            db.add(product)
            product_objects.append(product)

        await db.flush()
        print(f"✓ {len(product_objects)} products seeded")

        # ── Christiana's pilot campaign ───────────────────────────────────
        campaign = Campaign(
            influencer_id=christiana.id,
            name="Christiana Ghana Pilot — Oct 2025",
            status="active",
            attribution_rules_json={"window_hours": 72, "last_click": True},
        )
        db.add(campaign)
        await db.flush()

        # Link all products to campaign
        for i, product in enumerate(product_objects):
            db.add(ProductCampaignLink(
                campaign_id=campaign.id,
                product_id=product.id,
                featured_rank=i,
                active=True,
            ))

        await db.commit()
        print(f"✓ Campaign created: {campaign.name}")
        print("\n=== SEED COMPLETE ===")
        print("Admin login: airatpack@gmail.com / ChangeMe2025!")
        print("Christiana login: uchik9935@gmail.com / ChangeMe2025!")
        print(f"Christiana influencer ID: {christiana.id}")
        print(f"Campaign ID: {campaign.id}")
        print("⚠️  Change all passwords after first login!")


if __name__ == "__main__":
    asyncio.run(seed())
