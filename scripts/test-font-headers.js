#!/usr/bin/env node

/**
 * Test script to verify font serving headers on deployed site
 * Run: node scripts/test-font-headers.js
 */

const https = require('https');

console.log('Testing font serving headers on deployed site...\n');

// Test URL for Ionicons font (update with actual deployed font URL)
const fontUrl = 'https://family-fun-app.web.app/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.6148e7019854f3bde85b633cb88f3c25.ttf';

console.log(`Testing: ${fontUrl}\n`);

https.get(fontUrl, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log('\nHeaders:');
  console.log('Content-Type:', res.headers['content-type']);
  console.log('Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
  console.log('Cache-Control:', res.headers['cache-control']);
  console.log('Content-Length:', res.headers['content-length']);
  
  if (res.statusCode !== 200) {
    console.error('\n❌ Font file not accessible!');
  } else if (!res.headers['content-type'] || !res.headers['content-type'].includes('font')) {
    console.error('\n⚠️  Warning: Content-Type may not be correct for font file');
    console.log('Expected: application/x-font-ttf or font/ttf');
    console.log('Actual:', res.headers['content-type']);
  } else {
    console.log('\n✅ Font file is accessible with proper headers');
  }
  
  // Don't download the entire file, just check headers
  res.destroy();
}).on('error', (err) => {
  console.error('Error fetching font:', err.message);
});