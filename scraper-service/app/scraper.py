import random
import time
from datetime import datetime
from typing import Iterable
import logging

from app.linkedin_client import get_client, safe_call
from app.models import ScrapedLead

log = logging.getLogger("scraper")

def run_search(keywords: list[str], limit: int, user_id: str,
               account_id: str, email: str, password: str) -> list[dict]:
    api = get_client(account_id, email, password)
    query = " ".join(keywords)
    log.info(f"searching '{query}' limit={limit}")

    hits = safe_call(api.search_people, keywords=query, limit=limit) or []
    log.info(f"got {len(hits)} hits")

    leads: list[dict] = []
    for i, hit in enumerate(hits):
        try:
            public_id = hit.get("public_id") or hit.get("publicIdentifier")
            urn_id = hit.get("urn_id") or hit.get("urnId")
            if not public_id:
                continue

            profile = safe_call(api.get_profile, public_id=public_id) or {}
            name = f"{profile.get('firstName','').strip()} {profile.get('lastName','').strip()}".strip()
            headline = profile.get("headline") or hit.get("jobtitle")

            company = None
            xp = profile.get("experience") or []
            if xp:
                company = xp[0].get("companyName")

            post_text = post_url = post_date = None
            try:
                posts = safe_call(api.get_profile_posts, public_id=public_id, post_count=1) or []
                if posts:
                    p = posts[0]
                    post_text = (p.get("commentary") or {}).get("text") or ""
                    urn = (p.get("updateMetadata") or {}).get("urn")
                    if urn:
                        post_url = f"https://www.linkedin.com/feed/update/{urn}/"
                    ts = p.get("createdAt")
                    if ts:
                        post_date = datetime.utcfromtimestamp(ts / 1000).isoformat() + "Z"
            except Exception as e:
                log.debug(f"no posts for {public_id}: {e}")

            leads.append(ScrapedLead(
                name=name or hit.get("name", ""),
                headline=headline,
                linkedin_url=f"https://www.linkedin.com/in/{public_id}/",
                linkedin_urn=urn_id,
                company=company,
                post_text=post_text,
                post_url=post_url,
                post_date=post_date,
            ).model_dump())
        except Exception as e:
            log.warning(f"skip hit {i}: {e}")
            continue

    log.info(f"returning {len(leads)} leads")
    return leads
