const puppeteer = require('puppeteer');

async function testGoogleSignIn() {
  console.log('🧪 Testing v2.96 - Runtime Firebase auth loading...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--window-size=1400,800']
    });

    const page = await browser.newPage();
    
    // Capture all console messages
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push({ type: msg.type(), text });
      
      // Log important messages
      if (text.includes('firebaseAuthWeb') || 
          text.includes('signInWithPopup') || 
          text.includes('Available functions') ||
          text.includes('Error') ||
          text.includes('not a function')) {
        console.log(`📋 ${msg.type().toUpperCase()}: ${text}`);
      }
    });

    // Capture errors
    page.on('pageerror', error => {
      console.error('❌ Page error:', error.message);
    });

    console.log('📱 Navigating to Family Compass v2.96...');
    await page.goto('https://family-fun-app.web.app', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for page to load
    await page.waitForSelector('text/Continue with Google', { timeout: 10000 });
    console.log('✅ Login page loaded');

    // Check if firebaseAuthWeb loaded correctly
    const firebaseAuthWebLog = consoleLogs.find(log => log.text.includes('firebaseAuthWeb'));
    if (firebaseAuthWebLog) {
      console.log('\n📊 Firebase Auth Web Status:');
      console.log(firebaseAuthWebLog.text);
    }

    // Test Google sign-in
    console.log('\n🖱️ Testing Google sign-in...');
    
    const resultPromise = new Promise((resolve) => {
      let resolved = false;
      
      // Listen for popup
      browser.on('targetcreated', async (target) => {
        if (!resolved && target.type() === 'page') {
          const newPage = await target.page();
          const url = newPage.url();
          if (url.includes('accounts.google.com')) {
            resolved = true;
            console.log('✅ Google OAuth popup opened!');
            resolve('success');
          }
        }
      });
      
      // Listen for errors
      page.on('console', msg => {
        if (!resolved && msg.type() === 'error') {
          const text = msg.text();
          if (text.includes('not a function') || text.includes('signInWithPopup')) {
            resolved = true;
            resolve('error');
          }
        }
      });
      
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve('timeout');
        }
      }, 15000);
    });

    // Click the button
    await page.click('text/Continue with Google');
    
    const result = await resultPromise;
    
    console.log('\n📊 Test Results:');
    switch (result) {
      case 'success':
        console.log('✅ SUCCESS: Firebase auth is working!');
        console.log('   The runtime loading approach worked.');
        break;
      case 'error':
        console.log('❌ FAILED: Auth function error detected');
        // Show recent console errors
        const recentErrors = consoleLogs.filter(log => log.type === 'error').slice(-5);
        recentErrors.forEach(err => console.log('   Error:', err.text));
        break;
      case 'timeout':
        console.log('⚠️  TIMEOUT: No popup or error detected');
        break;
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testGoogleSignIn();