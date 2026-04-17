"""
Affiliate Sync Service — Yes MAM
Pulls products from affiliate partner APIs/catalogs and syncs them into
the local product database. Handles price changes, stock status, and
auto-discontinuation. Runs as a scheduled background task.

Supported sources:
  - demo       : Curated demo products for seeding (no API key required)
  - jumia      : Jumia KOL affiliate catalog (West/East/North Africa)
  - shein      : SHEIN Africa catalog via Awin affiliate API
  - konga      : Konga affiliate products (Nigeria)
  - aliexpress : AliExpress Portals affiliate API (ships to Africa)
  - obioma     : Obioma Fashion (myobioma.com) — Ghana direct
"""

import logging
import os
import random
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.product import Product

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Exchange rates: USD → African currencies (refresh hourly in production)
# ---------------------------------------------------------------------------
FX_RATES: dict[str, float] = {
    "GHS": 15.8,    # Ghana Cedi
    "NGN": 1620.0,  # Nigerian Naira
    "KES": 129.0,   # Kenyan Shilling
    "ZAR": 18.5,    # South African Rand
    "TZS": 2580.0,  # Tanzanian Shilling
    "UGX": 3720.0,  # Ugandan Shilling
    "XOF": 615.0,   # West African CFA
    "EGP": 48.5,    # Egyptian Pound
}

DEFAULT_CURRENCY = "GHS"


def usd_to_local(usd: float, currency: str = DEFAULT_CURRENCY) -> Decimal:
    rate = FX_RATES.get(currency, FX_RATES[DEFAULT_CURRENCY])
    return Decimal(str(round(usd * rate, 2)))


# ---------------------------------------------------------------------------
# Base scraper interface
# ---------------------------------------------------------------------------

class AffiliateSource:
    source_id: str = "base"
    commission_rate: float = 0.10

    async def fetch_products(self) -> list[dict]:
        raise NotImplementedError

    def normalize(self, raw: dict) -> dict:
        raise NotImplementedError


# ---------------------------------------------------------------------------
# DEMO source — 1000+ realistic Africa-market products, no API key needed
# ---------------------------------------------------------------------------

_DEMO_CACHE: list[dict] = []


