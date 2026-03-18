from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, Response
from typing import List
from datetime import datetime, timezone, timedelta
from pymongo.database import Database
from bson import ObjectId
from html import escape
import os
import io
from ailexity_backend import schemas, database, auth
from ailexity_backend.models import InvoiceDocument, InvoiceItemDocument, serialize_doc, serialize_docs

# India Standard Time (IST) - GMT+5:30
IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(
    prefix="/invoices",
    tags=["invoices"],
)

WALK_IN_LABELS = {
    "walk-in customer",
    "walk in customer",
    "walk-in",
    "walk in",
    "walkin",
    "cash customer",
    "cash sale",
}


def _is_walk_in_customer(customer_name: str) -> bool:
    return (customer_name or "").strip().lower() in WALK_IN_LABELS


def _ensure_customer_party(admin_id: str, customer_name: str, customer_phone: str = ""):
    customer_name = (customer_name or "").strip()
    customer_phone = (customer_phone or "").strip()
    if not customer_name or _is_walk_in_customer(customer_name):
        return None

    query = {
        "admin_id": admin_id,
        "party_name": customer_name,
        "party_type": {"$in": ["customer", "both"]},
    }
    if customer_phone:
        query["$or"] = [{"phone": customer_phone}, {"phone": None}, {"phone": ""}]

    existing = database.parties_collection.find_one(query)
    if existing:
        updates = {}
        if customer_phone and not existing.get("phone"):
            updates["phone"] = customer_phone
        if updates:
            updates["updated_at"] = datetime.now(IST)
            database.parties_collection.update_one({"_id": existing["_id"]}, {"$set": updates})
        return existing

    now = datetime.now(IST)
    party_doc = {
        "admin_id": admin_id,
        "party_name": customer_name,
        "party_type": "customer",
        "contact_person": None,
        "phone": customer_phone or None,
        "email": None,
        "address": None,
        "gstin": None,
        "credit_limit": 0.0,
        "payment_terms_days": 0,
        "opening_balance": 0.0,
        "notes": "Auto-created from invoice",
        "is_active": True,
        "current_balance": 0.0,
        "total_receivable": 0.0,
        "total_payable": 0.0,
        "created_at": now,
        "updated_at": now,
    }
    result = database.parties_collection.insert_one(party_doc)
    party_doc["_id"] = result.inserted_id
    return party_doc


def _create_invoice_party_ledger(admin_id: str, invoice_dict: dict):
    customer_name = invoice_dict.get("customer_name") or ""
    if not customer_name or _is_walk_in_customer(customer_name):
        return

    party = _ensure_customer_party(
        admin_id=admin_id,
        customer_name=customer_name,
        customer_phone=invoice_dict.get("customer_phone") or "",
    )
    if not party:
        return

    amount = float(invoice_dict.get("total_amount") or 0)
    if amount <= 0:
        return

    status_text = str(invoice_dict.get("payment_status") or "Paid").strip().lower()
    paid_amount = amount if status_text == "paid" else 0.0
    due_amount = max(0.0, amount - paid_amount)
    ledger_status = "paid" if due_amount == 0 else "open"

    invoice_time = invoice_dict.get("created_at")
    if not isinstance(invoice_time, datetime):
        invoice_time = datetime.now(IST)

    terms_days = int(party.get("payment_terms_days") or 0)
    due_date = invoice_time + timedelta(days=max(0, terms_days))
    now = datetime.now(IST)

    ledger_doc = {
        "admin_id": admin_id,
        "party_id": str(party["_id"]),
        "entry_type": "sale",
        "amount": round(amount, 2),
        "paid_amount": round(paid_amount, 2),
        "due_amount": round(due_amount, 2),
        "status": ledger_status,
        "direction": "increase_receivable",
        "reference_no": invoice_dict.get("invoice_number"),
        "due_date": due_date,
        "notes": "Auto-posted from invoice",
        "created_at": now,
        "updated_at": now,
    }
    database.party_ledger_collection.insert_one(ledger_doc)

    # Recompute party balances from ledger.
    ledger_rows = list(
        database.party_ledger_collection.find(
            {"admin_id": admin_id, "party_id": str(party["_id"])}
        )
    )

    balance = 0.0
    receivable = 0.0
    payable = 0.0
    for row in ledger_rows:
        row_type = row.get("entry_type")
        row_amount = float(row.get("amount") or 0)
        if row_type == "sale":
            balance += row_amount
        elif row_type == "purchase":
            balance -= row_amount
        elif row_type == "payment_in":
            balance -= row_amount
        elif row_type == "payment_out":
            balance += row_amount
        elif row_type == "adjustment":
            balance += row_amount

        if row.get("status") in ["open", "partial"]:
            row_due = float(row.get("due_amount") or 0)
            if row_type == "sale":
                receivable += row_due
            elif row_type == "purchase":
                payable += row_due

    database.parties_collection.update_one(
        {"_id": party["_id"]},
        {
            "$set": {
                "current_balance": round(balance, 2),
                "total_receivable": round(receivable, 2),
                "total_payable": round(payable, 2),
                "updated_at": datetime.now(IST),
            }
        },
    )


