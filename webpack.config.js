const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const webpack = require('webpack');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Add DefinePlugin to replace import.meta
  config.plugins.push(
    new webpack.DefinePlugin({
      'import.meta.url': JSON.stringify('http://localhost:8081'),
      'import.meta.env.MODE': JSON.stringify('production'),
      'import.meta.env.DEV': JSON.stringify(false),
      'import.meta.env.PROD': JSON.stringify(true),
      'import.meta.env': JSON.stringify({
        MODE: 'production',
        DEV: false,
        PROD: true,
        SSR: false
      }),
      'import.meta': JSON.stringify({
        url: 'http://localhost:8081',
        env: {
          MODE: 'production',
          DEV: false,
          PROD: true,
          SSR: false
        }
      })
    })
  );
  
  // Add banner to inject polyfill at the very beginning
  config.plugins.push(
    new webpack.BannerPlugin({
      banner: `
        if (typeof globalThis !== 'undefined' && !globalThis.import) {
          globalThis.import = { meta: { url: 'http://localhost:8081', env: { MODE: 'production' } } };
        }
        if (typeof window !== 'undefined' && !window.import) {
          window.import = { meta: { url: 'http://localhost:8081', env: { MODE: 'production' } } };
        }
      `,
      raw: true,
      entryOnly: true
    })
  );
  
  return config;
};