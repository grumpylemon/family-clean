#!/usr/bin/env node
/**
 * Test Script to Check Button Click Functionality
 * This will help identify if the button click is working
 */

const puppeteer = require('puppeteer');

async function testButtonClick() {
  console.log('🧪 Testing Google Sign-In Button Click...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true,
    args: ['--no-web-security', '--disable-features=VizDisplayCompositor']
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen to all console logs
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🔥') || text.includes('[AuthSlice]') || text.includes('LOGIN')) {
        console.log(`📱 ${msg.type().toUpperCase()}: ${text}`);
      }
    });
    
    // Navigate to the app
    console.log('🌐 Opening app at http://localhost:8081');
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle0' });
    
    // Wait for the page to load
    await page.waitForTimeout(3000);
    
    // Check if the Google button exists
    const googleButton = await page.$('button, [role="button"]');
    if (googleButton) {
      console.log('✅ Found clickable element on page');
    } else {
      console.log('❌ No clickable elements found');
    }
    
    // Try to find text "Continue with Google"
    const googleText = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.find(el => el.textContent?.includes('Continue with Google'));
    });
    
    if (googleText) {
      console.log('✅ Found "Continue with Google" text on page');
    } else {
      console.log('❌ No "Continue with Google" text found');
    }
    
    // Try to click by text
    try {
      console.log('🖱️ Attempting to click "Continue with Google" button...');
      
      await page.evaluate(() => {
        // Find elements containing the text
        const elements = Array.from(document.querySelectorAll('*'));
        const button = elements.find(el => 
          el.textContent?.includes('Continue with Google') && 
          (el.onclick || el.style.cursor === 'pointer' || el.tagName === 'BUTTON')
        );
        
        if (button) {
          console.log('🔥 MANUAL CLICK - Found button element:', button.tagName);
          button.click();
          return true;
        } else {
          console.log('🔥 MANUAL CLICK - No clickable button found');
          return false;
        }
      });
      
      // Wait to see if authentication starts
      await page.waitForTimeout(2000);
      
    } catch (error) {
      console.error('❌ Error clicking button:', error.message);
    }
    
    console.log('⏳ Waiting 10 seconds for authentication logs...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    console.log('🔍 Browser left open for manual inspection. Close manually when done.');
    // await browser.close();
  }
}

// Check if the app is running
const checkServer = async () => {
  try {
    const response = await fetch('http://localhost:8081');
    if (response.ok) {
      testButtonClick();
    } else {
      console.log('❌ App not running on localhost:8081. Start with: npm run web');
    }
  } catch (error) {
    console.log('❌ App not running on localhost:8081. Start with: npm run web');
    console.log('ℹ️  Then run this script again: node scripts/test-button-click.js');
  }
};

checkServer();