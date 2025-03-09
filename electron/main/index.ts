import { app, BrowserWindow, ipcMain, dialog, net } from 'electron'
import { FileResult, SaveResult } from './types';
const path = require('path')
const fs = require('fs')
const nodeUrl = require('url')
console.log('Loading protocol-handler...');
const { registerProtocolHandler } = require('./protocol-handler.js')
// 禁用GPU加速以避免某些系统上的问题
app.disableHardwareAcceleration()

// 设置应用名称
app.setName('PicRenamePro')

// 保存主窗口的引用，避免被JavaScript的GC回收
let mainWindow;
console.log('getAppPath', app.getAppPath())
console.log('__dirname', __dirname)
console.log('preload.js', path.join(__dirname, 'preload/index.js'))
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload/index.js'),
      contextIsolation: true,  // 启用上下文隔离
      nodeIntegration: false,   // 禁用 Node.js 集成
      webSecurity: false,       // 启用Web安全
    },
    autoHideMenuBar: true,
    title: 'PicRenamePro',
  })

  // 加载应用
  if (process.env.VITE_DEV_SERVER_URL) {
    // 开发模式：加载Vite开发服务器URL
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    // mainWindow.loadURL('app://dist/index.html')
    // 打开开发者工具
    mainWindow.webContents.openDevTools()
  } else {
    // 生产模式：使用自定义协议加载应用
    mainWindow.loadURL('app://dist/index.html')
  }

  // 设置窗口图标
  // mainWindow.setIcon(path.join(__dirname, '../../public/icon.png'))

  // 窗口关闭时触发
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  // 注册自定义协议
  registerProtocolHandler('app', app.getAppPath(), 'dist', true);
  // protocol.handle('app', (request) => {
  //   const url = new URL(request.url)
  //   console.log('Request URL:', request.url)
  //   console.log('Request URL pathname:', url.pathname)
  //   const filePath = path.join(app.getAppPath(), 'dist', url.pathname)
  //   console.log('Loading file:', filePath)
  //   console.log('pathToFileURL:', nodeUrl.pathToFileURL(filePath).toString())
  //   return net.fetch(nodeUrl.pathToFileURL(filePath).toString())
  // })

  createWindow()

  // 在macOS上，当点击dock图标且没有其他窗口打开时，重新创建一个窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 当所有窗口关闭时退出应用，除了在macOS上
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// 处理选择图片文件的IPC消息
ipcMain.handle('select-images', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'] }
    ]
  })
  if (canceled) return []
  return filePaths
})

// 处理保存重命名后的图片的IPC消息
ipcMain.handle('save-renamed-images', async (event, files): Promise<SaveResult> => {
  // 打开对话框让用户选择保存目录
  const targetDir = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '选择保存位置',
    buttonLabel: '保存到此文件夹'
  })

  if (targetDir.canceled) return { success: false, message: '操作已取消' }

  console.log(`准备保存文件，数量: ${files.length}`)
  try {
    // 创建一个结果数组，记录每个文件的保存状态
    const results: FileResult[] = []

    for (const file of files) {
      if (!file.path || !file.newName) {
        results.push({
          originalName: file.path ? path.basename(file.path) : '未知文件',
          success: false,
          message: '文件路径或新文件名无效'
        })
        continue
      }

      const sourcePath = file.path
      const targetPath = path.join(targetDir.filePaths[0], file.newName)

      // 检查目标文件是否已存在
      const fileExists = fs.existsSync(targetPath)
      if (fileExists) {
        results.push({
          originalName: path.basename(sourcePath),
          success: false,
          message: '目标文件已存在'
        })
        continue
      }

      try {
        // 复制文件到新位置并使用新文件名
        fs.copyFileSync(sourcePath, targetPath)
        results.push({
          originalName: path.basename(sourcePath),
          newName: file.newName,
          success: true,
          message: '文件保存成功'
        })
      } catch (fileError: unknown) {
        // 确保 fileError 是 Error 类型
        const error = fileError instanceof Error ? fileError : new Error('未知错误');
        results.push({
          originalName: path.basename(sourcePath),
          success: false,
          message: error.message
        })
      }
    }

    // 统计成功和失败的数量
    const successCount = results.filter(r => r.success).length
    const failCount = results.length - successCount

    // 返回详细的结果信息
    console.log(`保存文件完成，成功: ${successCount}，失败: ${failCount}`)
    return {
      success: successCount > 0,
      message: `已成功保存${successCount}个文件${failCount > 0 ? `，${failCount}个文件保存失败` : ''}`,
      results: results
    }
  } catch (error) {
    console.error('保存文件时发生错误:', error)
    return { success: false, message: `保存失败: ${(error as Error).message}` }
  }
})

// 处理读取图片文件的IPC消息
ipcMain.handle('read-image-file', async (event, filePath) => {
  try {
    // 读取文件内容
    const fileData = fs.readFileSync(filePath)
    // 将文件内容转换为Base64字符串
    return `data:image/${path.extname(filePath).substring(1)};base64,${fileData.toString('base64')}`
  } catch (error: unknown) {
    console.error('读取图片文件失败:', error)
    // 确保 error 是 Error 类型
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    throw new Error(`读取图片文件失败: ${errorMessage}`)
  }
})