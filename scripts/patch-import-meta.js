const fs = require('fs');
const path = require('path');

console.log('🔧 Patching import.meta in bundle...');

// Find all JS files in the dist directory
function findJsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...findJsFiles(fullPath));
    } else if (item.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Patch import.meta in a file
function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Replace import.meta patterns
  const patterns = [
    // Replace import.meta.url
    { 
      pattern: /import\.meta\.url/g, 
      replacement: '"http://localhost:8081"' 
    },
    // Replace import.meta.env.MODE
    { 
      pattern: /import\.meta\.env\.MODE/g, 
      replacement: '"production"' 
    },
    // Replace import.meta.env
    { 
      pattern: /import\.meta\.env/g, 
      replacement: '({ MODE: "production", DEV: false, PROD: true })' 
    },
    // Replace standalone import.meta
    { 
      pattern: /import\.meta(?!\.)/g, 
      replacement: '({ url: "http://localhost:8081", env: { MODE: "production", DEV: false, PROD: true } })' 
    }
  ];
  
  for (const { pattern, replacement } of patterns) {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }
  
  if (modified) {
    // Also inject polyfill at the beginning of the file
    const polyfill = `
(function() {
  if (typeof globalThis !== 'undefined' && !globalThis.import) {
    globalThis.import = { meta: { url: 'http://localhost:8081', env: { MODE: 'production', DEV: false, PROD: true } } };
  }
  if (typeof window !== 'undefined' && !window.import) {
    window.import = { meta: { url: 'http://localhost:8081', env: { MODE: 'production', DEV: false, PROD: true } } };
  }
})();
`;
    content = polyfill + content;
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Patched ${path.basename(filePath)}`);
    return true;
  }
  
  return false;
}

// Main execution
const distDir = path.join(__dirname, '..', 'dist');

if (fs.existsSync(distDir)) {
  const jsFiles = findJsFiles(distDir);
  let patchedCount = 0;
  
  for (const file of jsFiles) {
    if (patchFile(file)) {
      patchedCount++;
    }
  }
  
  if (patchedCount > 0) {
    console.log(`✅ Patched ${patchedCount} files`);
  } else {
    console.log('ℹ️  No import.meta found in bundle files');
  }
} else {
  console.error('❌ dist directory not found');
  process.exit(1);
}