def _get_public_invoice_data(invoice_id: str, db: Database):
    if not ObjectId.is_valid(invoice_id):
        raise HTTPException(status_code=404, detail="Invalid invoice ID")

    invoice = database.invoices_collection.find_one({"_id": ObjectId(invoice_id)})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice_dict = serialize_doc(invoice)
    admin = database.users_collection.find_one({"_id": ObjectId(invoice["admin_id"])})
    if admin:
        invoice_dict['business_name'] = admin.get('business_name')
        invoice_dict['business_address'] = admin.get('business_address')
        invoice_dict['store_email'] = admin.get('store_email')
        invoice_dict['store_phone'] = admin.get('store_phone')
        invoice_dict['gstin'] = admin.get('gstin')
        invoice_dict['fssai_license'] = admin.get('fssai_license')
        invoice_dict['pan_number'] = admin.get('pan_number')
        invoice_dict['bank_account'] = admin.get('bank_account')
        invoice_dict['bank_name'] = admin.get('bank_name')
        invoice_dict['account_name'] = admin.get('account_name')
        invoice_dict['invoice_notes'] = admin.get('invoice_notes')
        invoice_dict['invoice_terms'] = admin.get('invoice_terms')

    return invoice_dict

@router.get("/", response_model=List[schemas.InvoiceResponse])
def read_invoices(
    skip: int = 0, 
    limit: int = 100, 
    db: Database = Depends(database.get_db), 
    current_user: dict = Depends(auth.get_current_active_user)
):
    """Get invoices - filtered by admin_id for multi-tenant isolation"""
    if current_user.get("role") == 'sysadmin':
        # SysAdmin can see all invoices
        invoices = list(database.invoices_collection.find({}).sort("created_at", -1).skip(skip).limit(limit))
    else:
        # Admin sees only their own invoices
        invoices = list(database.invoices_collection.find(
            {"admin_id": current_user["id"]}
        ).sort("created_at", -1).skip(skip).limit(limit))
    
    # Enrich invoices with admin store details
    result = []
    for invoice in invoices:
        invoice_dict = serialize_doc(invoice)
        # Get admin details
        admin = database.users_collection.find_one({"_id": ObjectId(invoice["admin_id"])})
        if admin:
            invoice_dict['business_name'] = admin.get('business_name')
            invoice_dict['business_address'] = admin.get('business_address')
            invoice_dict['store_email'] = admin.get('store_email')
            invoice_dict['store_phone'] = admin.get('store_phone')
            invoice_dict['gstin'] = admin.get('gstin')
            invoice_dict['fssai_license'] = admin.get('fssai_license')
            invoice_dict['pan_number'] = admin.get('pan_number')
            invoice_dict['bank_account'] = admin.get('bank_account')
            invoice_dict['bank_name'] = admin.get('bank_name')
            invoice_dict['account_name'] = admin.get('account_name')
            invoice_dict['invoice_notes'] = admin.get('invoice_notes')
            invoice_dict['invoice_terms'] = admin.get('invoice_terms')
        result.append(invoice_dict)
    
    return result

@router.get("/public/{invoice_id}", response_model=schemas.InvoiceResponse)
def get_public_invoice(invoice_id: str, db: Database = Depends(database.get_db)):
    """Get invoice by ID - PUBLIC endpoint for WhatsApp sharing (no auth required)"""
    try:
        return _get_public_invoice_data(invoice_id, db)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Invoice not found: {str(e)}")


