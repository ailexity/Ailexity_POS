"""
WhatsApp Business Cloud API integration.

Admin setup (one-time):
  1. Create a Meta Business account at business.facebook.com
  2. Add a WhatsApp Business number and get it verified
  3. Create a System User token (Settings → System Users → Add Token)
  4. Note the Phone Number ID from WhatsApp Manager → Phone Numbers
  5. Enter credentials in Settings → WhatsApp

Message modes:
  • text     — free-form text (only works within 24 h of customer messaging you first)
  • template — pre-approved template (works any time; set up in Meta WhatsApp Manager)

API reference: https://developers.facebook.com/docs/whatsapp/cloud-api/messages
"""

from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timezone, timedelta
import httpx

import database
import auth
import schemas

IST = timezone(timedelta(hours=5, minutes=30))
META_API_BASE = "https://graph.facebook.com/v20.0"

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])


# ── Helpers ──────────────────────────────────────────────────────────────

def _get_admin_wa_config(admin_id: str) -> dict:
    """Fetch WhatsApp credentials stored in system_settings (token encrypted storage)."""
    doc = database.system_settings_collection.find_one({"setting_key": f"wa_config_{admin_id}"})
    return doc or {}


def _clean_phone(phone: str) -> str:
    """Strip non-digit characters; ensure country code (default India +91)."""
    digits = "".join(c for c in (phone or "") if c.isdigit())
    if not digits:
        raise ValueError("Empty phone number")
    # Add country code if missing (10-digit Indian number → 91XXXXXXXXXX)
    if len(digits) == 10:
        digits = "91" + digits
    return digits


def _build_text_message(to: str, body: str) -> dict:
    return {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "text",
        "text": {"preview_url": True, "body": body},
    }


def _build_template_message(to: str, template_name: str, params: list[str]) -> dict:
    return {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "en"},
            "components": [
                {
                    "type": "body",
                    "parameters": [{"type": "text", "text": p} for p in params],
                }
            ],
        },
    }


def _build_invoice_body(customer_name: str, business_name: str, invoice_number: str,
                        total_amount: float, invoice_url: str | None) -> str:
    lines = [
        f"Dear {customer_name or 'Valued Customer'},",
        "",
        f"Thank you for your order at {business_name}! 🎉",
        f"Invoice #{invoice_number} — ₹{total_amount:.0f}",
    ]
    if invoice_url:
        lines.append(f"\n👁 View invoice: {invoice_url}")
    lines.append("\nWe appreciate your business! 🙏")
    return "\n".join(lines)


async def _call_meta_api(phone_number_id: str, access_token: str, payload: dict) -> dict:
    """POST to Meta WhatsApp Cloud API. Returns the JSON response."""
    url = f"{META_API_BASE}/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(url, json=payload, headers=headers)
    try:
        data = resp.json()
    except Exception:
        data = {"raw": resp.text}
    if resp.status_code not in (200, 201):
        error_msg = data.get("error", {}).get("message", resp.text)
        raise HTTPException(status_code=502, detail=f"Meta API error: {error_msg}")
    return data


# ── Endpoints ─────────────────────────────────────────────────────────────

@router.get("/status", response_model=schemas.WhatsAppConfigStatus)
async def get_whatsapp_status(current_user: dict = Depends(auth.get_current_active_user)):
    """Returns the admin's WhatsApp config status (no token exposed)."""
    if current_user.get("role") not in ("admin", "sysadmin"):
        raise HTTPException(403, "Admin access required")

    admin_id = auth.resolve_admin_id(current_user)
    cfg = _get_admin_wa_config(admin_id)
    user_doc = database.users_collection.find_one({"_id": ObjectId(admin_id)}) or {}

    return {
        "enabled": bool(user_doc.get("whatsapp_enabled")),
        "from_display": user_doc.get("whatsapp_from_display"),
        "message_type": user_doc.get("whatsapp_message_type", "text"),
        "template_name": user_doc.get("whatsapp_template_name"),
        "has_credentials": bool(cfg.get("phone_number_id") and cfg.get("access_token")),
    }


