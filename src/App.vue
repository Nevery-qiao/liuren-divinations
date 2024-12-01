<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'

const router = useRouter()

const handleResize = () => {
  const isMobile = window.innerWidth < 768
  const currentPath = router.currentRoute.value.path
  
  console.log('[App] Window resized:', {
    width: window.innerWidth,
    isMobile,
    currentPath
  })
  
  // 如果是移动端尺寸但在桌面路由
  if (isMobile && currentPath === '/') {
    console.log('[App] Switching to mobile view')
    router.push('/mobile')
  }
  // 如果是桌面尺寸但在移动路由
  else if (!isMobile && currentPath.startsWith('/mobile')) {
    console.log('[App] Switching to desktop view')
    router.push('/')
  }
}

// 添加防抖，避免频繁触发路由切换
const debounce = (fn: Function, delay: number) => {
  let timeoutId: number | null = null
  return function (...args: any[]) {
    if (timeoutId) {
      window.clearTimeout(timeoutId)
    }
    timeoutId = window.setTimeout(() => {
      fn.apply(null, args)
      timeoutId = null
    }, delay)
  }
}

const debouncedResize = debounce(handleResize, 250)

onMounted(() => {
  window.addEventListener('resize', debouncedResize)
  // 初始检查
  handleResize()
})

onUnmounted(() => {
  window.removeEventListener('resize', debouncedResize)
})
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

#app {
  height: 100vh;
  width: 100vw;
  margin: 0;
  overflow: hidden;
  background-color: #fff9e7;
}

.app-container {
  height: 100%;
  width: 100%;
  position: relative;
  background: #fff;
}
</style>
