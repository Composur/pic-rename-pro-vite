import { createApp } from 'vue'
import ElementPlus from 'element-plus'
// 导入全局样式文件，它已经包含了Element Plus的样式
import '@/styles/global.scss'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'

// 创建Vue应用实例
const app = createApp(App)

// 使用插件
app.use(ElementPlus)
app.use(router)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 挂载应用
app.mount('#app')