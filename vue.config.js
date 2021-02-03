module.exports = {
  productionSourceMap: process.env.NODE_ENV !== 'production',
  lintOnSave: 'warning',
  css: {
    loaderOptions: {
      sass: {
        prependData: `
          @import "@/assets/scss/main.scss";
          `
      }
    }
  }
}
