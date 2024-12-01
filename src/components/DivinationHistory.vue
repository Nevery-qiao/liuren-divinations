<template>
  <div class="history-container">
    <div class="history-scroll">
      <template v-for="group in groupedHistories" :key="group.title">
        <div class="history-group">
          <div class="group-title">{{ group.title }}</div>
          <div class="history-items">
            <div 
              v-for="item in group.items" 
              :key="item.id"
              class="history-item"
              :class="{ 'history-item-active': item.id === currentHistoryId }"
              @click="$emit('select', item)"
            >
              <div class="history-item-content">
                <span class="emoji" v-if="item.emoji">{{ item.emoji }}</span>
                <span class="question">【{{ item.number }}】{{ item.question || '点击添加问题' }}</span>
              </div>
              <el-button 
                class="delete-btn" 
                type="danger" 
                :icon="Delete" 
                circle 
                size="small"
                @click.stop="handleDelete(item)"
              />
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, h } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { DivinationHistory } from '../types/divination'
import { groupHistoryByTime } from '../utils/history'
import NewDivinationInput from './NewDivinationInput.vue'

defineOptions({
  name: 'DivinationHistoryComponent'
})

const props = defineProps<{
  histories: DivinationHistory[]
  currentHistoryId?: string
}>()

const emit = defineEmits<{
  (e: 'select', history: DivinationHistory): void
  (e: 'delete', id: string): void
  (e: 'restore', history: DivinationHistory): void
  (e: 'new', history: DivinationHistory): void
}>()

const groupedHistories = computed(() => {
  return groupHistoryByTime(props.histories || [])
})

// 存储待删除的历史记录
const deletedHistory = ref<{ id: string, data: DivinationHistory } | null>(null)
let deleteTimeout: number | null = null

const handleDelete = (history: DivinationHistory) => {
  // 存储被删除的记录
  deletedHistory.value = {
    id: history.id,
    data: { ...history }
  }
  
  // 立即触发删除
  emit('delete', history.id)

  // 显示可撤销的消息
  ElMessage({
    message: h('div', { class: 'undo-message' }, [
      h('span', '记录已删除 '),
      h('button', {
        class: 'undo-button',
        onClick: () => {
          if (deletedHistory.value) {
            // 触发恢复事件
            emit('restore', deletedHistory.value.data)
            deletedHistory.value = null
            if (deleteTimeout) {
              clearTimeout(deleteTimeout)
              deleteTimeout = null
            }
          }
        }
      }, '撤销')
    ]),
    duration: 4000,
    showClose: true,
    customClass: 'undo-toast',
    onClose: () => {
      deletedHistory.value = null
    }
  })
}

const handleNewDivination = (history: DivinationHistory) => {
  emit('new', history)
}
</script>

<style scoped>
.history-container {
  height: 100%;
  overflow: hidden;
  background-color: #a68b6c;
}

.history-scroll {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.history-group {
  margin-bottom: 24px;
}

.group-title {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 8px;
  padding-left: 4px;
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.history-item:hover:not(.history-item-active) {
  background: #f5f7fa;
  transform: translateX(4px);
}

.history-item-active {
  background: #e8f4ff !important;
  border-left: 4px solid #409eff;
  transform: translateX(4px);
}

.history-item-active .history-item-content {
  color: #409eff;
}

.history-item-active .question {
  color: #409eff;
  font-weight: 500;
}

.history-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.emoji {
  font-size: 16px;
  line-height: 1;
}

.question {
  font-size: 14px;
  color: #303133;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.3s;
}

.history-item:hover .delete-btn {
  opacity: 1;
}
</style>
