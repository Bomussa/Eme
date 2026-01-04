
import asyncio
import os
from playwright.async_api import async_playwright, expect

# Config
URL = "https://mmc-mms.com"
ADMIN_USER = "admin"
ADMIN_PASS = "admin123" # OR BOMUSSA14490
SCREENSHOT_DIR = "evidence"

if not os.path.exists(SCREENSHOT_DIR):
    os.makedirs(SCREENSHOT_DIR)

async def run_admin(context):
    page = await context.new_page()
    try:
        print("[Admin] Logging in...")
        await page.goto(f"{URL}/admin", wait_until='networkidle')
        await page.fill('input[type="text"]', ADMIN_USER)
        await page.fill('input[type="password"]', ADMIN_PASS)
        await page.click('button:has-text("Login")')
        
        # Verify Dashboard
        await expect(page.locator('text=إجمالي المنتظرين')).to_be_visible(timeout=20000)
        print("[Admin] Dashboard Loaded ✅")
        await page.screenshot(path=f"{SCREENSHOT_DIR}/1_admin_dashboard.png")
        
        # Check PINs
        await page.click('text=إدارة الأرقام السرية') # Click PIN Management
        await page.wait_for_timeout(2000)
        print("[Admin] PIN Screen Loaded ✅")
        await page.screenshot(path=f"{SCREENSHOT_DIR}/2_admin_pins.png")
        
        # Keep alive to monitor queue
        return page
    except Exception as e:
        print(f"[Admin] FAILED: {e}")
        await page.screenshot(path=f"{SCREENSHOT_DIR}/admin_fail.png")
        return None

async def run_patient(context, pid, gender, name):
    page = await context.new_page()
    try:
        print(f"[{name}] Logging in ({pid})...")
        await page.goto(URL, wait_until='networkidle')
        
        # Login
        await page.fill('input[type="text"]', pid)
        if gender == 'male':
            try: await page.click('button:has-text("Male")')
            except: await page.click('button:has-text("ذكر")')
        else:
            try: await page.click('button:has-text("Female")')
            except: await page.click('button:has-text("أنثى")')
            
        try: await page.click('button:has-text("Confirm")')
        except: await page.click('button:has-text("تأكيد")')
        
        # Select Exam
        await page.wait_for_selector('text=Recruitment Exam', timeout=10000)
        await page.click('button:has-text("Recruitment Exam")')
        
        # Verify Route
        await expect(page.locator('text=Medical Route')).to_be_visible(timeout=15000)
        print(f"[{name}] Route Loaded ✅")
        await page.screenshot(path=f"{SCREENSHOT_DIR}/3_{name}_route.png")
        
        # Check Queue Number
        # Assuming there is an element showing queue number like "#1"
        try:
            q_num = await page.locator('text=#').first.text_content()
            print(f"[{name}] Queue Number: {q_num}")
        except:
            pass
            
        return page
    except Exception as e:
        print(f"[{name}] FAILED: {e}")
        await page.screenshot(path=f"{SCREENSHOT_DIR}/{name}_fail.png")
        return None

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch() # Headless
        
        # Contexts ensure separate sessions
        admin_ctx = await browser.new_context()
        p1_ctx = await browser.new_context()
        p2_ctx = await browser.new_context()
        p3_ctx = await browser.new_context()
        
        # 1. Start Admin
        admin_page = await run_admin(admin_ctx)
        
        if not admin_page:
            print("CRITICAL: Admin failed. Aborting.")
            return

        # 2. Start 3 Patients
        tasks = [
            run_patient(p1_ctx, "100001", "male", "Patient1"),
            run_patient(p2_ctx, "100002", "male", "Patient2"),
            run_patient(p3_ctx, "100003", "female", "Patient3")
        ]
        
        patients = await asyncio.gather(*tasks)
        
        # 3. Verify Admin sees queue update
        if admin_page:
            print("[Admin] Checking Queue Update...")
            await admin_page.click('text=إدارة الطوابير') # Queue Mgmt
            await admin_page.wait_for_timeout(3000) # Wait for poll
            await admin_page.screenshot(path=f"{SCREENSHOT_DIR}/4_admin_queue_updated.png")
            print("[Admin] Queue Snapshot Taken ✅")

        # 4. Reports Verification
        if admin_page:
            print("[Admin] Verifying Reports...")
            await admin_page.click('text=التقارير')
            await admin_page.wait_for_timeout(2000)
            await admin_page.screenshot(path=f"{SCREENSHOT_DIR}/5_admin_reports.png")
            print("[Admin] Reports Snapshot Taken ✅")

        await browser.close()
        print("\n--- TEST COMPLETE ---")
        print(f"Evidence saved in /{SCREENSHOT_DIR}")

if __name__ == "__main__":
    asyncio.run(main())
