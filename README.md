# Indi-gen / LeadHangover

Lead generation platform — Express API, FastAPI scraper, React admin, Expo mobile.

## Services

| Service | Description | Port (internal) |
|---------|-------------|-----------------|
| `server` | Express.js API | 3001 |
| `scraper` | FastAPI LinkedIn scraper | 8000 |
| `scraper_worker` | Background job worker | — |
| `admin` | React/Vite admin SPA | 80 (container) |
| `postgres` | PostgreSQL 16 | 5432 |
| `redis` | Redis 7 | 6379 |

## Local Development

```bash
cp .env.example .env   # then fill in values
docker compose up -d postgres redis
cd server && npm install && npm run migrate && npm run dev
cd scraper-service && pip install -r requirements.txt && uvicorn app.main:app --reload
cd admin && npm install && npm run dev
```

## Deployment (EC2)

**First deploy:**

```bash
# 1. SSH into EC2
ssh -i key.pem ubuntu@<EC2-IP>

# 2. Clone repo (if not already)
git clone https://github.com/heyindigen-hue/Indi-gen /opt/indigen
cd /opt/indigen

# 3. Configure secrets
cp .env.example .env
nano .env   # fill in JWT_SECRET, CASHFREE_*, CLAUDE_API_KEY, etc.

# 4. Deploy
bash deploy/deploy.sh

# 5. Issue SSL cert (once DNS is pointed at the server)
sudo certbot --nginx -d leadgen.indigenservices.com

# 6. Apply nginx config with SSL
bash deploy/nginx-apply.sh
```

**Subsequent deploys:**

```bash
cd /opt/indigen && bash deploy/deploy.sh
```

**Check status:**

```bash
docker compose ps
docker compose logs -f server
```

## Environment Variables

See `.env.example` for all required variables. Critical ones:

- `JWT_SECRET` — generate with `openssl rand -base64 48`
- `CASHFREE_APP_ID` / `CASHFREE_SECRET_KEY` — from Cashfree dashboard
- `CASHFREE_ENV` — `TEST` or `PRODUCTION`
- `CLAUDE_API_KEY` — Anthropic API key
