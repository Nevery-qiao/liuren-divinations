<template>
  <el-drawer
    v-model="visible"
    direction="btt"
    size="auto"
    :show-close="false"
    :with-header="false"
    destroy-on-close
    @opened="handleOpened"
  >
    <div class="drawer-content">
      <!-- 顶栏 -->
      <div class="drawer-header">
        <span class="cancel-btn" @click="handleCancel">取消</span>
        <span class="title">启卦</span>
        <span class="confirm-btn" @click="handleConfirm">确定</span>
      </div>

      <!-- 输入区域 -->
      <div class="drawer-body">
        <div class="input-row">
          <span class="label">占数</span>
          <el-input
            v-model="divinationNumber"
            type="number"
            :min="1"
            placeholder="请输入占数"
            class="input-field"
            ref="numberInputRef"
          />
        </div>
        <div class="input-row">
          <span class="label">时间</span>
          <el-input
            v-model="divinationTime"
            placeholder="MM-DD HH:mm"
            class="input-field"
          />
        </div>
        <div class="input-row">
          <span class="label">问题</span>
          <el-input
            v-model="question"
            type="textarea"
            :rows="2"
            placeholder="请输入你想问的问题（选填）"
            class="input-field"
          />
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import type { InputInstance } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: { number: number; time: string; question?: string }): void
}>()

const visible = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const numberInputRef = ref<InputInstance>()
const divinationNumber = ref('')
const divinationTime = ref('')
const question = ref('')

const handleOpened = () => {
  nextTick(() => {
    // 设置默认时间为当前时间
    divinationTime.value = dayjs().format('MM-DD HH:mm')
    numberInputRef.value?.focus()
  })
}

const handleCancel = () => {
  resetForm()
  visible.value = false
}

const handleConfirm = () => {
  // 验证占数
  if (!divinationNumber.value) {
    ElMessage.warning('请输入占数')
    return
  }
  const number = parseInt(divinationNumber.value)
  if (isNaN(number) || number < 1) {
    ElMessage.warning('占数必须是大于等于1的整数')
    return
  }

  // 验证并格式化时间
  const timeStr = divinationTime.value.trim()
  if (!timeStr) {
    ElMessage.warning('请输入时间')
    return
  }
  const time = dayjs(timeStr, 'MM-DD HH:mm')
  if (!time.isValid()) {
    ElMessage.warning('请输入正确的时间格式，如：06-01 13:30')
    return
  }

  // 发送确认事件
  emit('confirm', {
    number,
    time: time.format('YYYY-MM-DD HH:mm:00'),
    question: question.value.trim()
  })

  // 重置表单并关闭
  resetForm()
  visible.value = false
}

const resetForm = () => {
  divinationNumber.value = ''
  divinationTime.value = dayjs().format('MM-DD HH:mm')
  question.value = ''
}
</script>

<style>
/* 使用全局样式和更具体的选择器来确保覆盖 Element Plus 的默认样式 */
.el-drawer.btt .el-drawer__body {
  padding: 0 !important;
  height: 100%;
}
</style>

<style scoped>
.drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 44px;
  border-bottom: 1px solid #eee;
}

.drawer-header .title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.drawer-header .cancel-btn,
.drawer-header .confirm-btn {
  font-size: 14px;
  color: #409EFF;
  padding: 12px 0;
}

.drawer-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.input-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.input-row:last-child {
  margin-bottom: 0;
}

.label {
  width: 50px;
  padding-top: 6px;
  font-size: 14px;
  color: #333;
}

.input-field {
  flex: 1;
  margin-left: 12px;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  box-shadow: none !important;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover) {
  border-color: #c0c4cc;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus) {
  border-color: #409EFF;
}
</style>
