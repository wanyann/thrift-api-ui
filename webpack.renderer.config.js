const webpack = require('webpack');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const baseConfig = require('./webpack.base.config');

module.exports = merge.smart(baseConfig, {
    target: 'electron-renderer',
    entry: {
        app: ['@babel/polyfill','./src/renderer/app.tsx']
    },
    module: {
        rules: [
            {
                test: /\.[tj]sx?$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    cacheDirectory: true,
                    babelrc: false,
                    presets: [
                        [
                            '@babel/preset-env',
                            { targets: { browsers: 'last 2 versions ' } }
                        ],
                        '@babel/preset-typescript',
                        '@babel/preset-react'
                    ],
                    plugins: [
                        ['@babel/plugin-proposal-class-properties', { loose: true }],
                        require.resolve('@babel/plugin-syntax-dynamic-import'),
                        require.resolve('babel-plugin-styled-components')
                    ]
                }
            },
            {
              test: /\.js$/,
              include: [
                path.resolve(__dirname, 'node_modules/monaco-editor'),
                path.resolve(__dirname, 'node_modules/react-monaco-editor')
              ],
              use: {
                loader: 'babel-loader',
                options: {
                  // мы явно указываем presets/plugins только для этого правила — безопасно
                  presets: [
                    ['@babel/preset-env', { targets: { browsers: ['last 2 versions', 'Safari >= 10'] }, modules: false }]
                  ],
                  plugins: [
                    '@babel/plugin-syntax-dynamic-import'
                  ],
                  cacheDirectory: true
                }
              }
            },
            {
                test: /\.css$/,
                loaders: ['style-loader', 'css-loader']
            },
            {
                test: /\.(gif|png|jpe?g|svg)$/,
                use: [
                    'file-loader',
                    {
                        loader: 'image-webpack-loader',
                        options: {
                            disable: true
                        }
                    }
                ]
            },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
              enforce: 'pre',
              test: /\.js$/,
              loader: 'source-map-loader',
              exclude: [
                /node_modules\/monaco-editor/, // <-- исключаем monaco
                /node_modules\/react-monaco-editor/
              ]
            }
        ]
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin({
            reportFiles: ['src/renderer/**/*']
        }),
        new webpack.NamedModulesPlugin(),
        new HtmlWebpackPlugin({
            title: 'Thrift API UI'
        }),
        new webpack.NormalModuleReplacementPlugin(
            /bufrw\/lib\/can-require\.js/, require.resolve('./lib/bufrw-fix')
        ),
        new MonacoWebpackPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        })
    ]
});
