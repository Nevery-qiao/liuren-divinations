import { ref, onMounted, onUnmounted } from 'vue'

export function useDeviceType() {
  const isMobile = ref(false)
  
  const checkDevice = () => {
    const width = window.innerWidth
    isMobile.value = width < 768
    console.log('[useDeviceType] Window width:', width, 'isMobile:', isMobile.value)
  }
  
  onMounted(() => {
    console.log('[useDeviceType] Component mounted')
    checkDevice()
    window.addEventListener('resize', checkDevice)
  })
  
  onUnmounted(() => {
    console.log('[useDeviceType] Component unmounted')
    window.removeEventListener('resize', checkDevice)
  })
  
  return {
    isMobile
  }
}
