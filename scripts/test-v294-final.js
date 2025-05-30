const puppeteer = require('puppeteer');

async function testGoogleSignIn() {
  console.log('🧪 Testing v2.94 - Static imports Firebase auth fix...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--window-size=1200,800']
    });

    const page = await browser.newPage();
    
    // Capture all console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('signInWithPopup') || 
          text.includes('authService') || 
          text.includes('Firebase') ||
          text.includes('Error') ||
          text.includes('static imports')) {
        console.log(`📋 ${msg.type().toUpperCase()}: ${text}`);
      }
    });

    // Capture errors
    page.on('pageerror', error => {
      console.error('❌ Page error:', error.message);
    });

    console.log('📱 Navigating to Family Compass v2.94...');
    await page.goto('https://family-fun-app.web.app', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for page to fully load
    await page.waitForSelector('text/Continue with Google', { timeout: 10000 });
    console.log('✅ Login page loaded');

    // Test clicking the Google sign-in button
    console.log('\n🖱️ Testing Google sign-in functionality...');
    
    // Set up promise to wait for popup or error
    const resultPromise = new Promise((resolve) => {
      let errorCaptured = false;
      
      // Listen for popup
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
      
      // Listen for console errors
      page.on('console', msg => {
        if (msg.type() === 'error' && !errorCaptured) {
          const text = msg.text();
          if (text.includes('signInWithPopup') || text.includes('not a function')) {
            errorCaptured = true;
            console.error('❌ Auth Error:', text);
            resolve('error');
          }
        }
      });
      
      // Timeout after 15 seconds
      setTimeout(() => resolve('timeout'), 15000);
    });

    // Click the button
    await page.click('text/Continue with Google');
    
    const result = await resultPromise;
    
    console.log('\n📊 Test Results:');
    if (result === 'success') {
      console.log('✅ SUCCESS: Firebase auth is working correctly!');
      console.log('   - signInWithPopup function is properly imported');
      console.log('   - Google OAuth popup opened as expected');
      console.log('   - Static imports are working in production');
    } else if (result === 'error') {
      console.log('❌ FAILED: Firebase auth function error detected');
      console.log('   - Check console output above for details');
    } else {
      console.log('⚠️  TIMEOUT: No popup or error detected within 15 seconds');
    }

    // Keep browser open for 5 seconds to observe
    await new Promise(resolve => setTimeout(resolve, 5000));
    
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