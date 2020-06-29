/* eslint-disable */
const path = require('path')
const { execSync } = require('child_process')
const package = require('./package.json')

const rules = []

if (process.env.NODE_ENV === 'test') {
  rules.push({
    test: /\.(js|ts)$/,
    include: path.resolve('src'),
    loader: 'istanbul-instrumenter-loader',
    query: {
      esModules: true
    }
  })
}

module.exports = {
  pluginOptions: {
    electronBuilder: {
      chainWebpackMainProcess: config => {
        config.plugin('define').tap(args => {
          args[0]['process.env.SORA_PACKAGE_VERSION'] = JSON.stringify(package.version)
          args[0]['process.env.SORA_COMMIT_HASH'] = JSON.stringify(execSync('git rev-parse HEAD').toString().trim())
          args[0]['process.env.SORA_COMMIT_HASH_SHORT'] = JSON.stringify(execSync('git rev-parse --short HEAD').toString().trim())
          return args
        })
        return config
      },
      builderOptions: {
        productName: 'Sora Desktop',
        extraFiles: [
          {
            from: 'src/update.html',
            to: 'update.html'
          }
        ]
      }
    }
  },
  chainWebpack: config => {
    config.plugin('define').tap(args => {
      args[0]['process.env.VUE_SORA_PACKAGE_VERSION'] = JSON.stringify(package.version)
      return args
    })
    config.resolve.alias
      .set('@/util', path.resolve(__dirname, 'src/util'))
      .set('@/router', path.resolve(__dirname, 'src/router.js'))
    return config
  },
  configureWebpack: {
    module: {
      rules: rules
    }
  },
  pages: {
    index: 'src/main.ts',
    update: 'src/components/Update/Update.ts'
  }
}
