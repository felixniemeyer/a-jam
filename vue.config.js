module.exports = {
  productionSourceMap: process.env.NODE_ENV !== 'production',
  publicPath: './',
  css: {
    loaderOptions: {
      sass: {
        additionalData: '@import "@/global.scss";\n'
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
  lintOnSave: false,
  // devServer :{
  //   allowedHosts: []
  // }
}
