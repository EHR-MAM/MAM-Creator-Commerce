# EHR Creator Commerce Platform

Ghana-first creator-commerce infrastructure platform.

## Stack
- **Backend:** Python + FastAPI
- **Database:** PostgreSQL via Supabase
- **Frontend:** Next.js + TypeScript + Tailwind CSS
- **Hosting:** Vercel (frontend), Railway (backend), Supabase (DB)

## Project Structure
```
platform/
├── backend/          FastAPI application
│   ├── app/
│   │   ├── api/      Route handlers (auth, catalog, orders, commissions)
│   │   ├── models/   SQLAlchemy ORM models
│   │   ├── schemas/  Pydantic request/response schemas
│   │   ├── services/ Business logic
│   │   └── core/     Config, security, database connection
│   ├── migrations/   Alembic database migrations
│   ├── tests/
│   └── main.py
├── frontend/         Next.js application
│   ├── app/
│   │   ├── [creator]/ Creator storefront (dynamic route)
│   │   ├── admin/     Admin dashboard
│   │   ├── dashboard/ Influencer dashboard
│   │   └── vendor/    Vendor dashboard
│   ├── components/
│   └── lib/
├── supabase/         Supabase config and migrations
│   └── migrations/
└── .github/
    └── workflows/    CI/CD pipelines
```

## Quick Start
See `backend/README.md` and `frontend/README.md` for setup instructions.

## Key Contacts
- Sponsor: Louis Hook (louis@educatedhoodrat.com)
- COO/CTO/PMO: David Bezar (airatpack@gmail.com)