@router.get("/public/{invoice_id}/preview-image")
def get_public_invoice_preview_image(invoice_id: str, db: Database = Depends(database.get_db)):
    """Generate a minimal invoice preview image for social/WhatsApp link previews."""
    invoice = _get_public_invoice_data(invoice_id, db)

    customer_name = invoice.get('customer_name') or 'Walk-in Customer'
    business_name = invoice.get('business_name') or 'Ailexity POS'
    invoice_number = invoice.get('invoice_number') or 'INVOICE'
    created_at = invoice.get('created_at')
    total_amount = float(invoice.get('total_amount') or 0)
    payment_mode = invoice.get('payment_mode') or 'Cash'

    date_text = ''
    if created_at:
        try:
            if isinstance(created_at, datetime):
                dt = created_at
            else:
                dt = datetime.fromisoformat(str(created_at).replace('Z', '+00:00'))
            date_text = dt.strftime('%d %b %Y')
        except Exception:
            date_text = str(created_at)

    try:
        from PIL import Image, ImageDraw, ImageFont  # pyright: ignore[reportMissingImports]

        width, height = 1200, 630
        image = Image.new('RGB', (width, height), (255, 255, 255))
        draw = ImageDraw.Draw(image)

        def get_font(size=28, bold=False):
            try:
                if bold:
                    return ImageFont.truetype('DejaVuSans-Bold.ttf', size)
                return ImageFont.truetype('DejaVuSans.ttf', size)
            except Exception:
                return ImageFont.load_default()

        primary = (17, 24, 39)
        muted = (107, 114, 128)
        soft = (249, 250, 251)
        border = (229, 231, 235)

        draw.rectangle((0, 0, width, 96), fill=primary)
        draw.text((44, 32), business_name[:52], fill=(255, 255, 255), font=get_font(34, True))

        card_x, card_y, card_w, card_h = 44, 132, width - 88, 430
        draw.rectangle((card_x, card_y, card_x + card_w, card_y + card_h), fill=soft, outline=border, width=2)

        draw.text((72, 176), 'TAX INVOICE', fill=primary, font=get_font(44, True))
        draw.text((72, 240), f'Invoice: {invoice_number}', fill=muted, font=get_font(30, False))
        draw.text((72, 290), f'Customer: {customer_name[:38]}', fill=muted, font=get_font(30, False))
        draw.text((72, 340), f'Payment: {payment_mode}', fill=muted, font=get_font(30, False))
        if date_text:
            draw.text((72, 390), f'Date: {date_text}', fill=muted, font=get_font(30, False))

        draw.text((width - 72, 264), f'₹{total_amount:.2f}', fill=primary, font=get_font(52, True), anchor='ra')
        draw.text((width - 72, 312), 'Total Amount', fill=muted, font=get_font(24, False), anchor='ra')

        draw.text((44, height - 36), 'Powered by Ailexity POS', fill=muted, font=get_font(20, False))

        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        buffer.seek(0)

        return Response(
            content=buffer.getvalue(),
            media_type='image/png',
            headers={"Cache-Control": "public, max-age=300"}
        )
    except Exception:
        fallback_svg = f"""
<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'>
  <rect width='1200' height='630' fill='#ffffff'/>
  <rect width='1200' height='96' fill='#111827'/>
  <text x='44' y='58' font-family='Arial' font-size='34' fill='white'>{escape(business_name)}</text>
  <rect x='44' y='132' width='1112' height='430' fill='#f9fafb' stroke='#e5e7eb' stroke-width='2'/>
  <text x='72' y='210' font-family='Arial' font-size='44' fill='#111827' font-weight='700'>TAX INVOICE</text>
  <text x='72' y='260' font-family='Arial' font-size='30' fill='#6b7280'>Invoice: {escape(invoice_number)}</text>
  <text x='72' y='310' font-family='Arial' font-size='30' fill='#6b7280'>Customer: {escape(customer_name[:38])}</text>
  <text x='72' y='360' font-family='Arial' font-size='30' fill='#6b7280'>Payment: {escape(payment_mode)}</text>
  <text x='72' y='410' font-family='Arial' font-size='30' fill='#6b7280'>Date: {escape(date_text)}</text>
  <text x='1128' y='276' text-anchor='end' font-family='Arial' font-size='52' fill='#111827' font-weight='700'>₹{total_amount:.2f}</text>
  <text x='1128' y='318' text-anchor='end' font-family='Arial' font-size='24' fill='#6b7280'>Total Amount</text>
  <text x='44' y='594' font-family='Arial' font-size='20' fill='#6b7280'>Powered by Ailexity POS</text>
</svg>
""".strip()
        return Response(content=fallback_svg, media_type='image/svg+xml', headers={"Cache-Control": "public, max-age=300"})


