# LeadHangover

"Wake up to better leads" — mobile app + admin web + backend.

## Folder Structure

| Folder | Purpose |
|--------|---------|
| `server/` | Node.js + Express + TypeScript REST API |
| `scraper-service/` | Python FastAPI microservice (LinkedIn scraping) |
| `admin/` | React + Vite + Shadcn admin dashboard |
| `mobile/` | Expo SDK 50 React Native app |
| `shared/types/` | Shared TypeScript types used across server/admin/mobile |
| `db/migrations/` | Numbered SQL migration files |
| `docs/` | Architecture and design documentation |

## Quick Start

```bash
# Copy env and fill in values
cp .env.example .env

# Start all services
docker compose up --build
```

Services:
- API: http://localhost/api
- Admin: http://localhost/admin
- Scraper: http://localhost/scrape

## Local Development

```bash
# Server
cd server && npm install && npm run dev

# Admin
cd admin && npm install && npm run dev

# Mobile
cd mobile && npm install && npx expo start

# Scraper
cd scraper-service && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, PostgreSQL, Redis, BullMQ
- **Scraper**: Python, FastAPI, linkedin-api
- **Admin**: React 18, Vite, Shadcn/ui, TanStack Query, Zustand
- **Mobile**: Expo SDK 50, React Native, Expo Router
- **Infra**: Docker, Nginx, PostgreSQL 16, Redis 7
