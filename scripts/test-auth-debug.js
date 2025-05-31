#!/usr/bin/env node
/**
 * Authentication Debug Test
 * Tests the new user sign-up flow to identify where the authentication loop occurs
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testAuthFlow() {
  console.log('🔍 Starting authentication flow debug test...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    devtools: true,  // Open devtools
    args: ['--no-web-security', '--disable-features=VizDisplayCompositor']
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen to console logs from the app
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('[useAuth]') || 
            text.includes('[AuthSlice]') || 
            text.includes('LOGIN') ||
            text.includes('User state') ||
            text.includes('redirect')) {
          console.log(`📱 ${msg.type().toUpperCase()}: ${text}`);
        }
      }
    });
    
    // Navigate to the app
    console.log('🌐 Opening app at http://localhost:8081');
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle0' });
    
    // Wait for app to load
    await page.waitForTimeout(3000);
    
    // Check if we're on login screen
    const isLoginScreen = await page.evaluate(() => {
      return !!document.querySelector('text')?.textContent?.includes('Continue with Google') ||
             !!document.querySelector('button')?.textContent?.includes('Continue with Google');
    });
    
    console.log('📱 On login screen:', isLoginScreen);
    
    // Check auth state in the app
    const authState = await page.evaluate(() => {
      try {
        // Try to access the Zustand store
        return window.__ZUSTAND_STORE__ || 'Store not found';
      } catch (error) {
        return `Error accessing store: ${error.message}`;
      }
    });
    
    console.log('🏪 Auth state:', authState);
    
    // Check localStorage for persisted auth
    const persistedAuth = await page.evaluate(() => {
      try {
        const stored = localStorage.getItem('family-store');
        return stored ? JSON.parse(stored) : 'No stored data';
      } catch (error) {
        return `Error reading localStorage: ${error.message}`;
      }
    });
    
    console.log('💾 Persisted auth:', persistedAuth);
    
    // Wait for additional logs
    console.log('⏳ Waiting 10 seconds for additional logs...');
    await page.waitForTimeout(10000);
    
    console.log('✅ Debug test completed');
    
  } catch (error) {
    console.error('❌ Error during auth debug test:', error);
  } finally {
    // Keep browser open for manual inspection
    console.log('🔍 Browser left open for manual inspection. Close manually when done.');
    // await browser.close();
  }
}

// Check if the app is running
const checkServer = async () => {
  try {
    const response = await fetch('http://localhost:8081');
    if (response.ok) {
      testAuthFlow();
    } else {
      console.log('❌ App not running on localhost:8081. Start with: npm run web');
    }
  } catch (error) {
    console.log('❌ App not running on localhost:8081. Start with: npm run web');
    console.log('ℹ️  Then run this script again: node scripts/test-auth-debug.js');
  }
};

checkServer();