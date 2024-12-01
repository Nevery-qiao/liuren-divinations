<!-- 移动端 Action Sheet 组件 -->
<template>
  <div 
    class="action-sheet-overlay"
    :class="{ 'action-sheet-overlay-visible': modelValue }"
    @click="$emit('update:modelValue', false)"
  >
    <div 
      class="action-sheet-container"
      :class="{ 'action-sheet-container-visible': modelValue }"
      @click.stop
    >
      <div class="action-sheet-content">
        <div class="action-sheet-header">
          <div class="action-sheet-message">{{ message }}</div>
        </div>
        <div class="action-sheet-buttons">
          <button 
            v-if="dangerAction"
            class="action-sheet-button action-sheet-button-danger"
            @click="handleDangerAction"
          >
            {{ dangerAction }}
          </button>
          <button 
            class="action-sheet-button action-sheet-button-cancel"
            @click="$emit('update:modelValue', false)"
          >
            {{ cancelText || '取消' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  message?: string
  dangerAction?: string
  cancelText?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'danger-action'): void
}>()

const handleDangerAction = () => {
  emit('danger-action')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.action-sheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0);
  transition: background-color 0.3s;
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  visibility: hidden;
}

.action-sheet-overlay-visible {
  background-color: rgba(0, 0, 0, 0.4);
  visibility: visible;
}

.action-sheet-container {
  width: 100%;
  padding: 8px;
  transform: translateY(100%);
  transition: transform 0.3s;
}

.action-sheet-container-visible {
  transform: translateY(0);
}

.action-sheet-content {
  background: rgba(248, 248, 248, 0.95);
  border-radius: 13px;
  overflow: hidden;
}

.action-sheet-header {
  padding: 20px 16px;
  text-align: center;
}

.action-sheet-message {
  font-size: 15px;
  font-weight: 500;
  color: #000;
  line-height: 1.4;
}

.action-sheet-buttons {
  display: flex;
  flex-direction: column;
}

.action-sheet-button {
  height: 56px;
  border: none;
  background: #fff;
  font-size: 20px;
  font-weight: 400;
  padding: 0;
  margin: 0;
  cursor: pointer;
  position: relative;
}

.action-sheet-button::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.1);
}

.action-sheet-button:active {
  background-color: rgba(0, 0, 0, 0.1);
}

.action-sheet-button-danger {
  color: #ff3b30;
}

.action-sheet-button-cancel {
  color: #007aff;
  margin-top: 8px;
  border-radius: 13px;
}

.action-sheet-button-cancel::after {
  display: none;
}
</style>
