<template>
  <div class="history-list-view">
    <header class="header">
      <h1>六壬占卜</h1>
      <button class="new-divination-btn" @click="showDrawer = true">
        新建占卜
      </button>
    </header>
    <m-history-list />
    <m-new-divination-drawer
      v-model="showDrawer"
      @confirm="handleNewDivination"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useHistoryStore } from '../stores/history'
import { getMobileDivinationInfo } from '../api/liuren'
import MHistoryList from '../components-mobile/MHistoryList.vue'
import MNewDivinationDrawer from '../components-mobile/MNewDivinationDrawer.vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const historyStore = useHistoryStore()
const showDrawer = ref(false)

const handleNewDivination = async (data: { number: number; time: string; question?: string }) => {
  try {
    console.log('New divination:', data);
    
    // 获取占卜结果
    const result = await getMobileDivinationInfo({
      number: data.number,
      time: data.time
    });
    
    console.log('Got divination result:', result);
    
    if (result.code === 0 && result.data) {
      // 创建历史记录
      const history = {
        id: Date.now().toString(),
        number: data.number,
        time: data.time,
        question: data.question || '',
        timestamp: Date.now(),
        notes: '',
        result: {
          code: 0,
          data: result.data,
          msg: ''
        },
        hasResult: true
      }
      
      console.log('Created new history:', history);
      
      // 添加到历史记录并跳转
      historyStore.addHistory(history)
      router.push(`/mobile/divination/${history.id}`)
    } else {
      console.error('Invalid result:', result)
      ElMessage.error(result.msg || `获取占卜信息失败，错误代码：${result.code}`)
    }
  } catch (error) {
    console.error('Failed to get divination result:', error)
    ElMessage.error(error instanceof Error ? error.message : '获取占卜信息失败，请稍后重试')
  }
}
</script>

<style scoped>
.history-list-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  background: white;
}

.header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.new-divination-btn {
  padding: 8px 16px;
  border-radius: 20px;
  background: #4a5568;
  color: white;
  border: none;
  font-size: 14px;
  cursor: pointer;
}
</style>
