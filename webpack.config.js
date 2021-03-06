
const path = require('path')

/* Configure HTMLWebpack plugin */
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HTMLWebpackPluginConfig = new HtmlWebpackPlugin({
  template: path.join(__dirname, '/src/index.html'),
  filename: 'index.html',
  inject: 'body'
})

/* Configure BrowserSync */
const BrowserSyncPlugin = require('browser-sync-webpack-plugin')
const BrowserSyncPluginConfig = new BrowserSyncPlugin({
  host: 'localhost',
  port: 3000,
  proxy: 'http://localhost:8080/'
}, config = {
  reload: false
})

/* Configure ProgressBar */
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const ProgressBarPluginConfig = new ProgressBarPlugin()

/* Remove/clean your build folder(s) before building */
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CleanWebpackPluginConfig = new CleanWebpackPlugin(['docs'])

/* Export configuration */
module.exports = {
  devtool: 'source-map',
  entry: [
    './src/index.ts'
  ],
  output: {
    path: path.join(__dirname, 'docs'),
    filename: 'index.js'
  },
  module: {
    loaders: [
      {
        test: /\.ts$/,
        loader: 'awesome-typescript-loader'
      }, {
        test: /\.css$/,
        exclude: /[\/\\](node_modules|bower_components|public)[\/\\]/,
        loaders: [
          'style-loader?sourceMap',
          'css-loader'
        ]
      }, {
        test: /\.obj$/,
        loader: 'file-loader'
      }
    ]
  },
  resolve: { extensions: ['.web.ts', '.web.js', '.ts', '.js'] },
  plugins: [HTMLWebpackPluginConfig, BrowserSyncPluginConfig, ProgressBarPluginConfig, CleanWebpackPluginConfig]
}
