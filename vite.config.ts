import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import electron from 'vite-plugin-electron/simple'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_LANGUAGE__: JSON.stringify(process.env.APP_LANGUAGE === 'en' ? 'en' : 'es'),
  },
  server: {
    watch: {
      ignored: ['**/release/**'],
    },
  },
  plugins: [
    {
      name: 'forma-document-language',
      transformIndexHtml(html) {
        return process.env.APP_LANGUAGE === 'en'
          ? html.replace('lang="es"', 'lang="en"').replace('Forma | Conversor de Imágenes', 'Forma | Image Converter')
          : html
      },
    },
    vue(),
    electron({
      main: {
        vite: {
          define: {
            __APP_LANGUAGE__: JSON.stringify(process.env.APP_LANGUAGE === 'en' ? 'en' : 'es'),
          },
        },
        // Shortcut of `build.lib.entry`.
        entry: 'electron/main.ts',
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`.
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: fileURLToPath(new URL('./electron/preload.ts', import.meta.url)),
      },
      // Ployfill the Electron and Node.js API for Renderer process.
      // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
      // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
      renderer: process.env.NODE_ENV === 'test'
        // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
        ? undefined
        : {},
    }),
  ],
})