@router.get("/public/{invoice_id}/share", response_class=HTMLResponse)
def get_public_invoice_share_page(invoice_id: str, request: Request, db: Database = Depends(database.get_db)):
    """Public metadata endpoint for WhatsApp/social preview with invoice card image."""
    invoice = _get_public_invoice_data(invoice_id, db)

    business_name = invoice.get('business_name') or 'Ailexity POS'
    customer_name = invoice.get('customer_name') or 'Walk-in Customer'
    invoice_number = invoice.get('invoice_number') or 'INVOICE'
    total_amount = float(invoice.get('total_amount') or 0)

    base_url = str(request.base_url).rstrip('/')
    preview_image_url = f"{base_url}/invoices/public/{invoice_id}/preview-image"

    frontend_base_url = os.getenv("PUBLIC_FRONTEND_URL", "").strip().rstrip('/')
    if frontend_base_url:
        invoice_view_url = f"{frontend_base_url}/invoice/{invoice_id}"
    else:
        invoice_view_url = f"{base_url}/invoice/{invoice_id}"

    title = f"Invoice {invoice_number} • {business_name}"
    description = f"Invoice for {customer_name} • Total ₹{total_amount:.2f}"

    html = f"""
<!doctype html>
<html lang='en'>
<head>
  <meta charset='utf-8' />
  <meta name='viewport' content='width=device-width, initial-scale=1' />
  <title>{escape(title)}</title>
  <meta name='description' content='{escape(description)}' />

  <meta property='og:type' content='website' />
  <meta property='og:title' content='{escape(title)}' />
  <meta property='og:description' content='{escape(description)}' />
  <meta property='og:image' content='{escape(preview_image_url)}' />
  <meta property='og:url' content='{escape(invoice_view_url)}' />

  <meta name='twitter:card' content='summary_large_image' />
  <meta name='twitter:title' content='{escape(title)}' />
  <meta name='twitter:description' content='{escape(description)}' />
  <meta name='twitter:image' content='{escape(preview_image_url)}' />

  <meta http-equiv='refresh' content='0;url={escape(invoice_view_url)}' />
</head>
<body style='font-family: Arial, sans-serif; background: #f9fafb; color:#111827; display:flex; align-items:center; justify-content:center; min-height:100vh;'>
  <div style='background:white; border:1px solid #e5e7eb; border-radius:12px; padding:24px; max-width:560px; width:100%; text-align:center;'>
    <h1 style='margin:0 0 8px 0; font-size:22px;'>Invoice Preview</h1>
    <p style='margin:0 0 16px 0; color:#6b7280;'>{escape(description)}</p>
    <a href='{escape(invoice_view_url)}' style='display:inline-block; padding:10px 16px; border-radius:8px; background:#111827; color:white; text-decoration:none;'>Open Invoice</a>
  </div>
</body>
</html>
""".strip()

    return HTMLResponse(content=html)

