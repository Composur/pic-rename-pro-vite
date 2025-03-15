<template>
  <div class="home-container">
    <header class="app-header">
      <h1>PicRenamePro</h1>
      <p>智能图片批量重命名工具</p>
    </header>

    <main class="main-content">
      <el-card class="upload-area" shadow="hover">
        <template #header>
          <div class="card-header">
            <h2>图片上传区域</h2>
            <el-button type="primary" @click="handleSelectImages" :icon="Plus"
              >选择图片</el-button
            >
          </div>
        </template>

        <div class="image-list" v-if="imageFiles.length > 0">
          <el-table :data="imageFiles" style="width: 100%" border stripe>
            <el-table-column label="预览" width="120" align="center">
              <template #default="scope">
                <div class="image-preview-container">
                  <el-image
                    class="preview-image"
                    :src="scope.row.url"
                    fit="contain"
                    :preview-src-list="[scope.row.url]"
                    :initial-index="0"
                    preview-teleported
                  ></el-image>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              prop="originalName"
              label="原文件名"
              min-width="180"
              show-overflow-tooltip
            ></el-table-column>
            <el-table-column
              prop="ocrText"
              label="OCR识别文本"
              min-width="200"
              show-overflow-tooltip
            >
              <template #default="scope">
                <div v-if="scope.row.ocrText" class="ocr-text-container">
                  {{ scope.row.ocrText }}
                </div>
                <div v-else-if="scope.row.ocrLoading" class="loading-container">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  <span>识别中...</span>
                </div>
                <el-button
                  v-else
                  size="small"
                  type="info"
                  @click="performOCR(scope.row)"
                >
                  <el-icon><Document /></el-icon> OCR识别
                </el-button>
              </template>
            </el-table-column>
            <el-table-column prop="newName" label="新文件名" min-width="200">
              <template #default="scope">
                <div v-if="scope.row.newName" class="new-name-container">
                  <el-input v-model="scope.row.newName" size="small"></el-input>
                </div>
                <div v-else-if="scope.row.aiLoading" class="loading-container">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  <span>AI生成中...</span>
                </div>
                <el-button
                  v-else
                  size="small"
                  type="primary"
                  :disabled="!scope.row.ocrText"
                  @click="generateAIName(scope.row)"
                >
                  <el-icon><MagicStick /></el-icon> AI命名
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="action-buttons">
            <el-button type="danger" @click="clearImages" :icon="Delete"
              >清空列表</el-button
            >
            <el-button
              type="success"
              @click="saveRenamedImages"
              :disabled="!hasRenamedImages"
              :icon="Download"
              >保存重命名</el-button
            >
          </div>
        </div>

        <div class="empty-tip" v-else>
          <el-empty description="暂无图片，请点击上方按钮选择图片">
            <el-button type="primary" @click="handleSelectImages"
              >选择图片</el-button
            >
          </el-empty>
        </div>
      </el-card>
    </main>

    <footer class="app-footer">
      <p>
        © 2023 PicRenamePro | <router-link to="/about">关于我们</router-link>
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElLoading } from "element-plus"
import {
  Loading,
  Plus,
  Delete,
  Download,
  Document,
  MagicStick,
} from "@element-plus/icons-vue"
import { createWorker } from "tesseract.js"
import { computed, ref } from "vue"
import type { FileResult, SaveResult } from "electron/main/types"

// 图片文件列表
interface ImageFile {
  path: string
  originalName: string
  url: string
  ocrText: string
  newName: string
  ocrLoading: boolean
  aiLoading: boolean
}
const imageFiles = ref<ImageFile[]>([])

// 计算属性：是否有已重命名的图片
const hasRenamedImages = computed(() => {
  return imageFiles.value.some((file) => file.newName)
})

// 选择图片文件// 修改后的 handleSelectImages 函数
// 修改后的 handleSelectImages 函数
async function handleSelectImages() {
  try {
    let filePaths = []

    // 根据运行环境选择不同的文件选择方式
    if (window.electronAPI) {
      // Electron环境
      filePaths = await window.electronAPI.selectImages()
    } else {
      // Web环境
      const input = document.createElement("input")
      input.type = "file"
      input.multiple = true
      input.accept = "image/*"

      const fileList = await new Promise<FileList | null>((resolve) => {
        input.onchange = (e) => {
          const target = e.target as HTMLInputElement
          resolve(target?.files || null)
        }
        input.click()
      })

      if (!fileList) return

      filePaths = Array.from(fileList)
    }

    if (!filePaths.length) return

    // 处理选择的图片文件
    const newFiles = await Promise.all(
      filePaths.map(async (file) => {
        let url: string
        let path: string
        let originalName: string

        if (window.electronAPI) {
          // 使用新的API从主进程获取图片数据
          const base64Data = await window.electronAPI.readImageFile(file)
          url = base64Data // 直接返回base64数据URL
          path = file
          originalName = file.split("/").pop() || ""
        } else {
          // Web环境
          url = URL.createObjectURL(file as File)
          path = file.path || ""
          originalName = (file as File).name
        }

        return {
          path,
          originalName,
          url,
          ocrText: "",
          newName: "",
          ocrLoading: false,
          aiLoading: false,
        }
      })
    )

    // 添加到图片列表
    imageFiles.value = [...imageFiles.value, ...newFiles]
    ElMessage.success(`成功添加${newFiles.length}张图片`)
  } catch (error) {
    console.error("选择图片失败:", error)
    ElMessage.error("选择图片失败")
  }
}