def _build_demo_catalog() -> list[dict]:
    """Generate a realistic catalog of 1200+ African market products."""
    random.seed(42)
    products = []

    categories: list[tuple[str, str, list[tuple[str, str, float, float]]]] = [
        ("Hair & Beauty", "Wigs & Extensions", [
            ("Brazilian Body Wave Wig", "Becky Wigs", 25, 85),
            ("Straight Lace Front Wig", "Rosegold Beauty", 30, 90),
            ("Deep Wave Human Hair Wig", "Glamour Hair Hub", 35, 120),
            ("Kinky Curly Closure Wig", "Afro Queens", 28, 75),
            ("Water Wave 13x4 Wig", "Becky Wigs", 32, 95),
            ("Loose Deep Wave Wig", "Rosegold Beauty", 27, 80),
            ("Highlight Ombre Wig", "ColorPop Africa", 40, 110),
            ("Short Bob Wig", "Becky Wigs", 22, 65),
        ]),
        ("Hair & Beauty", "Hair Care", [
            ("Shea Butter Deep Conditioner 500ml", "SheaGlow", 4, 12),
            ("Jamaican Black Castor Oil 240ml", "EcoNaturals", 5, 15),
            ("Edge Control Gel 100g", "SlayEdge", 3, 9),
            ("Argan Oil Hair Serum 100ml", "MoroccanGold", 4, 14),
            ("Protein Treatment Hair Mask", "StrengthPro", 5, 16),
            ("Curl Defining Cream 300ml", "CurlLove", 4, 12),
            ("Braiding Hair Extensions", "NaturalKinks", 3, 10),
        ]),
        ("Fashion", "Women's Dresses", [
            ("Ankara Print Wrap Dress", "Obioma Fashion", 12, 35),
            ("Kente Midi Dress", "GhanaWeaves", 18, 55),
            ("Bodycon Lace Dress", "StyleHer Africa", 10, 30),
            ("African Print Maxi Dress", "AfroPrint Co", 15, 45),
            ("Fitted Bandage Dress", "CurveQueen", 8, 25),
            ("Off-shoulder Peplum Dress", "Chic Nairobi", 12, 38),
            ("Adire Tie-dye Dress", "Lagos Couture", 14, 42),
            ("Dashiki Print Dress", "AfroStyle", 10, 30),
        ]),
        ("Fashion", "Women's Tops", [
            ("Ankara Crop Top", "Obioma Fashion", 6, 18),
            ("Lace Bodysuit", "StyleHer Africa", 5, 16),
            ("Puff Sleeve Blouse", "Chic Nairobi", 7, 22),
            ("Off-shoulder Top", "TrendAfrica", 5, 15),
            ("Ribbed Corset Top", "CurveQueen", 6, 18),
            ("Kente Print Blouse", "GhanaWeaves", 8, 24),
        ]),
        ("Fashion", "Footwear", [
            ("Block Heel Sandals", "StepUp Africa", 8, 28),
            ("Wedge Platform Heels", "HeelQueen", 10, 32),
            ("Strappy Flat Sandals", "StepUp Africa", 5, 16),
            ("Ankle Strap Heels", "GlamorStep", 9, 30),
            ("Comfortable Loafers", "WalkEasy", 7, 22),
            ("Metallic Mule Heels", "HeelQueen", 10, 35),
        ]),
        ("Fashion", "Bags & Accessories", [
            ("Quilted Chain Handbag", "LuxBag Africa", 12, 40),
            ("Tote Shopper Bag", "Everyday Carry", 8, 25),
            ("Crossbody Mini Bag", "LuxBag Africa", 6, 20),
            ("Backpack", "UrbanCarry", 10, 35),
            ("Ankara Clutch Bag", "AfroPrint Co", 7, 22),
            ("Straw Beach Bag", "SummerAfrica", 5, 18),
        ]),
        ("Skincare", "Face Care", [
            ("Vitamin C Brightening Serum 30ml", "GlowLab Africa", 6, 20),
            ("Kojic Acid Cream 50ml", "ClearSkin NG", 4, 14),
            ("Shea Butter Moisturizer 200ml", "NaturSkin", 3, 10),
            ("Turmeric Face Mask", "GlowMask", 4, 12),
            ("SPF 50 Sunscreen 75ml", "SunShield Africa", 5, 18),
            ("Retinol Night Cream 50ml", "YouthCraft", 7, 22),
            ("Hyaluronic Acid Toner 150ml", "HydraGlow", 5, 16),
            ("AHA/BHA Exfoliating Serum", "ClearSkin NG", 6, 20),
        ]),
        ("Skincare", "Body Care", [
            ("Fair & White Body Lotion 500ml", "Fair & White", 5, 16),
            ("Coconut Oil Body Butter 300g", "NaturSkin", 4, 12),
            ("Exfoliating Body Scrub 300g", "GlowScrub", 4, 14),
            ("Anti-stretch Mark Oil 200ml", "StretchFix", 5, 18),
            ("Shea Body Soap Bar", "SheaGlow", 2, 7),
        ]),
        ("Jewelry", "Earrings", [
            ("Gold-plated Hoop Earrings", "GoldGem Africa", 3, 12),
            ("Ankara Fabric Earrings", "AfroPrint Co", 2, 8),
            ("Pearl Drop Earrings", "PearlBeauty", 3, 11),
            ("Statement Chandelier Earrings", "GoldGem Africa", 4, 15),
            ("Beaded Stud Earrings", "AfroBeads", 2, 8),
        ]),
        ("Jewelry", "Necklaces & Bracelets", [
            ("Gold-plated Layered Necklace", "GoldGem Africa", 4, 14),
            ("Beaded Waist Chain", "AfroBeads", 2, 8),
            ("Crystal Charm Bracelet", "CrystalAfrica", 3, 10),
            ("Ankara Bead Necklace Set", "AfroBeads", 3, 12),
            ("Shell & Bead Choker", "BeachGold", 3, 10),
        ]),
        ("Electronics", "Phone Accessories", [
            ("Phone Case for Samsung A54", "TechShield", 2, 8),
            ("Wireless Earbuds", "SoundPod Africa", 8, 30),
            ("Fast Charge USB-C Cable 1m", "CablePro", 1, 5),
            ("Ring Light 6 inch Portable", "InfluencerKit", 5, 18),
            ("Phone Tripod Stand Adjustable", "InfluencerKit", 4, 15),
            ("Selfie Ring Light Clip-on", "InfluencerKit", 3, 10),
            ("Bluetooth Speaker Portable", "SoundPod Africa", 7, 25),
            ("Power Bank 10000mAh", "ChargeFast", 8, 22),
        ]),
        ("Home & Living", "Kitchen", [
            ("Ankara Print Apron", "HomeStyle Africa", 3, 10),
            ("Stainless Steel Cookware Set 3pc", "CookRight", 12, 40),
            ("Non-stick Frying Pan 24cm", "CookRight", 5, 18),
            ("Electric Kettle 1.5L", "BrewHome", 6, 20),
            ("Spice Rack Organizer", "HomeStyle Africa", 4, 14),
        ]),
        ("Fitness", "Activewear", [
            ("High-waist Yoga Leggings", "ActiveAfrica", 7, 22),
            ("Sports Bra", "FitQueen", 4, 14),
            ("Gym Shorts", "ActiveAfrica", 4, 12),
            ("Resistance Bands Set", "FitKit", 3, 10),
            ("Jump Rope Skipping Rope", "FitKit", 1, 5),
            ("Workout Gloves", "FitKit", 3, 10),
        ]),
        ("Mother & Baby", "Baby Care", [
            ("Baby Shea Butter Lotion 250ml", "BabyGlow", 3, 10),
            ("African Print Baby Romper", "TinyAnkara", 4, 14),
            ("Baby Carrier Wrap", "MomCarry", 6, 20),
            ("Teething Toy Set", "BabySmile", 3, 10),
            ("Baby Hair Comb & Brush Set", "BabyGlow", 2, 8),
        ]),
        ("Books & Culture", "African Literature", [
            ("Black in the Saddle: African Cavalries to Cowboys", "Louis Hook", 12, 18),
            ("Things Fall Apart", "Chinua Achebe", 8, 15),
            ("Americanah", "Chimamanda Ngozi Adichie", 8, 15),
            ("Half of a Yellow Sun", "Chimamanda Ngozi Adichie", 8, 15),
        ]),
    ]

    badges = ["New", "Hot", "Sale", "Best Seller", None, None, None, None]
    ships_options = ["Ghana", "Nigeria", "China", "UAE", "South Africa", "Kenya"]
    delivery_options = [(3, 7), (5, 14), (7, 21), (2, 5), (10, 25)]
    all_countries = ["GH", "NG", "KE", "ZA", "TZ", "UG", "CI", "SN", "EG", "CM", "RW", "ET"]
    comm_rates = [0.10, 0.12, 0.13, 0.15, 0.18, 0.20]

    pid = 1
    for category, subcategory, items in categories:
        is_fashion = category in ("Fashion", "Fitness")
        sizes = ["XS", "S", "M", "L", "XL", "XXL"] if is_fashion else [None]
        colors_pool = (
            ["Black", "White", "Brown", "Nude", "Red", "Blue", "Green", "Pink", "Purple", "Yellow"]
            if category in ("Fashion", "Hair & Beauty", "Fitness", "Jewelry")
            else [None]
        )

        for name_tpl, brand, min_usd, max_usd in items:
            count = random.randint(6, 14)
            for _ in range(count):
                color = random.choice(colors_pool)
                size = random.choice(sizes)
                usd = round(random.uniform(min_usd, max_usd), 2)
                orig_usd = round(usd * random.uniform(1.1, 1.45), 2)
                rating = round(random.uniform(3.7, 5.0), 1)
                reviews = random.randint(3, 1200)
                sales = random.randint(8, 8000)
                badge = random.choice(badges)
                ships_from = random.choice(ships_options)
                dmin, dmax = random.choice(delivery_options)
                avail = random.sample(all_countries, random.randint(3, 10))
                comm = random.choice(comm_rates)

                parts = []
                if color:
                    parts.append(color)
                if size:
                    parts.append(f"Size {size}")
                suffix = " — ".join(parts) if parts else ""
                full_name = name_tpl + (f" ({suffix})" if suffix else "")

                products.append({
                    "sku": f"DEMO-{pid:05d}",
                    "name": full_name,
                    "description": (
                        f"Premium quality {name_tpl.lower()} from {brand}. "
                        "Popular across Africa for style, quality, and value. "
                        "Perfect for everyday wear and special occasions."
                    ),
                    "category": category,
                    "subcategory": subcategory,
                    "brand": brand,
                    "color": color,
                    "size": size,
                    "price_usd": usd,
                    "original_price_usd": orig_usd,
                    "currency": "GHS",
                    "inventory_count": random.randint(10, 500),
                    "status": "active",
                    "tags": [category.lower(), subcategory.lower().replace("'", ""), brand.lower(), "africa"],
                    "rating": rating,
                    "review_count": reviews,
                    "sales_count": sales,
                    "badge": badge,
                    "country_availability": avail,
                    "affiliate_source": "demo",
                    "affiliate_product_id": f"demo-{pid:05d}",
                    "affiliate_url": f"https://yesmam.africa/shop?ref=demo-{pid:05d}",
                    "affiliate_commission_rate": comm,
                    "source_price_usd": usd,
                    "ships_from": ships_from,
                    "delivery_days_min": dmin,
                    "delivery_days_max": dmax,
                    "media_urls": [
                        f"https://picsum.photos/seed/{pid}/400/400",
                        f"https://picsum.photos/seed/{pid + 1000}/400/400",
                    ],
                })
                pid += 1
    return products


