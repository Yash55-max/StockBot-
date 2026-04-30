from fastapi import FastAPI, Depends, HTTPException, Body
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from pydantic import BaseModel
from typing import Optional, List
import models, database, nlp_service, ml_service, chatbot_service
from database import engine, get_db
from datetime import datetime, timedelta
import os
from passlib.context import CryptContext

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# ===== Pydantic schemas =====
class ProductCreate(BaseModel):
    name: str
    category: str = "General"
    type: str = "individual"
    unit: str = "Pcs"
    volume: int = 250
    quantity: int = 0
    price: float = 20.0
    bottles_per_case: Optional[int] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    price: Optional[float] = None
    unit: Optional[str] = None

class VoiceCommand(BaseModel):
    command: str
    category: Optional[str] = None
    unit: Optional[str] = None

class OrderCreate(BaseModel):
    supplier: str
    items: str
    total: float

class ChatMessage(BaseModel):
    message: str

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str = "manager"

# ===== Seed sample data on first run =====
def seed_data():
    db = database.SessionLocal()
    count = db.query(models.Product).count()
    if count == 0:
        products = [
            # Drinks (Existing)
            models.Product(name="Sprite", category="Drinks", type="individual", unit="ml", volume=250, quantity=50, price=20.0),
            models.Product(name="Sprite", category="Drinks", type="individual", unit="ml", volume=750, quantity=30, price=45.0),
            models.Product(name="Sprite", category="Drinks", type="case", unit="ml", volume=250, quantity=5, price=480.0, bottles_per_case=24),
            models.Product(name="Coca Cola", category="Drinks", type="individual", unit="ml", volume=250, quantity=60, price=20.0),
            
            # Groceries
            models.Product(name="Basmati Rice", category="Groceries", type="individual", unit="Kg", volume=5, quantity=20, price=650.0),
            models.Product(name="Fortune Oil", category="Groceries", type="individual", unit="Litre", volume=1, quantity=40, price=180.0),
            models.Product(name="Aashirvaad Atta", category="Groceries", type="individual", unit="Kg", volume=10, quantity=15, price=420.0),
            models.Product(name="Maggi Noodles", category="Groceries", type="individual", unit="Gm", volume=280, quantity=100, price=45.0),
            
            # Snacks
            models.Product(name="Lay's Chips", category="Snacks", type="individual", unit="Gm", volume=50, quantity=150, price=20.0),
            models.Product(name="Good Day Biscuits", category="Snacks", type="individual", unit="Gm", volume=100, quantity=80, price=30.0),
            
            # Personal Care
            models.Product(name="Dove Soap", category="Personal Care", type="individual", unit="Gm", volume=125, quantity=50, price=65.0),
            models.Product(name="Colgate Toothpaste", category="Personal Care", type="individual", unit="Gm", volume=200, quantity=40, price=110.0),
            
            # Electronics
            models.Product(name="AA Batteries", category="Electronics", type="individual", unit="Pcs", volume=4, quantity=25, price=150.0),
        ]
        db.add_all(products)
        db.commit()

        # Seed some sales history for ML to work
        import random
        now = datetime.now()
        for p in products:
            db.refresh(p)
            for day_offset in range(30, 0, -1):
                num_sales = random.randint(0, 3)
                for _ in range(num_sales):
                    sale = models.Sale(
                        product_id=p.id,
                        quantity=random.randint(1, 5),
                        price_at_sale=p.price,
                        timestamp=now - timedelta(days=day_offset, hours=random.randint(0, 23))
                    )
                    db.add(sale)
        db.commit()
    
    # Seed users with hashed passwords
    user_count = db.query(models.User).count()
    if user_count == 0:
        users = [
            models.User(username="admin", password=get_password_hash("admin123"), role="admin", full_name="Super Admin"),
            models.User(username="yash", password=get_password_hash("pos123"), role="manager", full_name="Yash Verma")
        ]
        db.add_all(users)
        db.commit()
        
    db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    models.Base.metadata.create_all(bind=engine)
    seed_data()
    yield