@router.get("/statistics")
def get_statistics(
    db: Database = Depends(database.get_db),
    current_user: dict = Depends(auth.get_current_active_user)
):
    """Get dashboard statistics - optimized endpoint"""
    try:
        if current_user.get("role") == 'sysadmin':
            invoices = list(database.invoices_collection.find({}))
            items = list(database.items_collection.find({}))
        else:
            invoices = list(database.invoices_collection.find({"admin_id": current_user["id"]}))
            items = list(database.items_collection.find({"admin_id": current_user["id"]}))
        
        # Helper function to safely parse datetime - make timezone-naive for comparison
        def parse_invoice_date(inv):
            try:
                created_at = inv.get('created_at')
                if isinstance(created_at, datetime):
                    # Remove timezone info for comparison
                    return created_at.replace(tzinfo=None) if created_at.tzinfo else created_at
                elif isinstance(created_at, str):
                    # Handle ISO format with or without 'Z'
                    date_str = created_at.replace('Z', '+00:00')
                    dt = datetime.fromisoformat(date_str)
                    # Remove timezone info
                    return dt.replace(tzinfo=None)
                else:
                    return datetime.now()
            except Exception as e:
                return datetime.now()
        
        # Calculate statistics
        total_revenue = sum(inv.get('total_amount', 0) for inv in invoices)
        
        # Use timezone-naive datetime for comparison
        now = datetime.now()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Today's stats - compare timezone-naive datetimes
        today_invoices = [inv for inv in invoices if parse_invoice_date(inv) >= today]
        today_revenue = sum(inv.get('total_amount', 0) for inv in today_invoices)
        
        # Yesterday's stats
        yesterday = today - timedelta(days=1)
        yesterday_invoices = [inv for inv in invoices if yesterday <= parse_invoice_date(inv) < today]
        yesterday_revenue = sum(inv.get('total_amount', 0) for inv in yesterday_invoices)
        
        # Week stats
        week_start = today - timedelta(days=today.weekday())
        week_invoices = [inv for inv in invoices if parse_invoice_date(inv) >= week_start]
        week_revenue = sum(inv.get('total_amount', 0) for inv in week_invoices)
        
        # Month stats
        month_start = today.replace(day=1)
        month_invoices = [inv for inv in invoices if parse_invoice_date(inv) >= month_start]
        month_revenue = sum(inv.get('total_amount', 0) for inv in month_invoices)
        
        # Low stock items
        low_stock_items = len([item for item in items if item.get('limit_stock') and item.get('stock_quantity', 0) < 10])
        
        # Payment modes
        payment_modes = {}
        for inv in invoices:
            mode = inv.get('payment_mode', 'Cash')
            payment_modes[mode] = payment_modes.get(mode, 0) + 1
        
        # Hourly data for today
        hourly_data = [0] * 24
        for inv in today_invoices:
            try:
                inv_dt = parse_invoice_date(inv)
                hour = inv_dt.hour
                hourly_data[hour] += inv.get('total_amount', 0)
            except Exception:
                continue
        
        # Calculate profit for today and month
        def calculate_profit(invoices):
            total_profit = 0.0
            for inv in invoices:
                items = inv.get('items', [])
                for item in items:
                    # Get profit from item (already calculated in InvoiceItemDocument)
                    total_profit += item.get('profit', 0.0)
            return total_profit
        
        today_profit = calculate_profit(today_invoices)
        month_profit = calculate_profit(month_invoices)
        
        return {
            "totalRevenue": total_revenue,
            "totalOrders": len(invoices),
            "totalItems": len(items),
            "avgOrderValue": total_revenue / len(invoices) if invoices else 0,
            "todayRevenue": today_revenue,
            "todayOrders": len(today_invoices),
            "todayProfit": today_profit,
            "yesterdayRevenue": yesterday_revenue,
            "yesterdayOrders": len(yesterday_invoices),
            "weekRevenue": week_revenue,
            "weekOrders": len(week_invoices),
            "monthRevenue": month_revenue,
            "monthOrders": len(month_invoices),
            "monthProfit": month_profit,
            "lowStockItems": low_stock_items,
            "paymentModes": payment_modes,
            "hourlyData": hourly_data
        }
    except Exception as e:
        print(f"Error in statistics endpoint: {e}")
        import traceback
        traceback.print_exc()
        # Return empty statistics on error
        return {
            "totalRevenue": 0,
            "totalOrders": 0,
            "totalItems": 0,
            "avgOrderValue": 0,
            "todayRevenue": 0,
            "todayOrders": 0,
            "todayProfit": 0,
            "yesterdayRevenue": 0,
            "yesterdayOrders": 0,
            "weekRevenue": 0,
            "weekOrders": 0,
            "monthRevenue": 0,
            "monthOrders": 0,
            "monthProfit": 0,
            "lowStockItems": 0,
            "paymentModes": {},
            "hourlyData": [0] * 24
        }

