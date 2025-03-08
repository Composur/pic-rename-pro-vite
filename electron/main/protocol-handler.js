const { protocol, net } = require('electron')
const path = require('path')
const nodeUrl = require('url')

/**
 * 注册自定义协议处理器
 * @param {string} protocolName - 协议名称，例如 'app'
 * @param {string} appPath - 应用路径，通常是 app.getAppPath()
 * @param {string} distDir - 分发目录名称，默认为 'dist'
 * @param {boolean} enableLogging - 是否启用日志记录，默认为 false
 */
function registerProtocolHandler(protocolName, appPath, distDir = 'dist', enableLogging = false) {
  protocol.handle(protocolName, (request) => {
    const url = new URL(request.url)
    
    if (enableLogging) {
      console.log('Request URL:', request.url)
      console.log('Request URL pathname:', url.pathname)
    }
    
    const filePath = path.join(appPath, distDir, url.pathname)
    
    if (enableLogging) {
      console.log('Loading file:', filePath)
      console.log('pathToFileURL:', nodeUrl.pathToFileURL(filePath).toString())
    }
    
    return net.fetch(nodeUrl.pathToFileURL(filePath).toString())
  })
}

module.exports = {
  registerProtocolHandler
}