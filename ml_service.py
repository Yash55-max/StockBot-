import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sqlalchemy.orm import Session
from models import Sale, Product
from datetime import datetime, timedelta

class MLService:
    def predict_demand(self, db: Session, product_id: int):
        # Fetch sales history for the last 30 days
        thirty_days_ago = datetime.now() - timedelta(days=30)
        sales = db.query(Sale).filter(
            Sale.product_id == product_id,
            Sale.timestamp >= thirty_days_ago
        ).all()
        
        if len(sales) < 5:
            return None # Not enough data
            
        df = pd.DataFrame([{
            "day": (s.timestamp - thirty_days_ago).days,
            "quantity": s.quantity
        } for s in sales])
        
        # Aggregate by day
        daily_sales = df.groupby("day")["quantity"].sum().reset_index()
        
        X = daily_sales[["day"]].values
        y = daily_sales["quantity"].values
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Predict for next 7 days
        next_week = np.array([[i] for i in range(31, 38)])
        predictions = model.predict(next_week)
        
        return float(np.sum(predictions))

    def detect_anomalies(self, db: Session, product_id: int):
        sales = db.query(Sale).filter(Sale.product_id == product_id).all()
        if len(sales) < 10:
            return False
            
        quantities = [s.quantity for s in sales]
        mean = np.mean(quantities)
        std = np.std(quantities)
        
        latest_sale = sales[-1].quantity
        z_score = (latest_sale - mean) / std if std > 0 else 0
        
        return abs(z_score) > 3 # Threshold for anomaly

ml_service = MLService()