import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin, swcPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@common': resolve('src/common'),
        '@main': resolve('src/main')
      }
    },
    plugins: [externalizeDepsPlugin(), swcPlugin()],
    build: {
      rollupOptions: {
        external: ['index.node']
        // input: {
        //   main: resolve('src/main/index.ts'),
        //   extensions: resolve('src/extensions/index.ts')
        // },
        // output: {
        //   // dir: 'out', // 输出目录
        //   entryFileNames: (chunkInfo) => {
        //     // 根据入口文件来决定输出的文件夹
        //     if (chunkInfo.name === 'main') {
        //       return 'index.js'
        //     } else if (chunkInfo.name === 'extensions') {
        //       return '../extensions/index.js'
        //     }
        //     return '[name].js'
        //   }
        // }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.js'),
          // extension: resolve(__dirname, 'src/preload/extension.js'),
          plugin: resolve(__dirname, 'src/preload/plugin.js')
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@common': resolve('src/common'),
        '@renderer': resolve('src/renderer/src'),
        '@main': resolve('src/main')
      }
    },
    plugins: [vue(), tailwindcss()]
  }
})
