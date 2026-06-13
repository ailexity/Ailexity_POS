from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    role: str = "admin" # Default changed to admin as cashier is removed
    business_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    business_address: Optional[str] = None
    business_type: Optional[str] = None
    tax_id: Optional[str] = None
    tax_rate: Optional[float] = 0.0
    # GST & Business Registration
    gstin: Optional[str] = None
    fssai_license: Optional[str] = None
    pan_number: Optional[str] = None
    # Invoice/Store Details
    store_email: Optional[str] = None
    store_phone: Optional[str] = None
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None
    account_name: Optional[str] = None
    invoice_notes: Optional[str] = None
    invoice_terms: Optional[str] = None
    whatsapp_message: Optional[str] = None
    monthly_target: Optional[float] = None  # Monthly revenue target for dashboard
    active_window_start: Optional[str] = None  # Login access start date (YYYY-MM-DD)
    active_window_end: Optional[str] = None  # Login access end date (YYYY-MM-DD)
    enable_multi_device_sync: Optional[bool] = False  # Enable multi-device cart sync
    enable_order_management: Optional[bool] = False  # Enable order management feature

class UserCreate(UserBase):
    password: str
    subscription_status: str = "active"

class PasswordVerification(BaseModel):
    password: str

class UserUpdateProfile(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None # New password
    current_password: Optional[str] = None
    business_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    business_address: Optional[str] = None
    business_type: Optional[str] = None
    tax_id: Optional[str] = None
    tax_rate: Optional[float] = None
    # GST & Business Registration
    gstin: Optional[str] = None
    fssai_license: Optional[str] = None
    pan_number: Optional[str] = None
    # Invoice/Store Details
    store_email: Optional[str] = None
    store_phone: Optional[str] = None
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None
    account_name: Optional[str] = None
    invoice_notes: Optional[str] = None
    invoice_terms: Optional[str] = None
    whatsapp_message: Optional[str] = None
    monthly_target: Optional[float] = None  # Monthly revenue target for dashboard
    active_window_start: Optional[str] = None  # Login access start date (YYYY-MM-DD)
    active_window_end: Optional[str] = None  # Login access end date (YYYY-MM-DD)

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: str  # MongoDB ObjectId as string
    is_active: bool
    subscription_status: str = "active"
    active_window_start: Optional[str] = None  # Login access start date
    active_window_end: Optional[str] = None  # Login access end date
    enable_multi_device_sync: Optional[bool] = False  # Enable multi-device cart sync
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    class Config:
        from_attributes = True

# --- Item Schemas ---
class ItemBase(BaseModel):
    name: str
    category: str
    price: float
    tax_rate: float = 0.0
    hsn_code: Optional[str] = None  # HSN/SAC code for GST
    stock_quantity: int = 0
    limit_stock: bool = True
    manufacturing_cost: float = 0.0  # Cost to manufacture/purchase the item

class ItemCreate(ItemBase):
    pass

class ItemUpdate(ItemBase):
    pass

class ItemResponse(ItemBase):
    id: str  # MongoDB ObjectId as string
    admin_id: str  # MongoDB ObjectId as string
    class Config:
        from_attributes = True

# --- Invoice Schemas ---
class InvoiceItemCreate(BaseModel):
    item_id: Optional[str] = None  # MongoDB ObjectId as string
    item_name: str
    quantity: int
    unit_price: float
    tax_amount: float

class InvoiceCreate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    customer_gstin: Optional[str] = None
    order_source: Optional[str] = None
    order_type: Optional[str] = None
    status: Optional[str] = None
    external_order_id: Optional[str] = None
    payment_mode: str = "Cash"
    transaction_id: Optional[str] = None
    payment_status: str = "Paid"
    table_number: Optional[str] = None
    table_name: Optional[str] = None
    created_at: Optional[datetime] = None  # Allow frontend to send device timestamp
    items: List[InvoiceItemCreate]

class InvoiceItemResponse(BaseModel):
    """Matches stored invoice item subdocuments (item_id, not id)."""
    item_id: Optional[str] = None
    item_name: str
    quantity: int
    unit_price: float
    tax_amount: float
    total_price: float

    class Config:
        from_attributes = True

class InvoiceResponse(BaseModel):
    id: str  # MongoDB ObjectId as string
    admin_id: str  # MongoDB ObjectId as string
    invoice_number: str
    created_at: datetime
    customer_name: Optional[str]
    customer_phone: Optional[str]
    customer_address: Optional[str] = None
    customer_gstin: Optional[str] = None
    order_source: Optional[str] = None
    order_type: Optional[str] = None
    status: Optional[str] = None
    external_order_id: Optional[str] = None
    total_amount: float
    payment_mode: str
    transaction_id: Optional[str] = None
    payment_status: str = "Paid"
    table_number: Optional[str] = None
    table_name: Optional[str] = None
    # Business details
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    store_email: Optional[str] = None
    store_phone: Optional[str] = None
    gstin: Optional[str] = None
    fssai_license: Optional[str] = None
    pan_number: Optional[str] = None
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None
    account_name: Optional[str] = None
    invoice_notes: Optional[str] = None
    invoice_terms: Optional[str] = None
    items: List[InvoiceItemResponse]
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- System Settings Schemas ---
class SystemPasswordChange(BaseModel):
    current_password: str
    new_password: str

# --- Table Schemas ---
class TableBase(BaseModel):
    table_number: str
    table_name: Optional[str] = None
    capacity: int = 4
    is_active: bool = True

class TableCreate(TableBase):
    pass

class TableUpdate(BaseModel):
    table_number: Optional[str] = None
    table_name: Optional[str] = None
    capacity: Optional[int] = None
    is_active: Optional[bool] = None

class TableResponse(TableBase):
    id: str
    admin_id: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# --- Table Cart Schemas (Multi-Device Sync) ---
class CartItemSchema(BaseModel):
    id: str
    name: str
    price: float
    qty: int
    category: Optional[str] = None
    tax_rate: Optional[float] = 0.0

class TableCartUpdate(BaseModel):
    items: List[CartItemSchema]

class TableCartResponse(BaseModel):
    id: str
    admin_id: str
    table_id: str
    items: List[CartItemSchema]
    updated_at: datetime
    class Config:
        from_attributes = True


# --- Raw Stock Schemas ---
class RawStockDetail(BaseModel):
    id: Optional[str] = None
    vendor: Optional[str] = ""
    batchNo: Optional[str] = ""
    unitCost: Optional[float] = 0.0
    expiryDate: Optional[str] = ""
    note: Optional[str] = ""


class RawStockTransactionCreate(BaseModel):
    type: str
    quantity: float
    unitPrice: float
    reference: Optional[str] = ""
    note: Optional[str] = ""
    usedAt: Optional[str] = ""
    usedFor: Optional[str] = ""


class RawStockTransactionResponse(RawStockTransactionCreate):
    id: str
    totalPrice: float
    created_at: datetime


class RawStockItemBase(BaseModel):
    name: str
    unit: str
    reorderLevel: float = 0
    currentStock: float = 0
    details: List[RawStockDetail] = []


class RawStockItemCreate(RawStockItemBase):
    pass


class RawStockItemUpdate(RawStockItemBase):
    pass


class RawStockItemResponse(RawStockItemBase):
    id: str
    admin_id: str
    transactions: List[RawStockTransactionResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RawStockInsightsResponse(BaseModel):
    monthBuyValue: float
    monthUsageValue: float
    monthNetCost: float
    todayBuyValue: float
    todayUsageValue: float


# --- Party & Ledger Schemas (Retail ERP) ---
class PartyBase(BaseModel):
    party_name: str
    party_type: str = "customer"  # customer | supplier | both
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None
    credit_limit: Optional[float] = 0.0
    payment_terms_days: Optional[int] = 0
    opening_balance: Optional[float] = 0.0
    notes: Optional[str] = None
    is_active: Optional[bool] = True


class PartyCreate(PartyBase):
    pass


class PartyUpdate(BaseModel):
    party_name: Optional[str] = None
    party_type: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None
    credit_limit: Optional[float] = None
    payment_terms_days: Optional[int] = None
    opening_balance: Optional[float] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class PartyResponse(PartyBase):
    id: str
    admin_id: str
    current_balance: float
    total_receivable: float
    total_payable: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PartyLedgerCreate(BaseModel):
    entry_type: str  # sale | purchase | adjustment
    amount: float
    paid_amount: Optional[float] = 0.0
    reference_no: Optional[str] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None


class PartyLedgerResponse(BaseModel):
    id: str
    admin_id: str
    party_id: str
    entry_type: str
    amount: float
    paid_amount: float
    due_amount: float
    status: str
    direction: str
    reference_no: Optional[str] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PartyPaymentAllocation(BaseModel):
    ledger_entry_id: str
    amount: float


class PartyPaymentCreate(BaseModel):
    payment_type: str  # payment_in | payment_out
    amount: float
    payment_mode: Optional[str] = "Cash"
    reference_no: Optional[str] = None
    notes: Optional[str] = None
    payment_date: Optional[datetime] = None
    allocations: Optional[List[PartyPaymentAllocation]] = None


class PartyPaymentResponse(BaseModel):
    id: str
    admin_id: str
    party_id: str
    payment_type: str
    amount: float
    payment_mode: str
    reference_no: Optional[str] = None
    notes: Optional[str] = None
    allocations: List[PartyPaymentAllocation] = []
    payment_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class PartySummaryResponse(BaseModel):
    party_id: str
    party_name: str
    current_balance: float
    total_receivable: float
    total_payable: float
    overdue_receivable: float
    overdue_payable: float
    open_entries: int
    last_transaction_at: Optional[datetime] = None


class PartyDueAlertResponse(BaseModel):
    party_id: str
    party_name: str
    ledger_entry_id: str
    entry_type: str
    due_amount: float
    due_date: datetime
    days_overdue: int

