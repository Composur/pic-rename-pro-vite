import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'
import path from 'path'
import fs from 'fs'
import copy from 'rollup-plugin-copy'

// 递归收集目录下的所有 JS 文件
function collectMainProcessEntries() {
  const mainDir = path.resolve(__dirname, 'electron/main')
  const entries = {}

  // 递归函数，用于遍历目录
  function traverseDir(dir, baseDir = '') {
    const files = fs.readdirSync(dir)

    files.forEach(file => {
      const fullPath = path.join(dir, file)
      const relativePath = path.join(baseDir, file)
      const stats = fs.statSync(fullPath)

      if (stats.isDirectory()) {
        // 递归处理子目录
        traverseDir(fullPath, relativePath)
      } else if (file.endsWith('.js') || file.endsWith('.ts')) {
        // 添加 JS/TS 文件作为入口
        const entryName = relativePath.replace(/\.(js|ts)$/, '')
        entries[entryName] = resolve(mainDir, relativePath)
      }
    })
  }

  traverseDir(mainDir)
  return entries
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isElectron = mode === 'electron'
  const mainProcessEntries = collectMainProcessEntries()

  return {
    plugins: [
      vue(),
      isElectron && electron([
        {
          // Main process
          entry: 'electron/main/index.ts',
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                input: mainProcessEntries,
                output: {
                  entryFileNames: '[name].js',
                  preserveModules: true, // 保留所有模块
                  preserveModulesRoot: path.resolve(__dirname, 'electron/main'), // 绝对路径
                  format: 'cjs', // 输出格式为 CommonJS
                },
                plugins: [
                  copy({
                    targets: [
                      {
                        src: 'electron/main/assets/*',
                        dest: 'dist-electron/assets'
                      }
                    ],
                    hook: 'writeBundle'
                  })
                ]
              },
            }
          }
        },
        {
          // Preload process
          entry: 'electron/preload/index.ts',
          vite: {
            build: {
              outDir: 'dist-electron/preload',
              rollupOptions: {
                output: {
                  entryFileNames: 'index.js'
                }
              }
            }
          }
        }
      ]),
      isElectron && renderer()
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      host: '0.0.0.0',
    },
    build: {
      // 确保样式文件被正确打包
      cssCodeSplit: true,
      // 改进CSS的处理
      cssTarget: 'chrome80',
      // 确保样式在生产环境中被正确压缩
      minify: 'terser',
    }
  }
})