module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Transform import.meta before any other transformations
      ['babel-plugin-transform-import-meta', { module: 'ES6' }],
      // Additional plugin to handle any remaining import.meta
      function() {
        return {
          visitor: {
            MetaProperty(path) {
              if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
                const replacement = api.template.expression(`
                  (typeof globalThis !== 'undefined' && globalThis.import && globalThis.import.meta) ||
                  { url: "http://localhost:8081", env: { MODE: "production", DEV: false, PROD: true } }
                `)();
                path.replaceWith(replacement);
              }
            }
          }
        };
      }
    ]
  };
};