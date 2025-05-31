#!/usr/bin/env node

/**
 * Test script to help debug the Google sign-in button issue
 * This creates a simple test HTML file that can be used to test the authentication flow
 */

const fs = require('fs');
const path = require('path');

const testHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auth Button Debug Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #fdf2f8;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        button {
            background: #be185d;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 24px;
            cursor: pointer;
            margin: 10px;
            font-size: 16px;
        }
        button:hover {
            background: #9d174d;
        }
        .log {
            background: #f3f4f6;
            padding: 10px;
            border-radius: 8px;
            margin: 10px 0;
            max-height: 300px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 12px;
        }
        .success { color: #059669; }
        .error { color: #dc2626; }
        .info { color: #0284c7; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Auth Button Debug Test</h1>
        <p>This page tests if the authentication button handlers work correctly.</p>
        
        <div>
            <button onclick="testButtonClick()">Test Button Click</button>
            <button onclick="testAuthFunction()">Test Auth Function</button>
            <button onclick="clearLog()">Clear Log</button>
        </div>
        
        <div id="log" class="log">
            <div class="info">Debug log initialized...</div>
        </div>
    </div>

    <script>
        function log(message, type = 'info') {
            const logDiv = document.getElementById('log');
            const timestamp = new Date().toLocaleTimeString();
            const entry = document.createElement('div');
            entry.className = type;
            entry.textContent = timestamp + ': ' + message;
            logDiv.appendChild(entry);
            logDiv.scrollTop = logDiv.scrollHeight;
        }

        function clearLog() {
            document.getElementById('log').innerHTML = '<div class="info">Debug log cleared...</div>';
        }

        function testButtonClick() {
            log('🔥 Button click test started', 'info');
            
            // Simulate what the React Native TouchableOpacity does
            const event = new Event('press');
            log('Created press event', 'info');
            
            // Test if event handlers work
            try {
                const handler = () => {
                    log('✅ Event handler executed successfully', 'success');
                    return testAuthFunction();
                };
                
                log('Calling handler...', 'info');
                handler();
            } catch (error) {
                log('❌ Error in event handler: ' + error.message, 'error');
            }
        }

        function testAuthFunction() {
            log('🔥 Testing auth function simulation', 'info');
            
            // Simulate the auth function call chain
            try {
                log('1. handleGoogleSignIn called', 'info');
                log('2. Checking signInWithGoogle function...', 'info');
                
                // Simulate async operation
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        log('3. Simulating Firebase auth call...', 'info');
                        
                        // Simulate success or failure
                        const shouldSucceed = Math.random() > 0.5;
                        
                        if (shouldSucceed) {
                            log('✅ Auth simulation successful', 'success');
                            resolve('success');
                        } else {
                            log('❌ Auth simulation failed (random)', 'error');
                            reject(new Error('Simulated auth failure'));
                        }
                    }, 1000);
                });
            } catch (error) {
                log('❌ Error in auth function: ' + error.message, 'error');
            }
        }

        // Test console capture to see if logs are visible
        const originalConsoleLog = console.log;
        console.log = function(...args) {
            log('Console: ' + args.join(' '), 'info');
            originalConsoleLog.apply(console, args);
        };

        const originalConsoleError = console.error;
        console.error = function(...args) {
            log('Console Error: ' + args.join(' '), 'error');
            originalConsoleError.apply(console, args);
        };

        log('Test page loaded and ready', 'success');
        
        // Auto-test on load
        setTimeout(() => {
            log('Running automated button test...', 'info');
            testButtonClick();
        }, 1000);
    </script>
</body>
</html>
`;

const testFilePath = path.join(__dirname, '../public/auth-button-test.html');

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(testFilePath, testHtml);

console.log('✅ Auth button test file created at:', testFilePath);
console.log('📖 Usage:');
console.log('1. Start the development server: npm run web');
console.log('2. Open: http://localhost:8082/auth-button-test.html');
console.log('3. Check the debug log for button interaction issues');
console.log('4. Compare with actual login page behavior');

console.log('\n🔧 Quick Debug Checklist:');
console.log('- If test page buttons work but login doesn\'t: React Native issue');
console.log('- If no logs appear in browser console: JavaScript error preventing execution');
console.log('- If logs show function calls but no auth attempt: Firebase/auth service issue');
console.log('- If button presses don\'t register: Touch/click event issue');