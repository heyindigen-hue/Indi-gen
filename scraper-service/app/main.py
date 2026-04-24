from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Indi-gen Scraper Service")


class SearchRequest(BaseModel):
    keywords: list[str]
    limit: int = 10


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/scrape/search")
def scrape_search(request: SearchRequest):
    # TODO: implement linkedin_client search
    return {"status": "not_implemented", "keywords": request.keywords, "limit": request.limit}


@app.get("/scrape/profile/{public_id}")
def scrape_profile(public_id: str):
    # TODO: implement linkedin_client profile fetch
    return {"status": "not_implemented", "public_id": public_id}
