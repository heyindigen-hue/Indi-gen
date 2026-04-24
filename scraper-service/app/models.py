from pydantic import BaseModel


class ProfileResult(BaseModel):
    public_id: str
    name: str | None = None
    headline: str | None = None
    location: str | None = None
    connection_count: int | None = None


class SearchResult(BaseModel):
    profiles: list[ProfileResult] = []
    total: int = 0
