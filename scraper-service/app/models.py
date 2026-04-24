from pydantic import BaseModel
from typing import Optional

class ScrapeSearchRequest(BaseModel):
    keywords: list[str]
    limit: int = 25
    user_id: str
    account_id: Optional[str] = None  # which LinkedIn account to use; defaults to first active

class ScrapedLead(BaseModel):
    name: str
    headline: Optional[str] = None
    linkedin_url: str
    linkedin_urn: Optional[str] = None
    company: Optional[str] = None
    post_text: Optional[str] = None
    post_url: Optional[str] = None
    post_date: Optional[str] = None

class JobStatus(BaseModel):
    job_id: str
    status: str  # queued | started | finished | failed
    result: Optional[list[ScrapedLead]] = None
    error: Optional[str] = None
    progress: Optional[dict] = None

class AddAccountRequest(BaseModel):
    account_id: str  # our internal id
    email: str
    password: str
