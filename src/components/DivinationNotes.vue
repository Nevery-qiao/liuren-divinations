<template>
  <div class="notes-container">
    <textarea
      :value="modelValue"
      class="custom-textarea"
      placeholder="在此输入占卜笔记..."
      @input="handleInput"
      @change="handleChange"
      @keydown.tab.prevent="handleTab"
      @keydown.enter="handleEnter"
      ref="textareaRef"
    ></textarea>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { PropType } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'save', value: string): void
}>()

const textareaRef = ref<HTMLTextAreaElement>()

// 处理输入事件
const handleInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

// 处理change事件，当失去焦点或按下回车时触发
const handleChange = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  emit('save', target.value)
}

// Tab 键支持
const handleTab = (e: KeyboardEvent) => {
  const textarea = textareaRef.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  
  // 插入制表符（或空格）
  const newValue = props.modelValue.substring(0, start) + '    ' + props.modelValue.substring(end)
  emit('update:modelValue', newValue)
  emit('save', newValue)
  
  // 移动光标位置
  textarea.value = newValue
  textarea.selectionStart = textarea.selectionEnd = start + 4
}

// 自动列表功能
const handleEnter = (e: KeyboardEvent) => {
  const textarea = textareaRef.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const currentLine = props.modelValue.substring(0, start).split('\n').pop() || ''
  
  // 检查是否在列表中
  if (currentLine.trim().startsWith('- ')) {
    e.preventDefault()
    // 如果是空列表项，结束列表
    if (currentLine.trim() === '- ') {
      const newValue = props.modelValue.substring(0, start - 2) + '\n' + props.modelValue.substring(start)
      emit('update:modelValue', newValue)
      emit('save', newValue)
      return
    }
    // 添加新的列表项
    const indent = currentLine.match(/^\s*/)?.[0] || ''
    const newValue = props.modelValue.substring(0, start) + '\n' + indent + '- ' + props.modelValue.substring(start)
    emit('update:modelValue', newValue)
    emit('save', newValue)
  }
}

// 监听外部值的变化，同步到 textarea
watch(() => props.modelValue, (newValue) => {
  if (textareaRef.value && textareaRef.value.value !== newValue) {
    textareaRef.value.value = newValue
  }
}, { immediate: true })
</script>

<style scoped>
.notes-container {
  padding: 10px;
  margin-bottom: 15px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
}

.custom-textarea {
  width: 100%;
  box-sizing: border-box;
  height: 170px;
  padding: 10px;
  border: none;
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  resize: none;
  overflow-y: auto;
  background: transparent;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  text-align: justify;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-width: 100%;
}

.custom-textarea::selection {
  background-color: rgba(64, 158, 255, 0.2);
  color: inherit;
}

.custom-textarea::-moz-selection {
  background-color: rgba(64, 158, 255, 0.2);
  color: inherit;
}

.custom-textarea:focus {
  outline: none;
}

.custom-textarea::placeholder {
  color: #909399;
}
</style>
