const puppeteer = require('puppeteer');

async function testGoogleSignIn() {
  console.log('🧪 Testing v2.93 - Firebase platform-specific imports fix...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--window-size=1200,800']
    });

    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      const text = msg.text();
      console.log(`📋 ${msg.type().toUpperCase()}: ${text}`);
    });

    // Capture errors
    page.on('pageerror', error => {
      console.error('❌ Page error:', error.message);
    });

    console.log('📱 Navigating to Family Compass v2.93...');
    await page.goto('https://family-fun-app.web.app', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for page to fully load
    await page.waitForSelector('text/Continue with Google', { timeout: 10000 });
    console.log('✅ Login page loaded');

    // Check for any initial errors
    const initialErrors = await page.evaluate(() => {
      return window.__errors || [];
    });
    if (initialErrors.length > 0) {
      console.error('Initial errors:', initialErrors);
    }

    // Click the Google sign-in button
    console.log('\n🖱️ Clicking Google sign-in button...');
    
    // Set up promise to wait for popup
    const popupPromise = new Promise((resolve) => {
      browser.on('targetcreated', async (target) => {
        if (target.type() === 'page') {
          const newPage = await target.page();
          const url = newPage.url();
          console.log('🪟 New window detected:', url);
          if (url.includes('accounts.google.com')) {
            console.log('✅ Google OAuth popup opened successfully!');
            resolve('success');
          }
        }
      });
      
      setTimeout(() => resolve('timeout'), 10000);
    });

    // Click and wait
    await page.click('text/Continue with Google');
    
    const result = await popupPromise;
    
    if (result === 'success') {
      console.log('\n✅ SUCCESS: Firebase auth is working correctly!');
      console.log('   Google OAuth popup opened as expected.');
      console.log('   The signInWithPopup function is now properly available.');
    } else {
      console.log('\n⚠️  No popup detected within 10 seconds');
      
      // Check for console errors
      const errors = await page.evaluate(() => {
        return window.__lastError || 'No error captured';
      });
      console.log('Last error:', errors);
    }

    // Wait a bit before closing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testGoogleSignIn().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});