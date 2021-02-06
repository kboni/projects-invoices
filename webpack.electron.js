const path = require('path');
const webpack = require('webpack');

module.exports = {
  // Build Mode
  mode: 'development',
  // Electron Entrypoint
  entry: './src/main.ts',
  target: 'electron-main',
  resolve: {
    alias: {
      ['@']: path.resolve(__dirname, 'src')
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [{
      test: /\.ts$/,
      include: /src/,
      use: [{ loader: 'ts-loader' }]
    }]
  },
  output: {
    path: __dirname + '/dist',
    filename: 'main.js'
  },
  plugins: [
    // Ignore knex dynamic required dialects that we don't use
    new webpack.NormalModuleReplacementPlugin(
      /m[sy]sql2?|oracle(db)?|pg|pg-(native|query)/,
      'noop2',
    )
  ],
  externals: {
    'node-gyp': 'node-gyp',
    'node-pre-gyp': 'node-pre-gyp',
    'sqlite3': 'commonjs sqlite3'
  }
}