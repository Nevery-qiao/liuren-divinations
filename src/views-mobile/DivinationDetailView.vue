<template>
  <div class="divination-detail-view">
    <div class="header">
      <el-button class="back-btn" @click="router.back()">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <h1>占卜结果</h1>
      <el-button class="action-btn" @click="showDeleteConfirm = true">
        <el-icon><Delete /></el-icon>
      </el-button>
    </div>
    <div class="content" v-if="currentHistory">
      <div class="divination-info" @click="showEditDialog = true">
        <span class="emoji">{{ currentHistory.emoji || '🔮' }}</span>
        <span class="question">{{ currentHistory.question || '点击添加问题' }}</span>
      </div>
      <div class="time-info">
        <div class="lunar-time">{{ currentHistory.result?.data?.lunar_time }}</div>
        <div class="solar-time">{{ dayjs(currentHistory.timestamp).format('YYYY年MM月DD日 HH:mm') }}</div>
      </div>
      <m-liuren-pan :history="currentHistory" />
      <divination-notes
        v-model="notes"
        @save="handleNotesSave"
      />
    </div>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑占卜"
      width="90%"
      :show-close="false"
      class="edit-dialog"
    >
      <div class="edit-form">
        <div class="emoji-picker">
          <span 
            v-for="emoji in emojiList" 
            :key="emoji"
            :class="{ active: editForm.emoji === emoji }"
            @click="editForm.emoji = emoji"
          >
            {{ emoji }}
          </span>
        </div>
        <el-input
          v-model="editForm.question"
          placeholder="请输入占卜问题"
        />
      </div>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认弹窗 -->
    <m-action-sheet
      v-model="showDeleteConfirm"
      message="确定要删除这条占卜记录吗？"
      danger-action="删除"
      @danger-action="confirmDelete"
    />

  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Delete } from '@element-plus/icons-vue'
import { useHistoryStore } from '../stores/history'
import MLiurenPan from '../components-mobile/MLiurenPan.vue'
import MActionSheet from '../components-mobile/MActionSheet.vue'
import DivinationNotes from '../components/DivinationNotes.vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const historyStore = useHistoryStore()

// 预设表情列表
const emojiList = ['🔮', '💫', '⭐️', '🌟', '✨', '🌙', '☀️', '⚡️', '🎯', '🎲']

// 编辑相关状态
const showEditDialog = ref(false)
const showDeleteConfirm = ref(false)
const editForm = ref({
  emoji: '',
  question: ''
})

// 根据路由参数获取当前卦象
const currentHistory = computed(() => {
  const id = route.params.id as string
  return historyStore.historyList.find(h => h.id === id)
})

// 笔记状态管理
const notes = ref('')

// 监听 currentHistory 变化，更新笔记内容
watch(currentHistory, (newHistory) => {
  if (newHistory) {
    notes.value = newHistory.notes || ''
    // 同步编辑表单
    editForm.value = {
      emoji: newHistory.emoji || '🔮',
      question: newHistory.question || ''
    }
  }
}, { immediate: true })

// 处理笔记保存
const handleNotesSave = (value: string) => {
  if (!currentHistory.value) return
  
  const updatedHistory = {
    ...currentHistory.value,
    notes: value
  }
  
  historyStore.updateHistory(updatedHistory)
}

// 处理编辑保存
const handleSaveEdit = () => {
  if (!currentHistory.value) return
  
  const updatedHistory = {
    ...currentHistory.value,
    emoji: editForm.value.emoji,
    question: editForm.value.question
  }
  
  historyStore.updateHistory(updatedHistory)
  showEditDialog.value = false
  ElMessage({
    type: 'success',
    message: '保存成功'
  })
}

// 确认删除
const confirmDelete = () => {
  historyStore.deleteHistory(currentHistory.value.id)
  ElMessage({
    type: 'success',
    message: '删除成功'
  })
  router.back()
  showDeleteConfirm.value = false
}

// 刷新占卜信息
const loading = ref(false)
async function refreshDivination() {
  if (!currentHistory.value) return;
  
  try {
    loading.value = true;
    // 格式化时间为 MM-DD HH:mm 格式
    const time = dayjs(currentHistory.value.time).format('MM-DD HH:mm');
    console.log('Formatted time:', time);
    
    const result = await getDivinationInfo({
      number: currentHistory.value.number.toString(),
      time: time
    });
    
    if (result.code === 0 && result.data) {
      // 更新历史记录
      currentHistory.value.result = result.data;
      historyStore.updateHistory(currentHistory.value);
    } else {
      ElMessage.error(result.msg || '刷新占卜信息失败');
    }
  } catch (error) {
    console.error('[DivinationDetailView] Failed to refresh divination:', error);
    ElMessage.error(error instanceof Error ? error.message : '刷新占卜信息失败');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.divination-detail-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #fff9e7;
}

.header {
  padding: 8px 16px;
  background-color: #fff;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header h1 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #000;
  flex: 1;
  text-align: center;
}

.back-btn, .action-btn {
  padding: 8px;
  color: #666;
}

.back-btn {
  margin-left: -8px;
}

.action-btn {
  margin-right: -8px;
}

.action-btn :deep(.el-icon) {
  font-size: 18px;
  width: 1em;
  height: 1em;
  color: #ff3b30;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.divination-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
}

.emoji {
  font-size: 24px;
}

.question {
  font-size: 17px;
  font-weight: 600;
  color: #1a1a1a;
}

.time-info {
  margin-bottom: 12px;
  text-align: center;
}

.lunar-time {
  font-size: 16px;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.solar-time {
  font-size: 14px;
  color: #666;
}

.edit-dialog {
  --el-dialog-padding-primary: 16px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.emoji-picker {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.emoji-picker span {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.emoji-picker span.active {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.el-dialog__body) {
  padding-top: 8px;
  padding-bottom: 8px;
}
</style>
