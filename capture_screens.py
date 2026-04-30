import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    print("Starting browser...")
    os.makedirs("screenshots", exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        
        print("Logging in...")
        # 1. Login
        await page.goto('http://localhost:8000/login_page')
        # Wait for username field
        await page.wait_for_selector('#username')
        await page.fill('#username', 'admin')
        await page.fill('#password', 'admin123')
        await page.click('#loginBtn')
        
        print("Waiting for dashboard...")
        # Wait for dashboard to load (checking for inventory table or stat cards)
        await page.wait_for_selector('.main')
        await asyncio.sleep(3)  # Let charts and data load
        
        print("Capturing 1_dashboard_main.png...")
        # Capture 1_dashboard_main.png
        await page.screenshot(path='screenshots/1_dashboard_main.png', full_page=True)
        
        print("Opening Chatbot...")
        # Open Chatbot
        await page.click('#chatFab')
        await page.wait_for_selector('#chatPanel.open')
        await asyncio.sleep(1)
        
        print("Sending NLP command...")
        # NLP Command
        await page.fill('#chatInput', 'add 10 bottles of Sprite')
        await page.click('#chatSendBtn')
        await asyncio.sleep(6)  # Wait for NLP response and DB update
        
        print("Capturing 2_nlp_db_update.png...")
        # Capture NLP & DB update
        await page.screenshot(path='screenshots/2_nlp_db_update.png')
        
        print("Sending ML prediction command...")
        # ML Prediction
        await page.fill('#chatInput', 'predict demand for Sprite')
        await page.click('#chatSendBtn')
        await asyncio.sleep(6)
        
        print("Capturing 3_ml_prediction.png...")
        await page.screenshot(path='screenshots/3_ml_prediction.png')
        
        print("Sending anomaly detection command...")
        # Anomaly Detection
        await page.fill('#chatInput', 'detect anomalies')
        await page.click('#chatSendBtn')
        await asyncio.sleep(6)
        
        print("Capturing 4_anomaly_detection.png...")
        await page.screenshot(path='screenshots/4_anomaly_detection.png')
        
        print("Sending restock suggestions command...")
        # Restock Suggestions
        await page.fill('#chatInput', 'restock suggestions')
        await page.click('#chatSendBtn')
        await asyncio.sleep(6)
        
        print("Capturing 5_restock_suggestions.png...")
        await page.screenshot(path='screenshots/5_restock_suggestions.png')
        
        print("Navigating to Admin Panel...")
        # Admin Panel Audit Logs
        await page.goto('http://localhost:8000/admin.html')
        await page.wait_for_selector('#logsTableBody tr', timeout=10000)
        await asyncio.sleep(2)
        
        print("Capturing 6_admin_audit_logs.png...")
        await page.screenshot(path='screenshots/6_admin_audit_logs.png', full_page=True)
        
        print("Closing browser...")
        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())