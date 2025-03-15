import path from 'path'
import fs from 'fs'
import type { UserConfig } from 'vite'
/**
 * 递归收集目录下的所有 JS/TS 文件作为入口
 * @param mainDir 主进程目录路径
 * @returns 入口文件映射对象
 */
export function collectMainProcessEntries(mainDir: string) {
  const entries: Record<string, string> = {}

  function traverseDir(dir: string, baseDir = '') {
    const files = fs.readdirSync(dir)

    files.forEach(file => {
      const fullPath = path.join(dir, file)
      const relativePath = path.join(baseDir, file)
      const stats = fs.statSync(fullPath)

      if (stats.isDirectory()) {
        traverseDir(fullPath, relativePath)
      } else if (file.endsWith('.js') || file.endsWith('.ts')) {
        const entryName = relativePath.replace(/\.(js|ts)$/, '')
        entries[entryName] = path.resolve(mainDir, relativePath)
      }
    })
  }

  traverseDir(mainDir)
  return entries
}

/**
 * 获取 Electron 主进程构建配置
 * @param mainProcessEntries 主进程入口文件映射
 * @returns Electron 主进程构建配置
 */
export function getMainProcessConfig(mainProcessEntries: Record<string, string>) {
  return {
    entry: 'electron/main/index.ts',
    vite: {
      build: {
        outDir: 'dist-electron',
        rollupOptions: {
          input: mainProcessEntries,
          output: {
            entryFileNames: '[name].js',
            preserveModules: true,
            preserveModulesRoot: path.resolve(process.cwd(), 'electron/main'),
            format: 'cjs',
          },
          plugins: [
            require('rollup-plugin-copy')({
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
  }
}

/**
 * 获取 Electron 预加载进程构建配置
 * @returns Electron 预加载进程构建配置
 */
export function getPreloadConfig() {
  return {
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
}

/**
 * 获取生产环境构建配置
 * @returns 生产环境构建配置
 */
export function getBuildConfig(): UserConfig['build'] {
  return {
    cssCodeSplit: true,
    cssTarget: 'chrome80',
    minify: 'terser',
  }
}