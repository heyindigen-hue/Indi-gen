# Indi-gen Architecture

## Overview

Indi-gen is a SaaS LinkedIn lead-hunting platform. Users discover and save leads from LinkedIn via a mobile app, then manage, enrich, and action those leads. An admin web panel gives the operator full visibility into users, billing, scrapers, and platform health.

## Services

The platform is split into four primary components that run as Docker containers behind an Nginx reverse proxy:

1. **server** (Node.js + Express + TypeScript) — the central API. Handles auth (JWT), lead storage, user management, subscriptions (Cashfree), enrichment orchestration, BullMQ job queues, and real-time admin updates via SSE.
2. **scraper-service** (Python + FastAPI) — a separate microservice that wraps the `linkedin-api` library. The server calls it over HTTP. Redis caching and rate-limiting protect against LinkedIn bans.
3. **admin** (React + Vite + Shadcn) — an internal web dashboard for managing users, scraper accounts, AI settings, financial reports, and platform config.
4. **mobile** (Expo SDK 50 + React Native) — the end-user app. File-based routing via Expo Router, React Query for data fetching, and Cashfree in-app payments.

## Data Layer

PostgreSQL stores all relational data (users, leads, subscriptions, audit logs). Redis serves as the job queue broker (BullMQ), scraper result cache, and rate-limiter state store.

## ASCII Diagram

```
  Mobile App (Expo)          Admin Panel (React)
        |                          |
        +--------+   +-------------+
                 |   |
              [Nginx]
                 |
       +---------+---------+
       |                   |
  [server :3001]   [scraper :8000]
       |                   |
   [PostgreSQL]         [Redis]
       |
   [BullMQ workers]
```
