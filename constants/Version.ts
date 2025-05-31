// App Version Configuration
// Update this before each build to increment the version number
export const APP_VERSION = 'v2.185';

// Build hash will be auto-updated by build scripts
export const BUILD_HASH = 'cb2836a';

// Combined version string for display
export const VERSION_STRING = `${APP_VERSION}-${BUILD_HASH}`;
export const VERSION_DISPLAY = `${APP_VERSION} • Build ${BUILD_HASH}`;

// Cache buster for forcing updates
export const CACHE_BUSTER = Date.now();

// Log version information to console immediately
console.log(`%c🚀 Family Compass ${VERSION_DISPLAY}`, 'background: linear-gradient(45deg, #be185d, #f9a8d4); color: white; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 14px;');
console.log(`%cBuild Version: ${APP_VERSION}`, 'color: #be185d; font-weight: bold; font-size: 12px;');
console.log(`%cBuild Hash: ${BUILD_HASH}`, 'color: #9f1239; font-weight: bold; font-size: 12px;');
console.log(`%cTimestamp: ${new Date().toISOString()}`, 'color: #831843; font-weight: normal; font-size: 11px;');