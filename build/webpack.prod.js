const merge = require('webpack-merge');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const common = require('./webpack.common');
const {resolve} = require('./utils');

module.exports = merge(common, {
    mode: 'production',
    plugins:[
        new CleanWebpackPlugin(['dist'],{
            root:resolve('/')
        }),
    ]
})