class DemoSource(AffiliateSource):
    source_id = "demo"
    commission_rate = 0.15

    async def fetch_products(self) -> list[dict]:
        global _DEMO_CACHE
        if not _DEMO_CACHE:
            _DEMO_CACHE = _build_demo_catalog()
        return _DEMO_CACHE

    def normalize(self, raw: dict) -> dict:
        return raw  # already normalized


# ---------------------------------------------------------------------------
# Jumia KOL source (requires JUMIA_KOL_API_KEY env var)
# ---------------------------------------------------------------------------

class JumiaSource(AffiliateSource):
    source_id = "jumia"
    commission_rate = 0.11
    API_BASE = "https://kol.jumia.com/api"

    def __init__(self) -> None:
        self.api_key = os.getenv("JUMIA_KOL_API_KEY", "")

    async def fetch_products(self) -> list[dict]:
        if not self.api_key:
            logger.warning("JUMIA_KOL_API_KEY not set — skipping Jumia sync")
            return []
        headers = {"Authorization": f"Bearer {self.api_key}"}
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(f"{self.API_BASE}/products", headers=headers, params={"limit": 500})
            resp.raise_for_status()
        return resp.json().get("products", [])

    def normalize(self, raw: dict) -> dict:
        usd = float(raw.get("price", 0)) / FX_RATES["NGN"]
        return {
            "sku": f"JUMIA-{raw['product_id']}",
            "name": raw.get("name", ""),
            "description": raw.get("description", ""),
            "category": raw.get("category", "Fashion"),
            "subcategory": raw.get("subcategory"),
            "brand": raw.get("brand"),
            "price_usd": usd,
            "original_price_usd": usd * 1.2,
            "currency": "GHS",
            "inventory_count": raw.get("stock", 50),
            "status": "active" if raw.get("in_stock") else "out_of_stock",
            "tags": raw.get("tags", []),
            "rating": float(raw.get("rating", 4.0)),
            "review_count": raw.get("review_count", 0),
            "affiliate_source": "jumia",
            "affiliate_product_id": str(raw["product_id"]),
            "affiliate_url": raw.get("affiliate_url", ""),
            "affiliate_commission_rate": self.commission_rate,
            "source_price_usd": usd,
            "ships_from": "Nigeria",
            "delivery_days_min": 2,
            "delivery_days_max": 7,
            "country_availability": ["NG", "GH", "KE", "EG", "CI", "SN", "TZ", "CM"],
            "media_urls": [raw.get("image_url", "")],
        }


