from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
import os
from dotenv import load_dotenv
import database
from routers import users, items, invoices, ai_assistant, tables, alerts, table_carts, online_orders, raw_stock, parties, kots

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
app.include_router(kots.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Ailexity POS API - MongoDB Edition"}


# Templates for HTML error pages
templates_dir = os.path.join(os.path.dirname(__file__), "templates")
templates = Jinja2Templates(directory=templates_dir)


@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    # Render an HTML page for browsers, otherwise return JSON
    accept = request.headers.get("accept", "")
    if "text/html" in accept:
        # prefer specific status template like 404.html, 500.html
        status_template = f"{exc.status_code}.html"
        template_path = os.path.join(templates_dir, status_template)
        if os.path.exists(template_path):
            return templates.TemplateResponse(status_template, {"request": request, "status_code": exc.status_code, "detail": exc.detail}, status_code=exc.status_code)
        return templates.TemplateResponse("error.html", {"request": request, "status_code": exc.status_code, "detail": exc.detail}, status_code=exc.status_code)
    return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    accept = request.headers.get("accept", "")
    if "text/html" in accept:
        return templates.TemplateResponse("422.html", {"request": request, "errors": exc.errors()}, status_code=422)
    return JSONResponse({"detail": exc.errors()}, status_code=422)


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    # Log the exception server-side and return friendly error page
    import traceback
    traceback.print_exc()
    accept = request.headers.get("accept", "")
    if "text/html" in accept:
        return templates.TemplateResponse("500.html", {"request": request, "message": str(exc)}, status_code=500)
    return JSONResponse({"detail": "Internal Server Error"}, status_code=500)

