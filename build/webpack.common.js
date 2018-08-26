const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
        })
    ]
}