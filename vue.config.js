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
  }
}
