from fastapi import FastAPI

from app.config import settings

app = FastAPI(
    title="Maps ETL Service",
    version="0.1.0",
)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
