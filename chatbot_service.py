from google import genai
from google.genai import types
from sqlalchemy.orm import Session
from models import Product, Sale
from datetime import datetime, timedelta
import json
import os
import ml_service
import nlp_service
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

class ChatbotService:
    def __init__(self):
        self.client = None
        self.chat_session = None
        # Auto-configure if key is set in .env
        if GEMINI_API_KEY:
            self.configure(GEMINI_API_KEY)
    
    def configure(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.chat_session = self.client.chats.create(
            model="gemini-2.0-flash",
            config=types.GenerateContentConfig(
                system_instruction=self._get_system_prompt()
            )
        )

    def _get_system_prompt(self):
        return """You are StockBot AI — an intelligent inventory management assistant for a general retail store.

Your capabilities:
1. **Stock Management**: Add or sell stock using commands like "add 10 bottles of Sprite", "restock 5kg Basmati Rice", or "sell 2 packs of AAA Batteries"
2. **Demand Forecasting**: Predict next week's demand for any product across categories (Drinks, Groceries, Electronics, etc.)
3. **Anomaly Detection**: Detect unusual sales spikes
4. **Restock Suggestions**: Recommend which products need restocking
5. **Inventory Queries**: Answer questions about current stock levels, categories, units, and low-stock items
6. **Sales Analysis**: Provide insights on sales trends and revenue across different product types

IMPORTANT RULES:
- When the user asks to add/sell stock, respond with a JSON action block including category and unit if known: {"action": "stock_command", "command": "add 10 bottles of Sprite", "category": "Drinks", "unit": "ml"} or {"action": "stock_command", "command": "add 5kg Basmati Rice", "category": "Groceries", "unit": "Kg"}
- When the user asks for predictions/forecasts, respond with: {"action": "predict_demand", "product_name": "Sprite"}
- When the user asks for anomaly detection, respond with: {"action": "detect_anomalies"}
- When the user asks for restock suggestions, respond with: {"action": "restock_suggestions"}
- When the user asks about inventory/stock levels, respond with: {"action": "get_inventory"}
- When the user asks about sales, respond with: {"action": "get_sales"}
- For general questions, just respond naturally with helpful text.

ALWAYS wrap action JSON in ```json code blocks so the frontend can parse them.
After the JSON block, add a brief human-readable explanation.

Keep responses concise, helpful, and use emojis for a friendly tone. Format with markdown.
When showing data, use tables or bullet points for clarity.
"""

    def _get_inventory_context(self, db: Session) -> str:
        products = db.query(Product).all()
        lines = ["Current Inventory:"]
        for p in products:
            status = "🔴 OUT" if p.quantity == 0 else ("🟡 LOW" if p.quantity < 10 else "🟢 OK")
            unit = p.unit if p.unit else "ml"
            category = p.category if p.category else "General"
            lines.append(f"- [{category}] {p.name} {p.volume}{unit} ({p.type}): {p.quantity} units @ ₹{p.price} [{status}]")
        return "\n".join(lines)

    def _get_sales_context(self, db: Session) -> str:
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = today - timedelta(days=7)
        recent_sales = db.query(Sale).filter(Sale.timestamp >= week_ago).all()
        total_revenue = sum(s.quantity * s.price_at_sale for s in recent_sales)
        return f"Last 7 days: {len(recent_sales)} sales, ₹{total_revenue:.2f} revenue"

    async def chat(self, user_message: str, db: Session) -> dict:
        if not self.client:
            return {
                "reply": "⚠️ Chatbot is not configured. Please set your Gemini API key in the settings.",
                "actions": []
            }

        # Build context
        inventory_ctx = self._get_inventory_context(db)
        sales_ctx = self._get_sales_context(db)
        context = f"\n[LIVE DATA]\n{inventory_ctx}\n{sales_ctx}\n\nUser says: {user_message}"

        try:
            response = self.chat_session.send_message(context)
            reply_text = response.text

            # Parse any action blocks
            actions = self._parse_actions(reply_text, db)

            return {
                "reply": reply_text,
                "actions": actions
            }
        except Exception as e:
            return {
                "reply": f"❌ Error communicating with AI: {str(e)}",
                "actions": []
            }

    def _parse_actions(self, text: str, db: Session) -> list:
        actions = []
        import re
        json_blocks = re.findall(r'```json\s*(\{.*?\})\s*```', text, re.DOTALL)
        for block in json_blocks:
            try:
                action_data = json.loads(block)
                action_type = action_data.get("action")

                if action_type == "stock_command":
                    from main import process_voice, VoiceCommand
                    cmd = action_data.get("command", "")
                    cat = action_data.get("category")
                    unit = action_data.get("unit")
                    
                    try:
                        # Execute the command
                        voice_body = VoiceCommand(command=cmd, category=cat, unit=unit)
                        res = process_voice(voice_body, db)
                        
                        actions.append({
                            "type": "stock_command",
                            "parsed": res["parsed"],
                            "command": cmd,
                            "category": cat,
                            "unit": unit,
                            "message": res["message"]
                        })
                    except Exception as e:
                        print(f"Chatbot execution error: {e}")
                        actions.append({
                            "type": "error",
                            "message": str(e)
                        })

                elif action_type == "predict_demand":
                    product_name = action_data.get("product_name", "")
                    product = db.query(Product).filter(
                        Product.name.ilike(f"%{product_name}%")
                    ).first()
                    if product:
                        prediction = ml_service.ml_service.predict_demand(db, product.id)
                        actions.append({
                            "type": "prediction",
                            "product": product.name,
                            "volume": product.volume,
                            "current_stock": product.quantity,
                            "predicted_demand": round(prediction, 1) if prediction else None
                        })

                elif action_type == "detect_anomalies":
                    products = db.query(Product).all()
                    anomalies = []
                    for p in products:
                        try:
                            if ml_service.ml_service.detect_anomalies(db, p.id):
                                anomalies.append(f"{p.name} {p.volume}ml")
                        except:
                            pass
                    actions.append({
                        "type": "anomalies",
                        "detected": anomalies
                    })

                elif action_type == "restock_suggestions":
                    products = db.query(Product).all()
                    suggestions = []
                    for p in products:
                        try:
                            pred = ml_service.ml_service.predict_demand(db, p.id)
                            if pred and p.quantity < pred:
                                qty = int(pred - p.quantity + 10)
                                suggestions.append({
                                    "product": f"[{p.category}] {p.name} {p.volume}{p.unit if p.unit else 'ml'}",
                                    "current": p.quantity,
                                    "predicted": round(pred, 1),
                                    "restock": qty
                                })
                        except:
                            pass
                    actions.append({
                        "type": "restock",
                        "suggestions": suggestions
                    })

                elif action_type == "get_inventory":
                    actions.append({"type": "show_inventory"})

                elif action_type == "get_sales":
                    actions.append({"type": "show_sales"})

            except json.JSONDecodeError:
                pass

        return actions

chatbot_service = ChatbotService()