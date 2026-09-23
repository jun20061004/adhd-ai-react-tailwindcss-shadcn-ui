from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.routers import ai, health, tasks

from app.core.database import init_db

app = FastAPI(
    title="ADHD AI Task Manager API",
    version="0.1.0",
)

allowed_origins = [
    origin.strip()
    for origin in settings.cors_origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(tasks.router)
app.include_router(ai.router)


@app.on_event("startup")
def on_startup() -> None:
    init_db()



@app.on_event("startup")
def on_startup():
    #恢复为完全同步的调用
    init_db()


@app.get("/")
async def root() -> dict:
    return {
        "service": "ADHD AI Task Manager",
        "version": "0.1.0",
        "docs": "/docs",
    }
