"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  // 选择图片文件
  selectImages: () => ipcRenderer.invoke("select-images"),
  // 保存重命名后的图片
  saveRenamedImages: (files) => ipcRenderer.invoke("save-renamed-images", files),
  // 读取图片文件并返回Base64字符串
  readImageFile: (filePath) => ipcRenderer.invoke("read-image-file", filePath)
});
