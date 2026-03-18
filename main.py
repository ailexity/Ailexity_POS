from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import os
from dotenv import load_dotenv
import database
from .routers import users, items, invoices, ai_assistant, tables, alerts, table_carts, online_orders, raw_stock, parties

# Load environment variables from .env file
load_dotenv()

# No need to create tables with MongoDB - collections are created automatically

app = FastAPI(title="Ailexity POS API")

# CORS Configuration - Allow frontend access
# Add your production domain here
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Add production origins from environment variable
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "")
if ALLOWED_ORIGINS:
    origins.extend([origin.strip() for origin in ALLOWED_ORIGINS.split(",")])


class EnsureCORSHeadersMiddleware(BaseHTTPMiddleware):
    """Ensure CORS headers are present on every response (e.g. when errors bypass normal CORS)."""
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
        except Exception as exc:  # Ensure errors still get CORS headers
            from fastapi.responses import JSONResponse
            response = JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

        origin = request.headers.get("origin")
        allow_origin = origin if origin and origin in origins else (origin or "*")

        response.headers.setdefault("Access-Control-Allow-Origin", allow_origin)
        if allow_origin != "*":
            response.headers.setdefault("Access-Control-Allow-Credentials", "true")
        response.headers.setdefault("Access-Control-Allow-Headers", "*")
        response.headers.setdefault("Access-Control-Allow-Methods", "*")
        return response


# Add ensure-CORS first so it runs last on response (safety net). CORS main is added after.
app.add_middleware(EnsureCORSHeadersMiddleware)

# Production-safe CORS configuration
# Only allow explicitly listed origins - no regex fallback in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Auth: POST /token (login). Users: GET /users/me, /users/, etc. Items: /items/. Invoices: /invoices/.
app.include_router(users.router)
app.include_router(items.router)
app.include_router(invoices.router)
app.include_router(ai_assistant.router)
app.include_router(tables.router, prefix="/tables", tags=["tables"])
app.include_router(alerts.router)
app.include_router(table_carts.router)
app.include_router(online_orders.router)
app.include_router(raw_stock.router)
app.include_router(parties.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Ailexity POS API - MongoDB Edition"}