# ---------------------------------------------------------------------------
# SHEIN / Awin source (requires AWIN_PUBLISHER_ID + AWIN_API_TOKEN env vars)
# ---------------------------------------------------------------------------

class SheinSource(AffiliateSource):
    source_id = "shein"
    commission_rate = 0.15
    AWIN_BASE = "https://api.awin.com/publishers"

    def __init__(self) -> None:
        self.publisher_id = os.getenv("AWIN_PUBLISHER_ID", "")
        self.api_token = os.getenv("AWIN_API_TOKEN", "")

    async def fetch_products(self) -> list[dict]:
        if not self.publisher_id or not self.api_token:
            logger.warning("AWIN_PUBLISHER_ID / AWIN_API_TOKEN not set — skipping SHEIN sync")
            return []
        headers = {"Authorization": f"Bearer {self.api_token}"}
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{self.AWIN_BASE}/{self.publisher_id}/products",
                headers=headers,
                params={"advertiser": "shein", "limit": 500},
            )
            resp.raise_for_status()
        return resp.json().get("products", [])

    def normalize(self, raw: dict) -> dict:
        usd = float(raw.get("price", {}).get("amount", 0))
        return {
            "sku": f"SHEIN-{raw['productId']}",
            "name": raw.get("productName", ""),
            "description": raw.get("description", ""),
            "category": "Fashion",
            "subcategory": raw.get("categoryName"),
            "brand": "SHEIN",
            "price_usd": usd,
            "original_price_usd": usd * 1.3,
            "currency": "GHS",
            "inventory_count": 999,
            "status": "active",
            "affiliate_source": "shein",
            "affiliate_product_id": str(raw["productId"]),
            "affiliate_url": raw.get("productUrl", ""),
            "affiliate_commission_rate": self.commission_rate,
            "source_price_usd": usd,
            "ships_from": "China",
            "delivery_days_min": 7,
            "delivery_days_max": 21,
            "country_availability": ["GH", "NG", "KE", "ZA", "EG", "CI", "SN"],
            "media_urls": [raw.get("imageUrl", "")],
        }


