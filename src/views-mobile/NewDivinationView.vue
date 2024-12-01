<template>
  <div class="new-divination-view">
    <div class="header">
      <div class="back-button" @click="router.back()">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <h1>新建卦象</h1>
    </div>
    <div class="content">
      <div class="form-container">
        <new-divination-input @confirm="handleSubmit" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useHistoryStore } from '../stores/history'
import NewDivinationInput from '../components/NewDivinationInput.vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import type { DivinationHistory } from '../types/divination'
import { getDivinationInfo } from '../api/liuren'
import { ElMessage } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'

const router = useRouter()
const historyStore = useHistoryStore()

const handleSubmit = async (data: { number: number; time: string }) => {
  console.log('Creating divination with:', data);
  try {
    const result = await getDivinationInfo({
      number: data.number,
      time: data.time
    });

    const history: DivinationHistory = {
      id: uuidv4(),
      time: new Date().toISOString(),
      timestamp: Date.now(),
      question: '',
      result,
      number: data.number,
    };

    historyStore.addHistory(history);
    router.push(`/mobile/divination/${history.id}`);
  } catch (error) {
    console.error('Error creating divination:', error);
    ElMessage.error('创建占卜失败，请重试');
  }
}
</script>

<style scoped>
.new-divination-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #fff9e7;
}

.header {
  padding: 1rem;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  position: relative;
}

.back-button {
  position: absolute;
  left: 1rem;
  cursor: pointer;
  padding: 0.5rem;
}

.header h1 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
  text-align: center;
  flex: 1;
}

.content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.form-container {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
}

:deep(.new-divination) {
  width: 100%;
}

:deep(.input-area) {
  position: static;
  box-shadow: none;
  padding: 0;
  margin: 0;
  min-width: auto;
}

:deep(.add-button) {
  display: none;
}
</style>
