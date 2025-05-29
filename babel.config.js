module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Transform import.meta for web compatibility
      ['babel-plugin-transform-import-meta', {
        // Replace import.meta with a polyfill
        replacements: [
          {
            identifier: 'import.meta.env',
            replacement: 'process.env'
          },
          {
            identifier: 'import.meta.url',
            replacement: '"http://localhost:8081"'
          },
          {
            identifier: 'import.meta',
            replacement: '{ url: "http://localhost:8081", env: process.env }'
          }
        ]
      }]
    ]
  };
};