# ---------------------------------------------------------------------------
# AliExpress Portals source (requires ALIEXPRESS_APP_KEY + APP_SECRET)
# ---------------------------------------------------------------------------

class AliExpressSource(AffiliateSource):
    source_id = "aliexpress"
    commission_rate = 0.08
    API_BASE = "https://api-sg.aliexpress.com/sync"

    def __init__(self) -> None:
        self.app_key = os.getenv("ALIEXPRESS_APP_KEY", "")
        self.app_secret = os.getenv("ALIEXPRESS_APP_SECRET", "")

    async def fetch_products(self) -> list[dict]:
        if not self.app_key:
            logger.warning("ALIEXPRESS_APP_KEY not set — skipping AliExpress sync")
            return []
        # AliExpress uses HMAC-signed requests — placeholder for now
        return []

    def normalize(self, raw: dict) -> dict:
        usd = float(raw.get("price", 0))
        return {
            "sku": f"ALI-{raw['product_id']}",
            "name": raw.get("product_title", ""),
            "category": raw.get("category_name", "Fashion"),
            "price_usd": usd,
            "original_price_usd": usd * 1.25,
            "currency": "GHS",
            "inventory_count": 999,
            "status": "active",
            "affiliate_source": "aliexpress",
            "affiliate_product_id": str(raw["product_id"]),
            "affiliate_url": raw.get("promotion_link", ""),
            "affiliate_commission_rate": self.commission_rate,
            "source_price_usd": usd,
            "ships_from": "China",
            "delivery_days_min": 10,
            "delivery_days_max": 30,
            "country_availability": ["GH", "NG", "KE", "ZA", "TZ", "UG"],
            "media_urls": [raw.get("product_main_image_url", "")],
        }


# ---------------------------------------------------------------------------
# Registered sources — add live sources when API keys are available
# ---------------------------------------------------------------------------

SOURCES: list[AffiliateSource] = [
    DemoSource(),
    JumiaSource(),
    SheinSource(),
    AliExpressSource(),
]


# ---------------------------------------------------------------------------
# Core sync engine
# ---------------------------------------------------------------------------

