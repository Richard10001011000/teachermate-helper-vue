import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // server: {
  //   proxy: {
  //     '/wechat-api': {
  //       target: 'https://v18.teachermate.cn', // 目标地址
  //       changeOrigin: true, // 是否改变请求源
  //     },
  //   },
  // },
})
