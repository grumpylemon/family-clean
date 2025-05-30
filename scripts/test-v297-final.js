const puppeteer = require('puppeteer');

async function testGoogleSignIn() {
  console.log('🧪 Testing v2.97 - Final Firebase auth fix with static imports...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null,
      args: ['--window-size=1400,800']
    });

    const page = await browser.newPage();
    
    // Capture console messages
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push({ type: msg.type(), text });
      
      if (text.includes('firebaseAuthWeb') || 
          text.includes('signInWithPopup') || 
          text.includes('Firebase Auth') ||
          text.includes('not a function') ||
          text.includes('ERROR')) {
        console.log(`📋 ${msg.type().toUpperCase()}: ${text}`);
      }
    });

    // Capture errors
    page.on('pageerror', error => {
      console.error('❌ Page error:', error.message);
    });

    console.log('📱 Loading Family Compass v2.97...');
    await page.goto('https://family-fun-app.web.app', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Check for login button
    try {
      await page.waitForSelector('text/Continue with Google', { timeout: 10000 });
      console.log('✅ Login page loaded successfully');
    } catch (e) {
      console.log('❌ Login page failed to load properly');
      const errorLogs = logs.filter(l => l.type === 'error').slice(-5);
      errorLogs.forEach(log => console.log('   Error:', log.text));
      return;
    }

    // Test Google sign-in
    console.log('\n🧪 Testing Google sign-in functionality...');
    
    const resultPromise = new Promise((resolve) => {
      let resolved = false;
      
      // Listen for popup
      const targetCreatedHandler = async (target) => {
        if (!resolved && target.type() === 'page') {
          const newPage = await target.page();
          const url = newPage.url();
          if (url.includes('accounts.google.com')) {
            resolved = true;
            console.log('✅ Google OAuth popup detected!');
            resolve('success');
            browser.off('targetcreated', targetCreatedHandler);
          }
        }
      };
      browser.on('targetcreated', targetCreatedHandler);
      
      // Listen for errors
      const errorHandler = (msg) => {
        if (!resolved && msg.type() === 'error') {
          const text = msg.text();
          if (text.includes('not a function')) {
            resolved = true;
            console.error('❌ Function error:', text);
            resolve('error');
            page.off('console', errorHandler);
          }
        }
      };
      page.on('console', errorHandler);
      
      // Timeout
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve('timeout');
        }
      }, 10000);
    });

    // Click the button
    console.log('🖱️ Clicking "Continue with Google" button...');
    await page.click('text/Continue with Google');
    
    const result = await resultPromise;
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL TEST RESULTS:');
    console.log('='.repeat(50));
    
    switch (result) {
      case 'success':
        console.log('✅ SUCCESS! Firebase Auth is working correctly!');
        console.log('   - signInWithPopup function loaded properly');
        console.log('   - Google OAuth popup opened');
        console.log('   - Web bundling is now correct');
        break;
      case 'error':
        console.log('❌ FAILED! Firebase Auth still has issues');
        const errors = logs.filter(l => l.type === 'error').slice(-3);
        errors.forEach(err => console.log('   Recent error:', err.text));
        break;
      case 'timeout':
        console.log('⚠️  TIMEOUT - No popup or error detected');
        console.log('   This might mean the click didn\'t work or Firebase is misconfigured');
        break;
    }
    
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testGoogleSignIn().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});