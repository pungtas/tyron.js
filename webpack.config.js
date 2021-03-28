const BabelMinify = require("babel-minify-webpack-plugin");
const path = require("path");
const webpack = require("webpack");

module.exports = {
  devtool: 'source-map',

  mode: 'production',
  target: 'web',
  node: {
    fs: 'empty',
  },

  entry: {
    tyron: path.resolve(__dirname, "dist/index.js"),
  },

  output: {
    filename: '[name].min.js',
    path: path.resolve(__dirname, "bundles"),
    library: "Tyron"
  },

  resolve: {
    alias: {
      process: "process/browser",
      crypto: "crypto-browserify",
      stream: "stream-browserify"
    },
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

  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser'
    }),
  ],
  optimization: {
    minimizer: [new BabelMinify({ mangle: false })]
  },

  // set watch mode to `true`
  watch: false,
};
