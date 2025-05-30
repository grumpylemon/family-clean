const puppeteer = require('puppeteer');

async function testGoogleSignIn() {
  console.log('🧪 Testing v2.98 - Dynamic Firebase auth loading...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--window-size=1400,800']
    });

    const page = await browser.newPage();
    
    // Capture all console messages
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push({ type: msg.type(), text });
      console.log(`📋 ${msg.type().toUpperCase()}: ${text}`);
    });

    // Capture errors
    page.on('pageerror', error => {
      console.error('❌ Page error:', error.message);
    });

    console.log('📱 Loading Family Compass v2.98...');
    await page.goto('https://family-fun-app.web.app', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for page to load
    await page.waitForSelector('text/Continue with Google', { timeout: 10000 });
    console.log('✅ Login page loaded');

    // Wait a bit for dynamic imports to complete
    console.log('⏳ Waiting for Firebase auth to load dynamically...');
    await page.waitForTimeout(2000);

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
      
      // Listen for specific errors
      page.on('console', msg => {
        if (!resolved && msg.type() === 'error') {
          const text = msg.text();
          if (text.includes('not a function') || text.includes('not properly loaded')) {
            resolved = true;
            resolve('error');
          }
        }
      });
      
      // Timeout
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
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS:');
    console.log('='.repeat(50));
    
    switch (result) {
      case 'success':
        console.log('✅ SUCCESS! Firebase Auth is working!');
        console.log('   Dynamic loading approach successful.');
        break;
      case 'error':
        console.log('❌ FAILED! Auth function error detected');
        break;
      case 'timeout':
        console.log('⚠️  TIMEOUT - Check console for errors');
        break;
    }
    
    console.log('='.repeat(50));
    
    // Keep browser open for inspection
    console.log('\n🔍 Browser will remain open for inspection...');
    console.log('   Check the console for any errors.');
    console.log('   Close the browser window when done.');
    
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testGoogleSignIn();