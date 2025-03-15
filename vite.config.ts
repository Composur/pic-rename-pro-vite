import { defineConfig, UserConfig, ConfigEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'
import path from 'path'
import {
  collectMainProcessEntries,
  getMainProcessConfig,
  getPreloadConfig,
  getBuildConfig
} from './build/vite-config-utils'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }: ConfigEnv): UserConfig => {
  const isElectron = mode === 'electron'
  const mainDir = path.resolve(__dirname, 'electron/main')
  const mainProcessEntries = collectMainProcessEntries(mainDir)

  return {
    plugins: [
      vue(),
      isElectron && electron([
        getMainProcessConfig(mainProcessEntries),
        getPreloadConfig()
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
    build: getBuildConfig()
  }
})