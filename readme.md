
### 初始化 npm 项目
```
npm init -y
```
这会生成一个 package.json，用于管理项目依赖和脚本。




### 安装开发依赖
```
npm install --save-dev typescript webpack webpack-cli ts-loader html-webpack-plugin
```
typescript：TypeScript 编译器

webpack：模块打包器

webpack-cli：Webpack 命令行工具

ts-loader：在 Webpack 中加载并编译 .ts 文件

html-webpack-plugin：自动生成并注入打包后脚本到 index.html


### 配置 TypeScript

``` json
{
    "compilerOptions": {
      "target": "es5",                   // 输出兼容的 JS 版本
      "module": "es6",                   // 模块规范
      "strict": true,                    // 开启严格模式
      "outDir": "./dist",                // 编译输出目录
      "rootDir": "./src",                // 源码根目录
      "sourceMap": true,                 // 生成 source-map
      "esModuleInterop": true,            // 兼容 CommonJS/ESModule

      // 解决代码编辑vs报错
      "baseUrl": "./src",
      "paths": {
            "*": ["*", "./node_modules/@types/*"]
        }
    },
    
    "include": ["src/**/*"]
  }
```


### 配置 Webpack
在项目根目录创建 webpack.config.js
``` js
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


```



```
npm run start
```


```
npm run build
```