app = FastAPI(title="StockBot AI API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def log_event(db: Session, username: str, action: str, details: str):
    try:
        log = models.AccessLog(username=username, action=action, details=details)
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Logging error: {e}")

# ===== AUTH ROUTES =====
@app.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == request.username).first()
    
    if not user or not verify_password(request.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    log_event(db, user.username, "Login", "User logged in successfully")
    return {
        "status": "success",
        "user": {
            "username": user.username,
            "role": user.role,
            "full_name": user.full_name
        }
    }

# ===== Static file routes =====
@app.get("/")
async def read_index():
    return FileResponse("index.html")

@app.get("/login_page")
async def read_login():
    return FileResponse("login.html")

@app.get("/register_page")
async def read_register():
    return FileResponse("register.html")

@app.post("/register")
def register(request: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(models.User).filter(models.User.username == request.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = models.User(
        username=request.username,
        password=get_password_hash(request.password),
        full_name=request.full_name,
        role=request.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    log_event(db, new_user.username, "Registration", f"New account created with role: {new_user.role}")
    return {
        "status": "success",
        "user": {
            "username": new_user.username,
            "role": new_user.role,
            "full_name": new_user.full_name
        }
    }

# ===== ADMIN MANAGEMENT ROUTES =====
@app.get("/admin/logs")
def get_logs(db: Session = Depends(get_db)):
    # In reality, check if requesting user is admin via token/session
    logs = db.query(models.AccessLog).order_by(models.AccessLog.timestamp.desc()).limit(100).all()
    return logs

@app.get("/admin/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    total_users = db.query(models.User).count()
    
    # Actions in last 24h
    one_day_ago = datetime.now() - timedelta(days=1)
    actions_count = db.query(models.AccessLog).filter(models.AccessLog.timestamp >= one_day_ago).count()
    
    # Critical actions (deletes, insufficient stock) in last 24h
    critical_actions = db.query(models.AccessLog).filter(
        models.AccessLog.timestamp >= one_day_ago,
        (models.AccessLog.action.ilike("%delete%")) | (models.AccessLog.action.ilike("%insufficient%"))
    ).count()
    
    # Top active user
    top_user = db.query(models.AccessLog.username, sqlfunc.count(models.AccessLog.id).label("count")) \
        .group_by(models.AccessLog.username) \
        .order_by(sqlfunc.count(models.AccessLog.id).desc()) \
        .first()
    
    return {
        "total_users": total_users,
        "actions_24h": actions_count,
        "critical_alerts": critical_actions,
        "most_active_user": top_user[0] if top_user else "N/A"
    }

@app.get("/admin/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users

@app.delete("/admin/users/{username}")
def delete_user(username: str, db: Session = Depends(get_db)):
    if username == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete default admin")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    log_event(db, "System", "User Deleted", f"Deleted user: {username}")
    return {"status": "success"}

@app.post("/admin/logs/custom")
def add_custom_log(action: str = Body(...), details: str = Body(...), username: str = Body(...), db: Session = Depends(get_db)):
    log_event(db, username, action, details)
    return {"status": "success"}

@app.get("/{filename}.html")
async def read_html(filename: str):
    file_path = f"{filename}.html"
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")


# ===== PRODUCT ENDPOINTS =====
@app.get("/products")
def get_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

@app.post("/products")
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    new_product = models.Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    log_event(db, "Admin", "Create Product", f"Added {new_product.name} ({new_product.type})")
    return new_product

@app.put("/products/{product_id}")
def update_product(product_id: int, update: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if update.name is not None:
        product.name = update.name
    if update.category is not None:
        product.category = update.category
    if update.quantity is not None:
        old_qty = product.quantity
        product.quantity = update.quantity
        log_detail = f"Updated {product.name}: {old_qty} ➔ {product.quantity} units"
    else:
        log_detail = f"Updated {product.name} (ID: {product.id})"

    if update.name is not None: product.name = update.name
    if update.category is not None: product.category = update.category
    if update.price is not None: product.price = update.price
    if update.unit is not None: product.unit = update.unit
    
    db.commit()
    db.refresh(product)
    log_event(db, "Admin", "Update Product", log_detail)
    return product

@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    log_event(db, "Admin", "Delete Product", f"Deleted {product.name} (ID: {product_id})")
    return {"status": "deleted", "id": product_id}


# ===== SALES ENDPOINTS =====n