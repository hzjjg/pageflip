const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    entry: {
        pageFlip: './src/pageFlip.ts',
        demo: './demo/index.ts'
    },

    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: '[name].[hash].bundle.js'
    },

    module: {
        rules: [
            {
                test: /\.(png|jpg|gif)$/i,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192,
                        }
                    }
                ]
            },
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: 'babel-loader'
                    },
                    {
                        loader: 'ts-loader'
                    }
                ],
                exclude: /node_modules/
            },
            {
                test: /\.scss?$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                    },
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'postcss-loader'
                    },
                    {
                        loader: 'sass-loader'
                    }
                ],
            },
            {
                test: /\.html?$/,
                loader: 'html-loader'
            }
        ]
    },

    resolve: {
        extensions: [".ts", ".js", ".scss", 'json']
    },

    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'demo/index.html'
        }),
        new MiniCssExtractPlugin({
            filename: '[name].[hash].css',
            chunkFilename: '[id].[hash].css',
        })
    ]
}