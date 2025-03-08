import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isElectron = mode === 'electron'

  return {
    plugins: [
      vue(),
      isElectron && electron([
        {
          // Main process
          entry: 'electron/main/index.js',
          onstart(options) {
            options.startup()
          },
        },
        {
          // Preload process
          entry: 'electron/preload/index.js',
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
      isElectron && renderer(),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      host: '0.0.0.0',
    },
    // css: {
    //   preprocessorOptions: {
    //     scss: {
    //       additionalData: `@use "@/styles/variables.scss" as *;`
    //     }
    //   },
    //   // 确保CSS被正确提取和处理
    //   extract: true,
    // },
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
