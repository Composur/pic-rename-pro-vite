<template>
  <div class="about-container">
    <header class="about-header">
      <h1>关于 PicRenamePro</h1>
    </header>

    <main class="about-content">
      <el-card>
        <h2>📝 简介</h2>
        <p>
          PicRenamePro
          是一款强大的图片批量处理工具，专为提高图片管理效率而设计。它结合了 OCR
          文字识别技术和 DeepSeek AI
          智能分析，能够自动为您的图片生成有意义的文件名，让图片整理工作变得轻松高效。
        </p>

        <h2>✨ 功能特点</h2>
        <ul>
          <li>🖼️ <strong>批量处理</strong>：一次性上传并处理多张图片</li>
          <li>🔍 <strong>OCR 识别</strong>：自动提取图片中的文字内容</li>
          <li>
            🤖 <strong>AI 智能命名</strong>：基于图片内容生成有意义的文件名
          </li>
          <li>🔄 <strong>自动重命名</strong>：一键应用生成的文件名</li>
          <li>📊 <strong>进度可视化</strong>：实时显示处理进度</li>
          <li>
            💾 <strong>多格式支持</strong>：兼容 JPG、PNG、GIF、BMP、TIFF
            等主流图片格式
          </li>
        </ul>

        <h2>🛠️ 技术栈</h2>
        <ul>
          <li><strong>前端</strong>: Vue.js, electron-vite</li>
          <li><strong>后端</strong>: Node.js</li>
          <li><strong>AI 技术</strong>：DeepSeek AI API</li>
          <li><strong>OCR 引擎</strong>：Tesseract.js</li>
        </ul>

        <h2>💡 使用说明</h2>
        <ol>
          <li>点击"选择图片"按钮上传需要处理的图片</li>
          <li>对每张图片点击"OCR识别"按钮提取文字内容</li>
          <li>点击"AI命名"按钮生成智能文件名</li>
          <li>根据需要手动调整生成的文件名</li>
          <li>点击"保存重命名"按钮应用新文件名</li>
        </ol>

        <h2>🔄 运行模式</h2>
        <p>本项目可以使用 web 模式也可以使用 electron 模式：</p>
        <ul>
          <li><strong>Web 模式</strong>：通过浏览器访问，适合快速使用</li>
          <li>
            <strong>Electron 模式</strong
            >：作为桌面应用运行，提供更好的本地文件访问能力
          </li>
        </ul>

        <h2>📜 版权信息</h2>
        <p>© 2023 PicRenamePro - 保留所有权利</p>
      </el-card>
    </main>

    <footer class="about-footer">
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </footer>
  </div>
</template>

<script setup lang="ts">
// About.vue 是关于页面组件，展示应用的详细信息
</script>

<style scoped>
.about-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
  box-sizing: border-box;
}

.about-header {
  text-align: center;
  margin-bottom: 30px;
}

.about-header h1 {
  color: #409eff;
  font-size: 28px;
}

.about-content {
  flex: 1;
}

.about-content h2 {
  color: #409eff;
  margin-top: 25px;
  margin-bottom: 15px;
  font-size: 20px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}

.about-content p {
  line-height: 1.6;
  color: #606266;
  margin-bottom: 15px;
}

.about-content ul,
.about-content ol {
  padding-left: 20px;
  color: #606266;
  line-height: 1.8;
}

.about-content li {
  margin-bottom: 8px;
}

.about-footer {
  margin-top: 30px;
  text-align: center;
}
</style>
