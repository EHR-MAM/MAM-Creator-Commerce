"""
Standalone seed script using psycopg2 (no asyncpg required).
Run from C:\MAF\platform\backend\:  python seed_direct.py
"""
import psycopg2
import bcrypt
import uuid

# Using Supabase connection pooler (port 6543) — works through firewalls
DB_URL = "postgresql://postgres.pmkvzwgizpropwjgpopp:ZqpWA76JiIuYfbIH@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

def hp(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def run():
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cur = conn.cursor()

    print("Connected to Supabase ✓")

    # ── Admin (David Bezar) ───────────────────────────────────────────────
    admin_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO users (id, role, name, email, hashed_password, status)
        VALUES (%s, 'admin', %s, %s, %s, 'active')
        ON CONFLICT (email) DO NOTHING
    """, (admin_id, "David Bezar", "airatpack@gmail.com", hp("ChangeMe2025!")))
    print("✓ Admin: airatpack@gmail.com")

    # ── Christiana user account ───────────────────────────────────────────
    christiana_user_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO users (id, role, name, email, hashed_password, status)
        VALUES (%s, 'influencer', %s, %s, %s, 'active')
        ON CONFLICT (email) DO NOTHING
        RETURNING id
    """, (christiana_user_id, "Christiana Amankwaah", "uchik9935@gmail.com", hp("ChangeMe2025!")))
    row = cur.fetchone()
    # If conflict, fetch existing id
    if not row:
        cur.execute("SELECT id FROM users WHERE email = %s", ("uchik9935@gmail.com",))
        christiana_user_id = str(cur.fetchone()[0])
    else:
        christiana_user_id = str(row[0])

    christiana_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO influencers (id, user_id, handle, platform_name, audience_region, payout_method, status)
        VALUES (%s, %s, 'sweet200723', 'tiktok', 'Ghana', 'momo', 'active')
    """, (christiana_id, christiana_user_id))
    print(f"✓ Influencer: @sweet200723  id={christiana_id}")

    # ── Vendor 1: Fashion ─────────────────────────────────────────────────
    v1u = str(uuid.uuid4())
    v1 = str(uuid.uuid4())
    cur.execute("INSERT INTO users (id,role,name,email,hashed_password,status) VALUES (%s,'vendor','Accra Style Hub','accastylehub@placeholder.com',%s,'active')",
                (v1u, hp("ChangeMe2025!")))
    cur.execute("INSERT INTO vendors (id,user_id,business_name,location,contact_phone,fulfillment_sla_hours,status) VALUES (%s,%s,'Accra Style Hub','East Legon, Accra','+233200000001',48,'active')",
                (v1, v1u))
    print(f"✓ Vendor 1: Accra Style Hub  id={v1}")

    # ── Vendor 2: Hair ────────────────────────────────────────────────────
    v2u = str(uuid.uuid4())
    v2 = str(uuid.uuid4())
    cur.execute("INSERT INTO users (id,role,name,email,hashed_password,status) VALUES (%s,'vendor','Ghana Wig Queen','ghanawigsqueen@placeholder.com',%s,'active')",
                (v2u, hp("ChangeMe2025!")))
    cur.execute("INSERT INTO vendors (id,user_id,business_name,location,contact_phone,fulfillment_sla_hours,status) VALUES (%s,%s,'Ghana Wig Queen','Spintex Road, Accra','+233200000002',72,'active')",
                (v2, v2u))
    print(f"✓ Vendor 2: Ghana Wig Queen  id={v2}")

    # ── Vendor 3: Accessories ─────────────────────────────────────────────
    v3u = str(uuid.uuid4())
    v3 = str(uuid.uuid4())
    cur.execute("INSERT INTO users (id,role,name,email,hashed_password,status) VALUES (%s,'vendor','Gold Coast Accessories','goldcoastacc@placeholder.com',%s,'active')",
                (v3u, hp("ChangeMe2025!")))
    cur.execute("INSERT INTO vendors (id,user_id,business_name,location,contact_phone,fulfillment_sla_hours,status) VALUES (%s,%s,'Gold Coast Accessories','Osu, Accra','+233200000003',48,'active')",
                (v3, v3u))
    print(f"✓ Vendor 3: Gold Coast Accessories  id={v3}")

    # ── Products (12 pilot SKUs) ──────────────────────────────────────────
    products = [
        (v1,"FASH-001","Ankara Wrap Dress","fashion","blue/gold",180.00,15),
        (v1,"FASH-002","Kente Coord Set","fashion","multicolor",220.00,10),
        (v1,"FASH-003","Lace Bodycon Dress","fashion","black",150.00,20),
        (v1,"FASH-004","Puff Sleeve Blouse","fashion","white",95.00,25),
        (v1,"FASH-005","High-Waist Ankara Skirt","fashion","green/orange",120.00,18),
        (v2,"HAIR-001","Body Wave Wig 18in","hair","natural black",380.00,8),
        (v2,"HAIR-002","Straight Lace Front Wig 20in","hair","natural black",420.00,6),
        (v2,"HAIR-003","Curly Bob Wig 12in","hair","dark brown",280.00,12),
        (v3,"ACC-001","Gold Cowrie Statement Necklace","accessories","gold",65.00,30),
        (v3,"ACC-002","Beaded Waist Beads Set","accessories","multicolor",45.00,50),
        (v3,"ACC-003","Straw Tote Bag","accessories","natural",85.00,20),
        (v3,"ACC-004","Kente Print Bucket Hat","accessories","multicolor",55.00,25),
    ]
    product_ids = []
    for vendor_id, sku, name, category, color, price, inv in products:
        pid = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO products (id,vendor_id,sku,name,category,color,price,currency,inventory_count,status)
            VALUES (%s,%s,%s,%s,%s,%s,%s,'GHS',%s,'active')
        """, (pid, vendor_id, sku, name, category, color, price, inv))
        product_ids.append(pid)
    print(f"✓ {len(product_ids)} products seeded")

    # ── Campaign ──────────────────────────────────────────────────────────
    campaign_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO campaigns (id,influencer_id,name,status,attribution_rules_json)
        VALUES (%s,%s,'Christiana Ghana Pilot — 2025','active','{"window_hours":72,"last_click":true}')
    """, (campaign_id, christiana_id))

    for rank, pid in enumerate(product_ids):
        cur.execute("""
            INSERT INTO product_campaign_links (id,campaign_id,product_id,featured_rank,active)
            VALUES (%s,%s,%s,%s,true)
        """, (str(uuid.uuid4()), campaign_id, pid, rank))

    conn.commit()
    cur.close()
    conn.close()

    print(f"✓ Campaign created  id={campaign_id}")
    print("\n=== SEED COMPLETE ===")
    print("Admin login:       airatpack@gmail.com  /  ChangeMe2025!")
    print("Christiana login:  uchik9935@gmail.com  /  ChangeMe2025!")
    print(f"Christiana ID:     {christiana_id}")
    print(f"Campaign ID:       {campaign_id}")
    print("⚠  Change passwords after first login!")

if __name__ == "__main__":
    run()
