from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from .database import engine, SessionLocal
from . import models
from collections import defaultdict
import time

# Automatically create tables (in production, use Alembic for migrations)
models.Base.metadata.create_all(bind=engine)


def _seed_interventions_if_empty():
    """Auto-seeds the intervention_suggestions table on startup if it's empty."""
    from .routers.chat import DEFAULT_INTERVENTIONS
    db = SessionLocal()
    try:
        existing = db.query(models.InterventionSuggestion).count()
        if existing == 0:
            for item in DEFAULT_INTERVENTIONS:
                db.add(models.InterventionSuggestion(
                    category=item["category"],
                    suggestion_text=item["suggestion_text"]
                ))
            db.commit()
            print(f"✅ Auto-seeded {len(DEFAULT_INTERVENTIONS)} intervention suggestions.")
        else:
            print(f"ℹ️  {existing} intervention suggestions already in DB.")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _seed_interventions_if_empty()
    yield


app = FastAPI(
    title="AI Study Assistant API",
    description="Backend for the AI Study Assistant — hardened with batch events, rate limiting, validation bounds, and cached interventions.",
    version="2.0.0",
    lifespan=lifespan
)


# ---- CORS ---- #
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Flaw #2 Fix: Simple In-Memory Rate Limiter ---- #
# Tracks requests per IP per minute. Prevents abuse / forged data flooding.
rate_limit_store: dict = defaultdict(list)
RATE_LIMIT = 60  # requests per minute


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limiting for docs, health, and CORS preflight
    if request.url.path in ("/", "/docs", "/openapi.json", "/api/v1/health") or request.method == "OPTIONS":
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    now = time.time()

    # Clean old entries (older than 60 seconds)
    rate_limit_store[client_ip] = [
        t for t in rate_limit_store[client_ip] if now - t < 60
    ]

    if len(rate_limit_store[client_ip]) >= RATE_LIMIT:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Rate limit exceeded. Max 60 requests per minute."}
        )

    rate_limit_store[client_ip].append(now)
    response = await call_next(request)
    return response


# ---- Register Routers ---- #
from .routers import auth, sessions, events, chat, exercises, analytics

app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(events.router)
app.include_router(chat.router)
app.include_router(exercises.router)
app.include_router(analytics.router)


@app.get("/")
def read_root():
    return {
        "message": "AI Study Assistant Backend v2.0 — Hardened Architecture",
        "features": [
            "JWT Authentication",
            "Batch Event Recording",
            "Rate Limiting (60 req/min)",
            "Validation Bounds on all inputs",
            "Cached Intervention Suggestions",
            "Dashboard Analytics API",
            "SQLite (dev) / PostgreSQL (prod)",
        ]
    }


@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "service": "study_assistant_backend", "version": "2.0.0"}