@router.put("/config")
async def save_whatsapp_config(
    config: schemas.WhatsAppConfigSave,
    current_user: dict = Depends(auth.get_admin_user),
):
    """Save WhatsApp Business API credentials. Token is stored in system_settings (not in user doc)."""
    admin_id = auth.resolve_admin_id(current_user)

    # Store sensitive credentials separately from user doc
    database.system_settings_collection.update_one(
        {"setting_key": f"wa_config_{admin_id}"},
        {"$set": {
            "setting_key": f"wa_config_{admin_id}",
            "phone_number_id": config.phone_number_id,
            "access_token": config.access_token,
            "updated_at": datetime.now(IST),
        }},
        upsert=True,
    )

    # Store non-sensitive config on user doc for fast access
    database.users_collection.update_one(
        {"_id": ObjectId(admin_id)},
        {"$set": {
            "whatsapp_enabled": config.enabled,
            "whatsapp_from_display": config.from_display,
            "whatsapp_message_type": config.message_type,
            "whatsapp_template_name": config.template_name,
        }},
    )

    return {"status": "saved", "enabled": config.enabled}


@router.delete("/config")
async def remove_whatsapp_config(current_user: dict = Depends(auth.get_admin_user)):
    """Remove WhatsApp API credentials and disable the integration."""
    admin_id = auth.resolve_admin_id(current_user)
    database.system_settings_collection.delete_one({"setting_key": f"wa_config_{admin_id}"})
    database.users_collection.update_one(
        {"_id": ObjectId(admin_id)},
        {"$set": {
            "whatsapp_enabled": False,
            "whatsapp_from_display": None,
            "whatsapp_message_type": "text",
            "whatsapp_template_name": None,
        }},
    )
    return {"status": "removed"}


@router.post("/send")
async def send_whatsapp(
    req: schemas.WhatsAppSendRequest,
    current_user: dict = Depends(auth.get_current_active_user),
):
    """
    Send invoice notification via WhatsApp Business Cloud API.

    Falls back to a 400 error if API is not configured so the frontend
    can fall back to the wa.me redirect gracefully.
    """
    admin_id = auth.resolve_admin_id(current_user)
    user_doc = database.users_collection.find_one({"_id": ObjectId(admin_id)}) or {}

    if not user_doc.get("whatsapp_enabled"):
        raise HTTPException(400, "WhatsApp API not enabled for this account")

    cfg = _get_admin_wa_config(admin_id)
    phone_number_id = cfg.get("phone_number_id")
    access_token = cfg.get("access_token")
    if not phone_number_id or not access_token:
        raise HTTPException(400, "WhatsApp credentials not configured. Go to Settings → WhatsApp.")

    to = _clean_phone(req.to_phone)
    business_name = user_doc.get("business_name") or user_doc.get("username") or "Our Store"
    message_type = user_doc.get("whatsapp_message_type", "text")

    if message_type == "template":
        template_name = user_doc.get("whatsapp_template_name")
        if not template_name:
            raise HTTPException(400, "Template name not configured")
        payload = _build_template_message(
            to=to,
            template_name=template_name,
            params=[
                req.customer_name or "Valued Customer",
                business_name,
                req.invoice_number,
                f"₹{req.total_amount:.0f}",
            ],
        )
    else:
        body = _build_invoice_body(
            customer_name=req.customer_name,
            business_name=business_name,
            invoice_number=req.invoice_number,
            total_amount=req.total_amount,
            invoice_url=req.invoice_url,
        )
        payload = _build_text_message(to=to, body=body)

    result = await _call_meta_api(phone_number_id, access_token, payload)
    return {"status": "sent", "meta_response": result}


@router.post("/test")
async def send_test_message(current_user: dict = Depends(auth.get_admin_user)):
    """Send a test WhatsApp message to the configured from_display number itself."""
    admin_id = auth.resolve_admin_id(current_user)
    user_doc = database.users_collection.find_one({"_id": ObjectId(admin_id)}) or {}
    cfg = _get_admin_wa_config(admin_id)

    phone_number_id = cfg.get("phone_number_id")
    access_token = cfg.get("access_token")
    from_display = user_doc.get("whatsapp_from_display")

    if not phone_number_id or not access_token:
        raise HTTPException(400, "Credentials not configured")
    if not from_display:
        raise HTTPException(400, "from_display phone not set")

    to = _clean_phone(from_display)
    payload = _build_text_message(
        to=to,
        body="✅ Ailexity POS — WhatsApp test message. Your integration is working!",
    )
    result = await _call_meta_api(phone_number_id, access_token, payload)
    return {"status": "sent", "meta_response": result}
