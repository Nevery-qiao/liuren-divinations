<template>
  <div class="new-divination">
    <!-- 新建按钮 -->
    <div class="add-button" ref="addButtonRef" @click.stop="toggleInput" v-if="!showInput">
      <el-icon><Plus /></el-icon>
    </div>

    <!-- 输入区域 -->
    <div v-if="showInput" class="input-area" ref="inputAreaRef" @click.stop>
      <div class="input-group">
        <el-input
          v-model="divinationNumber"
          type="number"
          :min="1"
          :max="100"
          placeholder="占数"
          @keyup.enter="handleConfirm"
          ref="numberInput"
        />
      </div>
      <div class="input-group">
        <el-input
          v-model="divinationTime"
          placeholder="时间"
          @keyup.enter="handleConfirm"
        />
      </div>
      <div class="button-group">
        <el-button type="primary" size="small" @click="handleConfirm">确定</el-button>
        <el-button size="small" @click="hideInput">取消</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const emit = defineEmits<{
  (e: 'confirm', data: { number: number; time: string }): void
}>()

const showInput = ref(false)
const divinationNumber = ref('')
const divinationTime = ref('')
const numberInput = ref()
const inputAreaRef = ref<HTMLElement | null>(null)
const addButtonRef = ref<HTMLElement | null>(null)

// 切换输入区域显示状态
const toggleInput = () => {
  console.log('toggleInput called, current state:', showInput.value)
  showInput.value = !showInput.value
  
  if (showInput.value) {
    // 设置默认时间
    divinationTime.value = dayjs().format('MM-DD HH:mm')
    console.log('Default time set:', divinationTime.value)
    // 自动聚焦到占数输入框
    nextTick(() => {
      console.log('Focusing number input')
      numberInput.value?.focus()
    })
  }
}

// 隐藏输入区域
const hideInput = () => {
  console.log('hideInput called')
  showInput.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  console.log('resetForm called')
  divinationNumber.value = ''
  divinationTime.value = ''
}

// 确认提交
const handleConfirm = () => {
  console.log('handleConfirm called with:', {
    number: divinationNumber.value,
    time: divinationTime.value
  })

  if (!divinationNumber.value) {
    console.log('No divination number provided')
    ElMessage.warning('请输入占数')
    return
  }
  
  // 验证时间格式
  const timePattern = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):([0-5]\d)$/
  if (!timePattern.test(divinationTime.value)) {
    console.log('Invalid time format:', divinationTime.value)
    ElMessage.warning('请输入正确的时间格式：MM-DD HH:mm')
    return
  }

  console.log('Emitting confirm event with:', {
    number: parseInt(divinationNumber.value),
    time: divinationTime.value
  })

  emit('confirm', {
    number: parseInt(divinationNumber.value),
    time: divinationTime.value
  })
  
  hideInput()
}

// 点击外部处理函数
const handleClickOutside = (event: MouseEvent) => {
  console.log('handleClickOutside called')
  // 如果点击事件不是来自输入区域或添加按钮，并且输入区域正在显示，才隐藏
  if (showInput.value && 
      !inputAreaRef.value?.contains(event.target as Node) && 
      !addButtonRef.value?.contains(event.target as Node)) {
    hideInput()
  }
}

// 生命周期钩子
onMounted(() => {
  console.log('NewDivinationInput component mounted')
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  console.log('NewDivinationInput component unmounting')
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.new-divination {
  position: relative;
  display: inline-block;
}

.add-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.add-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.input-area {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 200px;
}

.input-group {
  margin-bottom: 12px;
}

.input-group:last-child {
  margin-bottom: 0;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
</style>
