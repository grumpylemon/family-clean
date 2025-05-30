const puppeteer = require('puppeteer');

async function testFirebaseFunctions() {
  console.log('🧪 Testing Firebase Auth function availability in v2.97...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--window-size=1400,800']
    });

    const page = await browser.newPage();
    
    // Enable console
    page.on('console', msg => {
      console.log(`📋 ${msg.type().toUpperCase()}: ${msg.text()}`);
    });

    console.log('📱 Loading Family Compass...');
    await page.goto('https://family-fun-app.web.app', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for page to load
    await page.waitForSelector('text/Continue with Google', { timeout: 10000 });
    console.log('✅ Page loaded\n');

    // Test 1: Check if Firebase is available
    console.log('📊 Test 1: Checking Firebase availability...');
    const firebaseCheck = await page.evaluate(() => {
      const results = {
        hasFirebase: false,
        hasAuth: false,
        authFunctions: []
      };

      // Check window.firebase
      if (typeof window !== 'undefined' && window.firebase) {
        results.hasFirebase = true;
        if (window.firebase.auth) {
          results.hasAuth = true;
        }
      }

      // Check if auth functions are in scope
      try {
        // Try to access through the bundled modules
        const checkFunctions = [
          'signInWithPopup',
          'GoogleAuthProvider',
          'signInAnonymously',
          'getAuth'
        ];

        // This will check if functions are available in the global scope
        for (const func of checkFunctions) {
          if (typeof window[func] === 'function') {
            results.authFunctions.push(func);
          }
        }
      } catch (e) {
        console.error('Error checking functions:', e);
      }

      return results;
    });

    console.log('Firebase available:', firebaseCheck.hasFirebase);
    console.log('Auth available:', firebaseCheck.hasAuth);
    console.log('Global auth functions:', firebaseCheck.authFunctions);

    // Test 2: Try to trigger sign-in and catch the actual error
    console.log('\n📊 Test 2: Attempting sign-in to see specific error...');
    
    const signInResult = await page.evaluate(async () => {
      try {
        // Find and click the Google sign-in button
        const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
        const googleButton = buttons.find(btn => 
          btn.textContent?.includes('Continue with Google')
        );
        
        if (!googleButton) {
          return { error: 'Google button not found' };
        }

        // Simulate click
        googleButton.click();
        
        // Wait a bit to see if error occurs
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { success: true };
      } catch (error) {
        return { 
          error: error.message,
          stack: error.stack,
          type: error.constructor.name
        };
      }
    });

    console.log('Sign-in attempt result:', signInResult);

    // Test 3: Check the console for any Firebase-related errors
    console.log('\n📊 Test 3: Checking for Firebase configuration...');
    const configCheck = await page.evaluate(() => {
      // Check if Firebase config exists
      return {
        hasConfig: typeof window.__FIREBASE_CONFIG__ !== 'undefined',
        platform: typeof window !== 'undefined' ? 'web' : 'unknown'
      };
    });
    
    console.log('Firebase config present:', configCheck.hasConfig);
    console.log('Platform:', configCheck.platform);

    console.log('\n🔍 Keeping browser open for manual inspection...');
    console.log('   Check the browser console for any errors.');
    console.log('   Close the browser window when done.');
    
    // Keep browser open
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testFirebaseFunctions();