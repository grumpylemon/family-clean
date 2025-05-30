const puppeteer = require('puppeteer');

async function testGoogleSignIn() {
  console.log('🧪 Starting comprehensive auth test for Family Compass web app...\n');
  
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
      if (text.includes('signInWithGoogle') || 
          text.includes('authService') || 
          text.includes('Firebase') ||
          text.includes('Error') ||
          text.includes('TypeError')) {
        console.log(`📋 Console: ${text}`);
      }
    });

    // Capture errors
    page.on('pageerror', error => {
      console.error('❌ Page error:', error.message);
    });

    console.log('📱 Navigating to Family Compass...');
    await page.goto('https://family-fun-app.web.app', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Check if we're on the login page
    const loginButton = await page.$('text/Continue with Google');
    if (!loginButton) {
      console.log('❌ Google sign-in button not found');
      return;
    }

    console.log('✅ Found Google sign-in button');

    // Test 1: Check if functions are defined
    console.log('\n📊 Test 1: Checking if auth functions are defined...');
    const functionCheck = await page.evaluate(() => {
      // Try to access window objects to see what's available
      const results = {
        hasFirebase: typeof window.firebase !== 'undefined',
        hasAuth: false,
        hasSignInWithPopup: false,
        authFunctions: []
      };

      // Check for Firebase auth
      if (window.firebase && window.firebase.auth) {
        results.hasAuth = true;
        const auth = window.firebase.auth();
        if (auth.signInWithPopup) {
          results.hasSignInWithPopup = true;
        }
      }

      // Log available functions in console
      console.log('Window Firebase:', window.firebase);
      
      return results;
    });
    
    console.log('Function availability:', functionCheck);

    // Test 2: Click the Google sign-in button
    console.log('\n📊 Test 2: Testing Google sign-in click...');
    
    // Set up promise to wait for popup or error
    const popupPromise = new Promise((resolve) => {
      browser.on('targetcreated', async (target) => {
        if (target.type() === 'page') {
          const newPage = await target.page();
          const url = newPage.url();
          console.log('🪟 Popup detected:', url);
          if (url.includes('accounts.google.com')) {
            console.log('✅ Google OAuth popup opened successfully!');
            resolve('popup');
          }
        }
      });
      
      // Also resolve on timeout
      setTimeout(() => resolve('timeout'), 5000);
    });

    // Click the button
    console.log('🖱️ Clicking Google sign-in button...');
    await loginButton.click();

    // Wait for popup or timeout
    const result = await popupPromise;
    
    if (result === 'popup') {
      console.log('\n✅ SUCCESS: Google OAuth flow initiated correctly!');
      console.log('   Firebase auth is working properly in production.');
    } else {
      console.log('\n⚠️  No popup detected within 5 seconds');
      
      // Check for errors in console
      const errors = await page.evaluate(() => {
        return window.__lastError || null;
      });
      
      if (errors) {
        console.log('❌ Errors found:', errors);
      }
    }

    // Test 3: Check network requests
    console.log('\n📊 Test 3: Checking Firebase configuration...');
    const firebaseConfig = await page.evaluate(() => {
      // Try to find Firebase config
      if (window.__FIREBASE_CONFIG__) {
        return window.__FIREBASE_CONFIG__;
      }
      return null;
    });
    
    if (firebaseConfig) {
      console.log('✅ Firebase is configured with project:', firebaseConfig.projectId);
    }

    // Keep browser open for manual inspection
    console.log('\n🔍 Browser will remain open for manual inspection...');
    console.log('   Close the browser window when done.');
    
    await new Promise(() => {}); // Keep script running
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testGoogleSignIn().catch(console.error);