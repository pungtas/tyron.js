const path = require('path');
const webpack = require('webpack');

module.exports = {
  // generate source maps
  devtool: 'source-map',

  // bundling mode
  mode: 'production',
  target: 'web',
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
  },

  // entry files
  entry: {
    tyron: path.resolve(__dirname, 'lib/index.ts'),
  },

  // output bundles (location)
  output: {
    path: path.resolve(__dirname, 'dist/bundles'),
    filename: '[name].min.js',
    library: 'tyron',
    libraryTarget: 'umd',
  },

  // file resolutions
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      'tyron': path.resolve(
        __dirname,
        'lib/index.ts',
      ),
    },
    modules: ['node_modules'],
  },

  // loaders
  module: {
    rules: [
      {
        test: /\.ts?/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
        exclude: /node_modules/,
      },
    ],
  },

  // plugins
  plugins: [
    new webpack.SourceMapDevToolPlugin({
      filename: '[file].map',
    }),
  ],

  // set watch mode to `true`
  watch: false,
};
