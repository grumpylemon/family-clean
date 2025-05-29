// Custom transformer to replace import.meta at build time
const upstreamTransformer = require('metro-react-native-babel-transformer');

module.exports.transform = function({ src, filename, options }) {
  // Replace import.meta before babel transformation
  if (options.platform === 'web') {
    src = src
      .replace(/import\.meta\.url/g, '"http://localhost:8081"')
      .replace(/import\.meta\.env\.MODE/g, '"production"')
      .replace(/import\.meta\.env/g, '({ MODE: "production", DEV: false, PROD: true })')
      .replace(/import\.meta/g, '({ url: "http://localhost:8081", env: { MODE: "production", DEV: false, PROD: true } })');
  }
  
  return upstreamTransformer.transform({ src, filename, options });
};