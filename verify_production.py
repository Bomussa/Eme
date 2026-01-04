
import asyncio
from playwright.async_api import async_playwright

async def verify_admin(page):
    print('--- VERIFYING ADMIN ---')
    await page.goto('https://mmc-mms.com/admin', wait_until='networkidle', timeout=30000)
    
    # Login
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button:has-text("Login")')
    
    # Verify Dashboard
    try:
        await page.wait_for_selector('text=إجمالي المنتظرين', timeout=15000)
        print('✅ Admin Dashboard Loaded')
        return True
    except:
        print('❌ Admin Dashboard Failed')
        return False

async def verify_patient(page, patient_id, gender):
    print(f'--- VERIFYING PATIENT {patient_id} ({gender}) ---')
    await page.goto('https://mmc-mms.com', wait_until='networkidle', timeout=30000)
    
    # Login
    await page.fill('input[type="text"]', patient_id)
    if gender == 'male':
        try: await page.click('button:has-text("Male")')
        except: await page.click('button:has-text("ذكر")')
    else:
        try: await page.click('button:has-text("Female")')
        except: await page.click('button:has-text("أنثى")')
        
    try: await page.click('button:has-text("Confirm")')
    except: await page.click('button:has-text("تأكيد")')
    
    # Exam Selection
    await page.wait_for_selector('text=Recruitment Exam', timeout=10000)
    await page.click('button:has-text("Recruitment Exam")')
    
    # Verify Dashboard
    try:
        await page.wait_for_selector('text=Medical Route', timeout=15000)
        print(f'✅ Patient {patient_id} Flow Success')
        return True
    except:
        print(f'❌ Patient {patient_id} Flow Failed')
        return False

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        print('STARTING PRODUCTION VERIFICATION')
        
        admin_ok = await verify_admin(page)
        patient_ok = await verify_patient(page, '998877', 'male')
        
        if admin_ok and patient_ok:
            print('\n🎉 ALL TESTS PASSED on mmc-mms.com')
        else:
            print('\n⚠️ SOME TESTS FAILED')
            
        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())