@router.post("/", response_model=schemas.InvoiceResponse)
def create_invoice(
    invoice: schemas.InvoiceCreate, 
    db: Database = Depends(database.get_db), 
    current_user: dict = Depends(auth.get_current_active_user)
):
    """Create invoice - auto-assign admin_id"""
    if current_user.get("role") == 'sysadmin':
        raise HTTPException(
            status_code=403, 
            detail="SysAdmin cannot create invoices. Please login as an admin user to use RECO POS."
        )
    
    if current_user.get("role") != 'admin':
        raise HTTPException(
            status_code=403,
            detail="Only admin users can create invoices"
        )
    
    # Generate Sequential Invoice Number per Admin
    admin_id = current_user["id"]
    counter_key = f"invoice_counter_{admin_id}"
    
    # Get or create counter for this admin
    counter_doc = database.system_settings_collection.find_one({"setting_key": counter_key})
    
    if counter_doc:
        next_number = counter_doc["value"] + 1
        database.system_settings_collection.update_one(
            {"setting_key": counter_key},
            {"$set": {"value": next_number}}
        )
    else:
        next_number = 1
        database.system_settings_collection.insert_one({
            "setting_key": counter_key,
            "value": next_number,
            "admin_id": admin_id,
            "created_at": datetime.now(IST)
        })
    
    # Format invoice number: INV-00001 (admin-specific)
    inv_number = f"INV-{str(next_number).zfill(5)}"
    
    total_amount = 0.0
    invoice_items = []
    
    for item in invoice.items:
        # Check stock - only for items belonging to this admin
        manufacturing_cost = 0.0  # Default if item not found
        if item.item_id:
            db_item = database.items_collection.find_one({
                "_id": ObjectId(item.item_id),
                "admin_id": current_user["id"]  # Security: only admin's items
            })
            
            if not db_item:
                raise HTTPException(status_code=404, detail=f"Item {item.item_id} not found or access denied")
            
            # Get manufacturing cost from item
            manufacturing_cost = db_item.get("manufacturing_cost", 0.0)
            
            if db_item.get("limit_stock"):
                if db_item.get("stock_quantity", 0) < item.quantity:
                    raise HTTPException(status_code=400, detail=f"Not enough stock for {db_item['name']}")
                # Update stock
                database.items_collection.update_one(
                    {"_id": ObjectId(item.item_id)},
                    {"$inc": {"stock_quantity": -item.quantity}}
                )
        
        # Calculate row total
        row_total = (item.unit_price * item.quantity) + item.tax_amount
        total_amount += row_total
        
        # Create invoice item document with manufacturing cost
        invoice_item = InvoiceItemDocument.create(
            item_id=item.item_id,
            item_name=item.item_name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            tax_amount=item.tax_amount,
            total_price=row_total,
            manufacturing_cost=manufacturing_cost
        )
        invoice_items.append(invoice_item)
    
    # Create invoice with embedded items
    # Use the device timestamp directly - Pydantic converts ISO string to datetime automatically
    # The datetime from frontend is in UTC, so we don't apply any timezone conversion
    # This preserves the actual time the order was created on the device
    invoice_time = invoice.created_at if invoice.created_at else datetime.now(IST)
    
    new_invoice = InvoiceDocument.create(
        admin_id=current_user["id"],
        invoice_number=inv_number,
        customer_name=invoice.customer_name,
        customer_phone=invoice.customer_phone,
        customer_address=invoice.customer_address,
        customer_gstin=invoice.customer_gstin,
        total_amount=total_amount,
        payment_mode=invoice.payment_mode,
        transaction_id=invoice.transaction_id,
        payment_status=invoice.payment_status,
        items=invoice_items,
        created_at=invoice_time
    )
    
    # Add table information if provided
    if invoice.table_number:
        new_invoice['table_number'] = invoice.table_number
    if invoice.table_name:
        new_invoice['table_name'] = invoice.table_name
    
    result = database.invoices_collection.insert_one(new_invoice)
    new_invoice["_id"] = result.inserted_id

    # Auto-post invoice to customer ledger (non-blocking so billing never fails due to ledger issues)
    try:
        _create_invoice_party_ledger(current_user["id"], new_invoice)
    except Exception as exc:
        print(f"[WARN] Party ledger auto-post failed for invoice {inv_number}: {exc}")
    
    # Enrich response with admin store details
    invoice_dict = serialize_doc(new_invoice)
    invoice_dict['business_name'] = current_user.get('business_name')
    invoice_dict['business_address'] = current_user.get('business_address')
    invoice_dict['store_email'] = current_user.get('store_email')
    invoice_dict['store_phone'] = current_user.get('store_phone')
    invoice_dict['gstin'] = current_user.get('gstin')
    invoice_dict['fssai_license'] = current_user.get('fssai_license')
    invoice_dict['pan_number'] = current_user.get('pan_number')
    invoice_dict['bank_account'] = current_user.get('bank_account')
    invoice_dict['bank_name'] = current_user.get('bank_name')
    invoice_dict['account_name'] = current_user.get('account_name')
    invoice_dict['invoice_notes'] = current_user.get('invoice_notes')
    invoice_dict['invoice_terms'] = current_user.get('invoice_terms')
    
    return invoice_dict

