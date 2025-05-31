#!/usr/bin/env node
/**
 * Color Contrast Checker for Family Compass Dark Mode
 * 
 * This script calculates WCAG contrast ratios for our current color palette
 * and identifies combinations that don't meet accessibility standards.
 */

// Color utility functions
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function getContrastLevel(ratio) {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'FAIL';
}

// Current color palettes
const lightColors = {
  background: '#fdf2f8',
  surface: '#ffffff',
  primary: '#be185d',
  primaryLight: '#f9a8d4',
  primaryDark: '#831843',
  text: '#831843',
  textSecondary: '#9f1239',
  textMuted: '#6b7280',
  accent: '#fbcfe8',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  border: '#f9a8d4',
  divider: '#fbcfe8',
};

const darkColors = {
  background: '#1a0a0f',
  surface: '#2d1520',
  primary: '#be185d',
  primaryLight: '#831843',
  primaryDark: '#9f1239',
  text: '#ffffff',
  textSecondary: '#f1f5f9',
  textMuted: '#94a3b8',
  accent: '#f9a8d4',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  border: '#4a1f35',
  divider: '#3d1a2b',
};

// Critical color combinations to check
const testCombinations = [
  // Light mode (should all pass)
  { name: 'Light: Text on Background', fg: lightColors.text, bg: lightColors.background, mode: 'light' },
  { name: 'Light: Text on Surface', fg: lightColors.text, bg: lightColors.surface, mode: 'light' },
  { name: 'Light: Primary on Background', fg: lightColors.primary, bg: lightColors.background, mode: 'light' },
  
  // Dark mode (problematic combinations)
  { name: 'Dark: Text on Background', fg: darkColors.text, bg: darkColors.background, mode: 'dark' },
  { name: 'Dark: Text on Surface', fg: darkColors.text, bg: darkColors.surface, mode: 'dark' },
  { name: 'Dark: White on Primary Light (Change Avatar)', fg: '#ffffff', bg: darkColors.primaryLight, mode: 'dark' },
  { name: 'Dark: Primary on Background', fg: darkColors.primary, bg: darkColors.background, mode: 'dark' },
  { name: 'Dark: Text Secondary on Primary Light', fg: darkColors.textSecondary, bg: darkColors.primaryLight, mode: 'dark' },
  { name: 'Dark: White on Primary', fg: '#ffffff', bg: darkColors.primary, mode: 'dark' },
  
  // Button combinations  
  { name: 'Dark: White on Primary (Button)', fg: '#ffffff', bg: darkColors.primary, mode: 'dark' },
  { name: 'Dark: Accent on Surface (Icon - Fixed)', fg: darkColors.accent, bg: darkColors.surface, mode: 'dark' },
  { name: 'Dark: Text Muted on Background', fg: darkColors.textMuted, bg: darkColors.background, mode: 'dark' },
  
  // AdminSettings specific combinations
  { name: 'Dark: Accent on Card Background (Admin Icon)', fg: darkColors.accent, bg: darkColors.surface, mode: 'dark' },
  { name: 'Dark: Text on Card Background', fg: darkColors.text, bg: darkColors.surface, mode: 'dark' },
];

console.log('🎨 Family Compass - Color Contrast Analysis');
console.log('==========================================\n');

console.log('WCAG Standards:');
console.log('• AAA: 7:1 (Enhanced)');
console.log('• AA: 4.5:1 (Standard)');
console.log('• AA Large: 3:1 (18pt+ text)');
console.log('• FAIL: <3:1 (Non-compliant)\n');

// Test all combinations
let passCount = 0;
let failCount = 0;

testCombinations.forEach(combo => {
  const ratio = getContrastRatio(combo.fg, combo.bg);
  const level = getContrastLevel(ratio);
  const status = level === 'FAIL' ? '❌' : '✅';
  
  if (level === 'FAIL') {
    failCount++;
  } else {
    passCount++;
  }
  
  console.log(`${status} ${combo.name}`);
  console.log(`   Foreground: ${combo.fg} | Background: ${combo.bg}`);
  console.log(`   Contrast: ${ratio.toFixed(2)}:1 (${level})`);
  console.log('');
});

console.log('📊 Summary:');
console.log(`✅ Passing: ${passCount}`);
console.log(`❌ Failing: ${failCount}`);
console.log(`📈 Success Rate: ${((passCount / testCombinations.length) * 100).toFixed(1)}%\n`);

if (failCount > 0) {
  console.log('🔧 Recommended Fixes:');
  console.log('1. Replace dark mode text color (#fbcfe8) with higher contrast alternative');
  console.log('2. Avoid using light pink backgrounds for text in dark mode');
  console.log('3. Use white (#ffffff) for button text on colored backgrounds');
  console.log('4. Increase contrast for muted text elements');
  console.log('5. Test all button states (normal, hover, disabled) for contrast compliance\n');
}

// Suggest improved dark mode colors
console.log('💡 Suggested Dark Mode Color Improvements:');
console.log(`
// Improved dark mode palette with better contrast
const improvedDarkColors = {
  background: '#1a0a0f',     // Keep existing
  surface: '#2d1520',       // Keep existing  
  primary: '#f9a8d4',       // Keep existing
  primaryLight: '#be185d',  // CHANGE: Use darker pink for better contrast
  text: '#ffffff',          // CHANGE: Use pure white for maximum contrast
  textSecondary: '#f1f5f9', // CHANGE: Light gray instead of pink
  textMuted: '#94a3b8',     // CHANGE: Higher contrast muted text
  accent: '#be185d',        // Keep existing
  // ... other colors
};
`);

console.log('🧪 Test these changes with: https://webaim.org/resources/contrastchecker/');