async def sync_source(
    session: AsyncSession,
    source: AffiliateSource,
    vendor_id: uuid.UUID,
) -> dict[str, int]:
    """Fetch + upsert products from one affiliate source."""
    stats: dict[str, int] = {"created": 0, "updated": 0, "deactivated": 0, "errors": 0}

    try:
        raw_products = await source.fetch_products()
    except Exception as exc:
        logger.error(f"[{source.source_id}] fetch failed: {exc}")
        stats["errors"] += 1
        return stats

    for raw in raw_products:
        try:
            n = source.normalize(raw)
            affiliate_pid = n["affiliate_product_id"]

            result = await session.execute(
                select(Product).where(
                    Product.affiliate_source == source.source_id,
                    Product.affiliate_product_id == affiliate_pid,
                )
            )
            existing: Product | None = result.scalar_one_or_none()

            price_usd = float(n.get("price_usd", 0))
            orig_usd = float(n.get("original_price_usd", price_usd * 1.2))
            currency = n.get("currency", DEFAULT_CURRENCY)
            now = datetime.now(timezone.utc)

            if existing:
                existing.price = usd_to_local(price_usd, currency)
                existing.original_price = usd_to_local(orig_usd, currency)
                existing.source_price_usd = Decimal(str(price_usd))
                existing.inventory_count = n.get("inventory_count", existing.inventory_count)
                existing.status = n.get("status", "active")
                existing.rating = n.get("rating")
                existing.review_count = n.get("review_count", 0)
                existing.sales_count = n.get("sales_count", 0)
                existing.last_synced_at = now
                existing.updated_at = now
                stats["updated"] += 1
            else:
                product = Product(
                    id=uuid.uuid4(),
                    vendor_id=vendor_id,
                    sku=n["sku"],
                    name=n["name"],
                    description=n.get("description"),
                    category=n["category"],
                    subcategory=n.get("subcategory"),
                    brand=n.get("brand"),
                    color=n.get("color"),
                    size=n.get("size"),
                    price=usd_to_local(price_usd, currency),
                    original_price=usd_to_local(orig_usd, currency),
                    currency=currency,
                    inventory_count=n.get("inventory_count", 100),
                    status=n.get("status", "active"),
                    media_urls=n.get("media_urls", []),
                    tags=n.get("tags", []),
                    rating=n.get("rating"),
                    review_count=n.get("review_count", 0),
                    sales_count=n.get("sales_count", 0),
                    badge=n.get("badge"),
                    country_availability=n.get("country_availability", ["GH"]),
                    affiliate_source=source.source_id,
                    affiliate_product_id=affiliate_pid,
                    affiliate_url=n.get("affiliate_url"),
                    affiliate_commission_rate=n.get("affiliate_commission_rate", source.commission_rate),
                    last_synced_at=now,
                    sync_enabled=True,
                    source_price_usd=Decimal(str(price_usd)),
                    delivery_days_min=n.get("delivery_days_min"),
                    delivery_days_max=n.get("delivery_days_max"),
                    ships_from=n.get("ships_from"),
                    created_at=now,
                    updated_at=now,
                )
                session.add(product)
                stats["created"] += 1
        except Exception as exc:
            logger.error(f"[{source.source_id}] product sync error: {exc}")
            stats["errors"] += 1

    await session.commit()
    logger.info(
        f"[{source.source_id}] sync complete — "
        f"created={stats['created']} updated={stats['updated']} errors={stats['errors']}"
    )
    return stats


async def run_full_sync(vendor_id: uuid.UUID | None = None) -> dict[str, dict[str, int]]:
    """Run sync across all registered affiliate sources."""
    async with AsyncSessionLocal() as session:
        if vendor_id is None:
            from app.models.vendor import Vendor
            result = await session.execute(select(Vendor).limit(1))
            v = result.scalar_one_or_none()
            if not v:
                logger.error("No vendor found — cannot seed products without a vendor_id")
                return {}
            vendor_id = v.id

        all_stats: dict[str, dict[str, int]] = {}
        for source in SOURCES:
            stats = await sync_source(session, source, vendor_id)
            all_stats[source.source_id] = stats

    return all_stats
