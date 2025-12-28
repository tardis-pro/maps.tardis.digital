from fastapi import FastAPI

from app.config import settings
from app.routes import tasks_router

app = FastAPI(
    title="Maps ETL Service",
    version="0.1.0",
)

app.include_router(tasks_router)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
