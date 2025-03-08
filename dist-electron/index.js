"use strict";
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
app.disableHardwareAcceleration();
app.setName("PicRenamePro");
let mainWindow;
console.log("getAppPath", app.getAppPath());
console.log("__dirname", __dirname);
console.log("preload.js", path.join(__dirname, "preload/index.js"));
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload/index.js"),
      contextIsolation: true,
      // 启用上下文隔离
      nodeIntegration: false
      // 禁用 Node.js 集成
    },
    autoHideMenuBar: true,
    title: "PicRenamePro"
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../../index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
ipcMain.handle("select-images", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "Images", extensions: ["jpg", "jpeg", "png", "gif", "bmp", "tiff"] }
    ]
  });
  if (canceled) return [];
  return filePaths;
});
ipcMain.handle("save-renamed-images", async (event, files) => {
  const targetDir = await dialog.showOpenDialog({
    properties: ["openDirectory"],
    title: "选择保存位置",
    buttonLabel: "保存到此文件夹"
  });
  if (targetDir.canceled) return { success: false, message: "操作已取消" };
  console.log(`准备保存文件，数量: ${files.length}`);
  try {
    const results = [];
    for (const file of files) {
      if (!file.path || !file.newName) {
        results.push({
          originalName: file.path ? path.basename(file.path) : "未知文件",
          success: false,
          message: "文件路径或新文件名无效"
        });
        continue;
      }
      const sourcePath = file.path;
      const targetPath = path.join(targetDir.filePaths[0], file.newName);
      const fileExists = fs.existsSync(targetPath);
      if (fileExists) {
        results.push({
          originalName: path.basename(sourcePath),
          success: false,
          message: "目标文件已存在"
        });
        continue;
      }
      try {
        fs.copyFileSync(sourcePath, targetPath);
        results.push({
          originalName: path.basename(sourcePath),
          newName: file.newName,
          success: true
        });
      } catch (fileError) {
        results.push({
          originalName: path.basename(sourcePath),
          success: false,
          message: fileError.message
        });
      }
    }
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;
    console.log(`保存文件完成，成功: ${successCount}，失败: ${failCount}`);
    return {
      success: successCount > 0,
      message: `已成功保存${successCount}个文件${failCount > 0 ? `，${failCount}个文件保存失败` : ""}`,
      results
    };
  } catch (error) {
    console.error("保存文件时发生错误:", error);
    return { success: false, message: `保存失败: ${error.message}` };
  }
});
ipcMain.handle("read-image-file", async (event, filePath) => {
  try {
    const fileData = fs.readFileSync(filePath);
    return `data:image/${path.extname(filePath).substring(1)};base64,${fileData.toString("base64")}`;
  } catch (error) {
    console.error("读取图片文件失败:", error);
    throw new Error(`读取图片文件失败: ${error.message}`);
  }
});
