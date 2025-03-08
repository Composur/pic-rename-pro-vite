const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron')
const path = require('path')
const fs = require('fs')
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
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html')
    console.log('Loading production index.html from:', indexPath)
    // 开发模式：加载Vite开发服务器URL
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    // 打开开发者工具
    mainWindow.webContents.openDevTools()
  } else {
    // 生产模式：加载打包后的index.html
    // 使用app.getAppPath()获取应用根目录，然后找到dist目录下的index.html
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html')
    console.log('Loading production index.html from:', indexPath)
    mainWindow.loadFile(indexPath)
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
ipcMain.handle('save-renamed-images', async (event, files) => {
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
    const results = []

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
          success: true
        })
      } catch (fileError) {
        results.push({
          originalName: path.basename(sourcePath),
          success: false,
          message: fileError.message
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
    return { success: false, message: `保存失败: ${error.message}` }
  }
})

// 处理读取图片文件的IPC消息
ipcMain.handle('read-image-file', async (event, filePath) => {
  try {
    // 读取文件内容
    const fileData = fs.readFileSync(filePath)
    // 将文件内容转换为Base64字符串
    return `data:image/${path.extname(filePath).substring(1)};base64,${fileData.toString('base64')}`
  } catch (error) {
    console.error('读取图片文件失败:', error)
    throw new Error(`读取图片文件失败: ${error.message}`)
  }
})