from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, default="General")
    type = Column(String)  # 'individual' or 'case'
    unit = Column(String, default="Pcs") # Pcs, Kg, Litre, etc.
    volume = Column(Integer) # volume or weight value
    quantity = Column(Integer, default=0)
    price = Column(Float)
    bottles_per_case = Column(Integer, nullable=True)

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    price_at_sale = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)  # In production, use hashed passwords!
    role = Column(String)  # 'admin' or 'manager'
    full_name = Column(String)
class AccessLog(Base):
    __tablename__ = "access_logs"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String)
    action = Column(String)
    details = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())