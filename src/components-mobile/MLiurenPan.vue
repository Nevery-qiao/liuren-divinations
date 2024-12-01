<template>
  <div class="m-liuren-pan">
    <div class="gong-grid">
      <template v-for="i in [2, 3, 4, 1, 6, 5]" :key="i">
        <div 
          class="gong-item"
          :class="{
            'time-palace': getGongInfo(i).position === history.result?.data?.time_palace,
            'day-palace': getGongInfo(i).position === history.result?.data?.day_palace,
            'body-palace': getGongInfo(i).position === history.result?.data?.zishen_info?.zishen
          }"
        >
          <div class="gong-content">
            <div class="gong-position">{{ getGongInfo(i).position }}</div>
            <div class="gong-main">
              <div class="gong-left">
                <div class="gong-star">{{ getGongInfo(i).star }}</div>
                <div class="gong-branch">{{ getGongInfo(i).branch }}</div>
              </div>
              <div class="gong-center">
                <template v-if="getGongInfo(i).position === history.result?.data?.time_palace && 
                              getGongInfo(i).position === history.result?.data?.day_palace">
                  <div class="gong-center-text">
                    {{ history.result?.data?.divination_number }}<span class="body-text">身</span>
                  </div>
                </template>
                <template v-else-if="getGongInfo(i).position === history.result?.data?.time_palace">
                  <div class="gong-center-text">
                    {{ history.result?.data?.divination_number }}
                  </div>
                </template>
                <template v-else-if="getGongInfo(i).position === history.result?.data?.day_palace">
                  <div class="gong-center-text">
                    <span class="body-text">身</span>
                  </div>
                </template>
              </div>
              <div class="gong-right">
                <div class="gong-god">{{ getGongInfo(i).god }}</div>
                <div class="gong-relation">{{ getGongInfo(i).relation }}</div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import type { DivinationHistory } from '../types/divination'

const props = defineProps<{
  history: DivinationHistory
}>()

onMounted(() => {
  console.log('[MLiurenPan] Component mounted with history:', {
    id: props.history.id,
    hasResult: !!props.history.result,
    resultData: props.history.result?.data
  })
})

// 监听历史记录变化
watch(() => props.history, (newHistory) => {
  console.log('[MLiurenPan] History changed:', {
    id: newHistory.id,
    hasResult: !!newHistory.result,
    resultData: newHistory.result?.data
  })
}, { immediate: true })

// 获取宫位信息
const getGongInfo = (index: number) => {
  const result = props.history.result
  if (!result || !result.data || !result.data.gong_info) {
    console.warn('[MLiurenPan] Missing result data for gong:', index)
    return {
      position: '',
      star: '',
      branch: '',
      god: '',
      relation: ''
    }
  }

  const gongKey = `gong${index}` as keyof typeof result.data.gong_info
  const gong = result.data.gong_info[gongKey]
  if (!gong) {
    console.warn('[MLiurenPan] Missing gong data for index:', index)
    return {
      position: '',
      star: '',
      branch: '',
      god: '',
      relation: ''
    }
  }

  return {
    position: gong.position,
    star: gong.star,
    branch: gong.branch,
    god: gong.god,
    relation: gong.relation,
    number: gong.number,
    divination_number: gong.divination_number
  }
}
</script>

<style scoped>
.m-liuren-pan {
  margin-bottom: 16px;
}

.gong-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  background-color: #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}

.gong-item {
  background-color: #fff;
  padding: 0;
  min-height: 100px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.gong-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.gong-position {
  padding: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #8b5e34;
  background-color: rgba(139, 94, 52, 0.05);
  text-align: center;
  border-bottom: 1px solid rgba(139, 94, 52, 0.1);
}

.gong-main {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  height: 100%;
}

.gong-left, .gong-right {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 24px;
}

.gong-star {
  font-size: 14px;
  color: #9C27B0;
  font-weight: 500;
}

.gong-branch {
  font-size: 14px;
  color: #2196F3;
}

.gong-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.gong-center-text {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 16px;
  color: #4CAF50;
  font-weight: 500;
}

.body-text {
  font-size: 14px;
  color: #4CAF50;
}

.gong-god {
  font-size: 14px;
  color: #E91E63;
  font-weight: bold;
  text-align: right;
}

.gong-relation {
  font-size: 14px;
  color: #FF9800;
  font-weight: bold;
  text-align: right;
}

.time-palace {
  background-color: rgba(33, 150, 243, 0.15) !important;
  border-color: #2196F3;
}

.day-palace {
  background-color: rgba(76, 175, 80, 0.15) !important;
  border-color: #4CAF50;
}

.body-palace {
  background-color: rgba(76, 175, 80, 0.15) !important;
  border-color: #4CAF50;
}

.body-palace .gong-position {
  color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.2);
}
</style>
