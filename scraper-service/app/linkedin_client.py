import pickle
import random
import time
from pathlib import Path
from typing import Optional
from linkedin_api import Linkedin
from linkedin_api.client import ChallengeException
import requests
import logging

from app.config import settings

log = logging.getLogger("linkedin")

def cookie_path(account_id: str) -> Path:
    p = Path(settings.cookie_dir) / f"{account_id}.pkl"
    p.parent.mkdir(parents=True, exist_ok=True)
    return p

def get_client(account_id: str, email: str, password: str) -> Linkedin:
    path = cookie_path(account_id)
    proxies = {"https": settings.proxy_url} if settings.proxy_url else None

    if path.exists():
        try:
            with path.open("rb") as f:
                jar = pickle.load(f)
            api = Linkedin(email, password, cookies=jar, authenticate=True, proxies=proxies)
            log.info(f"[{account_id}] reused persisted cookies")
            return api
        except Exception as e:
            log.warning(f"[{account_id}] cookie load failed: {e}; re-login")
            path.unlink(missing_ok=True)

    log.info(f"[{account_id}] full login")
    api = Linkedin(email, password, proxies=proxies)
    with path.open("wb") as f:
        pickle.dump(api.client.session.cookies, f)
    return api

def safe_call(fn, *args, max_retries: int = 4, **kwargs):
    for attempt in range(max_retries):
        try:
            # jitter between calls
            time.sleep(random.uniform(settings.jitter_min_sec, settings.jitter_max_sec))
            return fn(*args, **kwargs)
        except ChallengeException:
            log.error("ChallengeException — clearing cookies, propagating")
            raise
        except requests.HTTPError as e:
            code = e.response.status_code if e.response else 0
            if code == 429:
                wait = 60 * (2 ** attempt)
                log.warning(f"429 rate-limited, sleeping {wait}s")
                time.sleep(wait)
                continue
            if code in (500, 502, 503, 504):
                time.sleep(5 * (2 ** attempt))
                continue
            raise
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            log.warning(f"call failed ({e}), retry {attempt + 1}")
            time.sleep(3 * (2 ** attempt))
    raise RuntimeError("exhausted retries")
