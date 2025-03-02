const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    host: '0.0.0.0', // Доступ по IP
    port: 8080, // Порт (по умолчанию 8080)
    https: false, // Отключение HTTPS (по умолчанию)
  },
})
