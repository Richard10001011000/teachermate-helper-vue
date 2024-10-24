<template>
  <div>
    <SignIn></SignIn>
  </div>
</template>

<script setup>
import SignIn from './components/SignIn.vue';
</script>

<style >
body{
      margin: 0; /* 外边距 */
      padding: 0; /* 内边距 */
      border: 0; /* 边框 */
}

.toastify-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.toastify {
  background-color: rgba(255, 255, 255, 0.9); /* 背景颜色带透明度 */
  border: 1px solid rgba(0, 0, 0, 0.1); /* 边框带透明度 */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* 阴影效果 */
  border-radius: 10px; /* 圆角 */
  padding: 20px; /* 内边距 */
  text-align: center; /* 文本居中 */
  max-width: 500px; /* 最大宽度 */
  z-index: 9999; /* 确保弹窗在最上层 */
}
</style>
