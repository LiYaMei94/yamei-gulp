#!/usr/bin/env node
// cli的执行入口


//process.argv:获取命令行输入的参数，类型是数组
// console.log(process.argv)
process.argv.push('--cwd')
process.argv.push(process.cwd())
process.argv.push('--gulpfile')
// require载入模块，require.resolve找到模块说对应的路径
process.argv.push(require.resolve('../lib/index.js'))
//执行node_modules下的gulp包里面的内容
require('gulp/bin/gulp')
