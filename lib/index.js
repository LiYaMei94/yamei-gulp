
/**
 * 入口文件
 * 思路：
 * 开发阶段：
 * 先编译html、css、js文件，然后启动服务器，在服务器任务中监听html、css、js文件的变化，只要发现变化就执行相应的编译任务（每个编译任务执行完成后都reload方法刷新页面）
 * 
 * 打包阶段：
 * 先删除之前的打包文件dist和临时文件temp，在执行编译任务（同时进行）
 * 先编译html、css、js文件，、
 * 然后修改html文件中的引用
 * 压缩html、css、js
 * 
 */


const { src, dest, series, parallel, watch } = require('gulp')
const sass = require('gulp-sass')
const swig = require('gulp-swig')
const babel = require('gulp-babel')
const imgmin = require('gulp-imagemin')
const del = require('del')
const browserSync = require('browser-sync').create()
const gulpUseref = require('gulp-useref')
const IF = require('gulp-if')
const cssmin = require('gulp-clean-css')
const jsmin = require('gulp-uglify')
const htmlmin = require('gulp-htmlmin')

//页面的配置文件
const cwd = process.cwd()
let config = {
  //默认配置
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: "public",
    paths: {
      styles: "assets/styles/*.scss",
      scripts: 'assets/scripts/*.js',
      htmls: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**'
    }
  }
}
try {
  const loadconfig = require(`${cwd}/pages.config.js`)
  config = Object.assign({}, config, loadconfig)
} catch (e) {

}


//抽象路径配置



/**
 * 删除指定的文件
 */
const clean = () => {
  return del([config.build.dist, config.build.temp])
}

/**
 * 将sass转成css
 * reload 方法会通知所有的浏览器相关文件被改动，要么导致浏览器刷新，要么注入文件，实时更新改动。
 */
const style = () => {
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src })//{base:'src'}：执行输出的目录结构按照src下的结构生成
    .pipe(sass({ outputStyle: 'expanded' }))//outputStyle:'expanded'：设置转换成的css文件的结束}另起一行
    .pipe(dest(config.build.temp))
    .pipe(browserSync.reload({ stream: true }))
}

/**
 * 将html模板编译成html文件
 */
const html = () => {
  return src(config.build.paths.htmls, { base: config.build.src, cwd: config.build.src })
    .pipe(swig({ data: config.data, defaults: { cache: false } })) // cache：防止模板缓存导致页面不能及时更新
    .pipe(dest(config.build.temp))
    .pipe(browserSync.reload({ stream: true }))
}

/**
 * 编译es的新特性
 */
const script = () => {
  return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
    .pipe(babel({ presets: [require('@babel/preset-env')] }))
    .pipe(dest(config.build.temp))
    .pipe(browserSync.reload({ stream: true }))
}

/**
 * 压缩图片
 */
const img = () => {
  return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src })
    .pipe(imgmin())
    .pipe(dest(config.build.dist))
}

/**
 * 压缩svg字体
 */
const font = () => {
  return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
    .pipe(imgmin())
    .pipe(dest(config.build.dist))
}


/**
 * 不需要编译的文件直接复制
 */
const other = () => {
  return src('**', { base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
}


/**
 * 服务器任务：
 * 1、监听文件的变化执行相应的任务
 * 2、启动服务器
 */
const serve = () => {
  watch(config.build.paths.styles, { cwd: config.build.src }, style)
  watch(config.build.paths.htmls, { cwd: config.build.src }, html)
  watch(config.build.paths.scripts, { cwd: config.build.src }, script)
  watch([
    config.build.paths.images,
    config.build.paths.fonts,
  ], { cwd: config.build.src }, browserSync.reload)

  watch('**', { cwd: config.build.public }, browserSync.reload)
  /**
   * 启动Browsersync服务
   * port：修改默认端口号
   * baseDir:根目录,会依次查找数组中的目录
   * routes：优先于 baseDir
   * notify:是否显示在浏览器中的通知
   * open(Boolean | String):决定Browsersync启动时自动在浏览器打开网址
   * files:要监听变化的文件
   */
  browserSync.init({
    port: '8888',
    server: {
      baseDir: [config.build.temp, config.build.src, config.build.public],
      routes: {
        "/node_modules": "node_modules"
      }
    },
    notify: false,
    open: true,
    // files: []
  })
}


/**
 * 文件引用处理任务
 * html/css/js先编译到temp文件夹，最后在压缩到dist
 */
const useref = () => {
  return src(config.build.paths.htmls, { base: config.build.temp, cwd: config.build.temp })
    .pipe(gulpUseref({ searchPath: [config.build.temp, '.'] }))
    // html、css、js压缩
    .pipe(IF(/\.js$/, jsmin()))
    .pipe(IF(/\.css$/, cssmin()))
    .pipe(IF(/\.html$/, htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,//压缩行内样式
      minifyJS: true//压缩页面内的脚本
    })))
    .pipe(dest(config.build.dist))

}



/**
 * 编译任务：style,html,script三者同时进行
 */
const compile = parallel(style, html, script)

/**
 * 打包任务：先删除dist,temp，最后编译压缩打包
 */
const build = series(clean, parallel(series(compile, useref), img, font, other))

/**
 * 开发任务
 */
const develop = series(compile, serve)

module.exports = {
  // style,
  // html,
  // script,
  // img,
  // font,
  // other,
  // serve,
  // compile,
  clean,
  build,
  develop
}