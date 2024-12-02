<template>
  <div class="m-history-list">
    <template v-for="group in groupedHistories" :key="group.title">
      <div class="history-group">
        <div class="group-title">{{ group.title }}</div>
        <div class="history-items">
          <div
            v-for="item in group.items"
            :key="item.id"
            class="history-item"
            :class="{ active: item.id === selectedId }"
            @click="handleSelect(item)"
          >
            <div class="item-content">
              <div class="item-emoji">{{ item.emoji || '🔮' }}</div>
              <div class="item-info">
                <div class="item-question">【{{ item.number }}】{{ item.question || '点击添加问题' }}</div>
                <div class="item-time">{{ formatTime(item.timestamp) }}</div>
              </div>
            </div>
            <el-dropdown 
              trigger="click" 
              @command="command => handleCommand(command, item)"
              class="action-dropdown"
              @click.stop
            >
              <div class="action-btn" @click.stop>
                <el-icon><MoreFilled /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="delete" class="danger-item">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </template>
    
    <!-- 删除确认 Action Sheet -->
    <m-action-sheet
      v-model="showDeleteConfirm"
      title="提示"
      message="确定要删除这条占卜记录吗？"
      danger-action="删除"
      @danger-action="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElIcon } from 'element-plus'
import { Delete, Share, Star, MoreFilled } from '@element-plus/icons-vue'
import { useHistoryStore } from '../stores/history'
import type { DivinationHistory } from '../types/divination'
import MActionSheet from './MActionSheet.vue'
import { formatTime } from '../utils/time'
import { groupHistoryByTime } from '../utils/history'

const router = useRouter()
const historyStore = useHistoryStore()
const historyList = computed(() => historyStore.historyList)
const selectedId = ref<string | null>(null)
const showDeleteConfirm = ref(false)
const pendingDeleteItem = ref<DivinationHistory | null>(null)

const groupedHistories = computed(() => groupHistoryByTime(historyList.value))

const handleSelect = (item: DivinationHistory) => {
  selectedId.value = item.id
  router.push(`/mobile/divination/${item.id}`)
}

const handleCommand = (command: string, item: DivinationHistory) => {
  if (command === 'delete') {
    pendingDeleteItem.value = item
    showDeleteConfirm.value = true
  }
}

const confirmDelete = () => {
  if (pendingDeleteItem.value) {
    historyStore.deleteHistory(pendingDeleteItem.value.id)
    ElMessage({
      type: 'success',
      message: '删除成功'
    })
    pendingDeleteItem.value = null
  }
}
</script>

<style scoped>
.m-history-list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background-color: #a68b6c;
  padding: 16px;
}

.history-group {
  margin-bottom: 24px;
}

.history-group:last-child {
  margin-bottom: 0;
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
  padding: 12px;
  background: #ffffff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.history-item.active {
  background: #e8f4ff;
  border-left-color: #409eff;
}

.item-content {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.item-emoji {
  font-size: 20px;
  margin-right: 12px;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-question {
  font-size: 15px;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.active .item-question {
  color: #409eff;
  font-weight: 500;
}

.item-time {
  font-size: 12px;
  color: #999;
}

.action-dropdown {
  margin-left: 8px;
}

.action-btn {
  padding: 8px;
  color: #666;
}

.action-btn :deep(.el-icon) {
  font-size: 20px;
}

:deep(.danger-item) {
  color: #ff4d4f;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
}

:deep(.el-dropdown-menu__item .el-icon) {
  margin: 0;
}
</style>
