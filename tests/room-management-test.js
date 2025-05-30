const puppeteer = require('puppeteer');

async function testRoomManagement() {
  console.log('🧪 Starting Room Management Test...\n');
  
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('FirebaseError')) {
        console.error('❌ Firebase Error:', msg.text());
      }
    });
    
    // Navigate to the app (use production URL)
    console.log('📱 Navigating to app...');
    await page.goto('https://family-fun-app.web.app', { waitUntil: 'networkidle2' });
    
    // Wait for app to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if we need to login
    const loginButton = await page.$('button[aria-label="Sign in with Google"]');
    if (loginButton) {
      console.log('🔐 Logging in...');
      await loginButton.click();
      
      // Handle Google auth popup
      const newPagePromise = new Promise(resolve => browser.once('targetcreated', target => resolve(target.page())));
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Wait for navigation after login
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    }
    
    // Navigate to settings/admin
    console.log('⚙️ Navigating to Settings...');
    const settingsTab = await page.$('a[href="/settings"]');
    if (settingsTab) {
      await settingsTab.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Click on Admin Panel
    console.log('👨‍💼 Opening Admin Panel...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const adminButton = buttons.find(btn => btn.textContent.includes('Admin Panel'));
      if (adminButton) adminButton.click();
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click on Room & Space Management
    console.log('🏠 Opening Room & Space Management...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const roomButton = buttons.find(btn => btn.textContent.includes('Room & Space Management'));
      if (roomButton) roomButton.click();
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test room creation
    console.log('🆕 Testing room creation...');
    
    // Fill in room name
    const roomNameInput = await page.$('input[placeholder="Room name"]');
    if (roomNameInput) {
      await roomNameInput.type('Test Room ' + Date.now());
    }
    
    // Click Create button
    const createButtonExists = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => btn.textContent === 'Create');
    });
    
    if (createButtonExists) {
      // Listen for errors
      let errorOccurred = false;
      page.once('console', msg => {
        if (msg.type() === 'error' && msg.text().includes('FirebaseError')) {
          errorOccurred = true;
        }
      });
      
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const createBtn = buttons.find(btn => btn.textContent === 'Create');
        if (createBtn) createBtn.click();
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if room was created successfully
      const successMessage = await page.evaluate(() => {
        const body = document.body.innerText;
        return body.includes('Test Room') || body.includes('successfully');
      });
      
      if (successMessage && !errorOccurred) {
        console.log('✅ Room created successfully!');
      } else {
        console.log('❌ Room creation failed - check for index errors');
        
        // Take screenshot for debugging
        await page.screenshot({ path: 'room-creation-error.png' });
        console.log('📸 Screenshot saved as room-creation-error.png');
      }
    } else {
      console.log('⚠️ Could not find Create button');
    }
    
    console.log('\n✨ Test completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
    
    // Take error screenshot
    if (browser) {
      const pages = await browser.pages();
      if (pages.length > 0) {
        await pages[0].screenshot({ path: 'test-error.png' });
        console.log('📸 Error screenshot saved as test-error.png');
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testRoomManagement();