// 执行OCR识别
async function performOCR(file) {
  if (file.ocrLoading) return

  file.ocrLoading = true

  try {
    // 创建Tesseract Worker
    const worker = await createWorker("chi_sim+eng")

    // 执行OCR识别
    const { data } = await worker.recognize(file.url)
    file.ocrText = data.text.trim()

    // 释放Worker
    await worker.terminate()

    ElMessage.success("OCR识别完成")
  } catch (error) {
    console.error("OCR识别失败:", error)
    ElMessage.error("OCR识别失败")
  } finally {
    file.ocrLoading = false
  }
}

// 生成AI智能文件名
async function generateAIName(file) {
  if (file.aiLoading || !file.ocrText) return

  file.aiLoading = true

  try {
    // 这里应该调用DeepSeek AI API，由于需要API密钥，这里使用模拟数据
    // 实际项目中，应该替换为真实的API调用
    // const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
    //   model: 'deepseek-chat',
    //   messages: [
    //     { role: 'system', content: '你是一个专业的图片命名助手，请根据提供的OCR文本，生成一个简洁、有意义的文件名。' },
    //     { role: 'user', content: `OCR文本：${file.ocrText}` }
    //   ]
    // }, {
    //   headers: {
    //     'Authorization': `Bearer ${API_KEY}`,
    //     'Content-Type': 'application/json'
    //   }
    // })
    // file.newName = response.data.choices[0].message.content.trim()

    // 模拟API调用延迟
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 生成简单的文件名（实际项目中应替换为AI生成的结果）
    const keywords = file.ocrText
      .split(/\s+/)
      .filter((word) => word.length > 1)
      .slice(0, 3)
    file.newName = keywords.join("_") || "未命名"

    // 添加原始文件扩展名
    const extension = file.originalName.split(".").pop()
    if (extension) {
      file.newName = `${file.newName}.${extension}`
    }

    ElMessage.success("AI命名完成")
  } catch (error) {
    console.error("AI命名失败:", error)
    ElMessage.error("AI命名失败")
  } finally {
    file.aiLoading = false
  }
}

// 保存重命名后的图片
async function saveRenamedImages() {
  if (!hasRenamedImages.value) return

  const filesToSave = imageFiles.value.filter((file) => file.newName)
  const loading = ElLoading.service({
    lock: true,
    text: "正在保存文件...",
    background: "rgba(0, 0, 0, 0.7)",
  })

  try {
    let result: SaveResult

    if (window.electronAPI) {
      // Electron环境
      const imageList = imageFiles.value.map((file) => ({
        path: file.path,
        newName: file.newName,
      }))
      console.log(`准备保存以下文件：`, imageList)
      result = await window.electronAPI.saveRenamedImages(imageList)
    } else {
      // Web环境 - 提供下载链接
      for (const file of filesToSave) {
        const link = document.createElement("a")
        link.href = file.url
        link.download = file.newName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      result = { success: true, message: "文件已下载完成" }
    }

    if (result.success) {
      ElMessage.success(result.message || "文件保存成功")

      // 如果有详细结果，显示成功和失败的文件信息
      if (result.results && result.results.length > 0) {
        const failedFiles = result.results.filter((r) => !r.success)
        if (failedFiles.length > 0) {
          console.warn("部分文件保存失败:", failedFiles)
          // 可以在这里添加更详细的失败文件提示，例如使用ElNotification显示失败列表
        }
      }
    } else {
      ElMessage.error(result.message || "保存失败")
    }
  } catch (error) {
    console.error("保存文件失败:", error)
    ElMessage.error("保存文件失败: " + (error.message || error))
  } finally {
    loading.close()
  }
}

// 清空图片列表
function clearImages() {
  // 释放URL对象
  imageFiles.value.forEach((file) => {
    if (!window.electronAPI && file.url) URL.revokeObjectURL(file.url)
  })

  // 清空列表
  imageFiles.value = []
  ElMessage.info("已清空图片列表")
}
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.app-header {
  background-color: #409eff;
  color: white;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
}

.app-header p {
  margin: 10px 0 0;
  font-size: 16px;
  opacity: 0.9;
}

.main-content {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.upload-area {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.image-list {
  margin-top: 20px;
}

.image-preview-container {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: pointer;
}

.ocr-text-container {
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  line-height: 1.5;
  padding: 4px 0;
}

.new-name-container {
  padding: 4px 0;
}

.loading-container {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #909399;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.empty-tip {
  padding: 40px 0;
  text-align: center;
}

.app-footer {
  background-color: #f0f2f5;
  padding: 15px;
  text-align: center;
  color: #606266;
  font-size: 14px;
  border-top: 1px solid #e4e7ed;
}

.app-footer a {
  color: #409eff;
  text-decoration: none;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .main-content {
    padding: 10px;
  }

  .image-preview-container {
    width: 60px;
    height: 60px;
  }
}
</style>
