const { contextBridge, ipcRenderer } = require('electron')

// 定义文件类型接口
interface RenamedFile {
  oldPath: string;
  newName: string;
}

// 暴露给渲染进程的API
contextBridge.exposeInMainWorld('electronAPI', {
  // 选择图片文件
  selectImages: () => ipcRenderer.invoke('select-images'),

  // 保存重命名后的图片
  saveRenamedImages: (files: RenamedFile[]) => ipcRenderer.invoke('save-renamed-images', files),

  // 读取图片文件并返回Base64字符串
  readImageFile: (filePath: string) => ipcRenderer.invoke('read-image-file', filePath)
})