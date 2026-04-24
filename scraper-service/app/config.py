import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    cookie_dir: str = os.getenv("COOKIE_DIR", "/app/data/cookies")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    port: int = int(os.getenv("PORT", "8000"))
    proxy_url: str | None = os.getenv("PROXY_URL") or None
    # defaults; can be overridden per request
    default_search_limit: int = 25
    rate_limit_per_hour: int = int(os.getenv("RATE_LIMIT_PER_HOUR", "600"))
    jitter_min_sec: float = 3.0
    jitter_max_sec: float = 9.0

settings = Settings()
