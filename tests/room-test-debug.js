const puppeteer = require('puppeteer');

async function debugRoomManagement() {
  console.log('🔍 Room Management Debug Test\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    // Log all console messages
    page.on('console', msg => {
      console.log(`Browser console [${msg.type()}]:`, msg.text());
    });
    
    // Navigate to app
    console.log('📱 Loading app...');
    await page.goto('https://family-fun-app.web.app', { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-1-initial.png' });
    console.log('📸 Screenshot 1: Initial page load');
    
    // Wait a bit for React to render
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check current URL
    console.log('📍 Current URL:', page.url());
    
    // Try to find Settings link
    const hasSettings = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.some(link => link.href && link.href.includes('/settings'));
    });
    
    console.log('⚙️ Settings link found:', hasSettings);
    
    if (hasSettings) {
      // Navigate to settings
      await page.evaluate(() => {
        const settingsLink = Array.from(document.querySelectorAll('a'))
          .find(link => link.href && link.href.includes('/settings'));
        if (settingsLink) settingsLink.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      await page.screenshot({ path: 'test-2-settings.png' });
      console.log('📸 Screenshot 2: Settings page');
      
      // Look for Admin Panel button
      const adminPanelExists = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(btn => 
          btn.textContent && btn.textContent.includes('Admin Panel')
        );
      });
      
      console.log('👨‍💼 Admin Panel button found:', adminPanelExists);
      
      if (adminPanelExists) {
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const adminBtn = buttons.find(btn => 
            btn.textContent && btn.textContent.includes('Admin Panel')
          );
          if (adminBtn) adminBtn.click();
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        await page.screenshot({ path: 'test-3-admin.png' });
        console.log('📸 Screenshot 3: Admin Panel');
        
        // Look for Room Management
        const roomMgmtExists = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements.some(el => 
            el.textContent && el.textContent.includes('Room & Space Management')
          );
        });
        
        console.log('🏠 Room Management found:', roomMgmtExists);
        
        if (roomMgmtExists) {
          await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('button, div[role="button"]'));
            const roomBtn = elements.find(el => 
              el.textContent && el.textContent.includes('Room & Space Management')
            );
            if (roomBtn) roomBtn.click();
          });
          
          await new Promise(resolve => setTimeout(resolve, 3000));
          await page.screenshot({ path: 'test-4-rooms.png' });
          console.log('📸 Screenshot 4: Room Management');
          
          // Log all input fields
          const inputs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('input'))
              .map(input => ({
                placeholder: input.placeholder,
                type: input.type,
                value: input.value
              }));
          });
          console.log('📝 Input fields found:', inputs);
          
          // Log all buttons
          const buttons = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button'))
              .map(btn => btn.textContent)
              .filter(text => text);
          });
          console.log('🔘 Buttons found:', buttons);
        }
      }
    } else {
      console.log('❌ Not logged in or no settings access');
      await page.screenshot({ path: 'test-login-required.png' });
    }
    
    console.log('\n✅ Debug test completed - check screenshots');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (browser) {
      const pages = await browser.pages();
      if (pages.length > 0) {
        await pages[0].screenshot({ path: 'test-error.png' });
      }
    }
  } finally {
    if (browser) {
      // Keep browser open for manual inspection
      console.log('\n⏸️  Browser will close in 10 seconds...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      await browser.close();
    }
  }
}

debugRoomManagement();