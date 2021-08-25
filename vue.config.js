module.exports = {
  productionSourceMap: process.env.NODE_ENV !== 'production',
  lintOnSave: 'warning',
  publicPath: './',
  css: {
    loaderOptions: {
      sass: {
        prependData: `
          @import "@/main.scss";
          `
      }
    }
  },
  chainWebpack: config => {
    config.plugin('html')
      .tap(args => {
        args[0].title = 'a-jam'
        return args
      })
  },
  lintOnSave: false
}
