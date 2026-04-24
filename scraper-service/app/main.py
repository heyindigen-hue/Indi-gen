import logging
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from rq.job import Job

from app.config import settings
from app.models import ScrapeSearchRequest, JobStatus, AddAccountRequest
from app.queue import q, redis_conn
from app.scraper import run_search
from app.linkedin_client import get_client

logging.basicConfig(level=settings.log_level, format='%(asctime)s %(levelname)s %(name)s: %(message)s')
log = logging.getLogger("main")

app = FastAPI(title="Indi-gen Scraper Service", version="0.1.0")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# In-memory account registry (production: move to Postgres)
ACCOUNTS: dict[str, dict] = {}

@app.get("/health")
def health():
    try:
        redis_conn.ping()
        redis_ok = True
    except Exception:
        redis_ok = False
    return {
        "status": "ok",
        "redis": redis_ok,
        "accounts": len(ACCOUNTS),
        "queued": q.count,
    }

@app.post("/accounts", status_code=201)
def add_account(req: AddAccountRequest):
    ACCOUNTS[req.account_id] = {"email": req.email, "password": req.password}
    return {"account_id": req.account_id, "ok": True}

@app.get("/accounts")
def list_accounts():
    return [{"account_id": k, "email": v["email"]} for k, v in ACCOUNTS.items()]

@app.delete("/accounts/{account_id}")
def delete_account(account_id: str):
    ACCOUNTS.pop(account_id, None)
    return {"ok": True}

@app.post("/accounts/{account_id}/validate")
def validate_account(account_id: str):
    """Force re-login and re-persist cookie."""
    if account_id not in ACCOUNTS:
        raise HTTPException(404)
    acct = ACCOUNTS[account_id]
    try:
        api = get_client(account_id, acct["email"], acct["password"])
        # try a lightweight call
        _ = api.get_user_profile()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(400, str(e))

@app.post("/scrape/search", status_code=202)
def scrape_search(req: ScrapeSearchRequest):
    account_id = req.account_id or next(iter(ACCOUNTS.keys()), None)
    if not account_id:
        raise HTTPException(400, "no LinkedIn account configured — call POST /accounts first")
    acct = ACCOUNTS[account_id]
    job = q.enqueue(
        run_search, req.keywords, req.limit, req.user_id,
        account_id, acct["email"], acct["password"],
        job_timeout=900, result_ttl=7200, failure_ttl=86400,
    )
    return {"job_id": job.id, "status": "queued"}

@app.get("/scrape/jobs/{job_id}", response_model=JobStatus)
def scrape_job(job_id: str):
    try:
        job = Job.fetch(job_id, connection=redis_conn)
    except Exception:
        raise HTTPException(404, "job not found")
    return JobStatus(
        job_id=job_id,
        status=job.get_status(),
        result=job.result if job.is_finished else None,
        error=str(job.exc_info)[:2000] if job.is_failed and job.exc_info else None,
    )

@app.get("/scrape/jobs")
def list_jobs():
    """Recent jobs, newest first."""
    from rq.registry import StartedJobRegistry, FinishedJobRegistry, FailedJobRegistry
    started = StartedJobRegistry(queue=q).get_job_ids()
    finished = FinishedJobRegistry(queue=q).get_job_ids()[-20:]
    failed = FailedJobRegistry(queue=q).get_job_ids()[-20:]
    queued = q.get_job_ids()
    return {"queued": queued, "started": started, "finished": finished, "failed": failed}
