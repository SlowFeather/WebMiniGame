const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',                 // 或 'production'
  entry: './src/index.ts',             // 入口文件
  output: {
    filename: 'bundle.js',             // 打包后文件名
    path: path.resolve(__dirname, 'dist'),
    clean: true                        // 每次打包清空 dist
  },
  resolve: {
    extensions: ['.ts', '.js']        // 自动解析这些后缀
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html'       // 模板 HTML
    })
  ],
  devtool: 'source-map'                // 便于调试
};
