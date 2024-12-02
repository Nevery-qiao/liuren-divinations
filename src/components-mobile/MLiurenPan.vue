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
          :style="{ order: i }"
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

// 默认宫位名称
const defaultGongNames = ['大安', '留连', '速喜', '赤口', '小吉', '空亡']

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
    resultData: newHistory.result?.data,
    gongInfo: newHistory.result?.data?.gong_info
  })
}, { immediate: true })

// 获取宫位信息
const getGongInfo = (index: number) => {
  const result = props.history.result
  if (!result || !result.data || !result.data.gong_info) {
    console.warn('[MLiurenPan] Missing result data for gong:', index, {
      hasResult: !!result,
      hasData: !!result?.data,
      hasGongInfo: !!result?.data?.gong_info
    })
    return {
      position: defaultGongNames[index - 1] || index.toString(),
      star: '',
      branch: '',
      god: '',
      relation: ''
    }
  }

  const gongKey = `gong${index}` as keyof typeof result.data.gong_info
  const gong = result.data.gong_info[gongKey]
  
  if (!gong) {
    console.warn('[MLiurenPan] Missing gong data for index:', index, {
      gongKey,
      availableGongs: Object.keys(result.data.gong_info)
    })
    return {
      position: defaultGongNames[index - 1] || index.toString(),
      star: '',
      branch: '',
      god: '',
      relation: ''
    }
  }

  return {
    position: gong.position || defaultGongNames[index - 1] || index.toString(),
    star: gong.star || '',
    branch: gong.branch || '',
    god: gong.god || '',
    relation: gong.relation || ''
  }
}

// 计算属性：检查数据完整性
const dataIntegrity = computed(() => {
  const result = props.history.result
  if (!result || !result.data) return false
  
  const data = result.data
  return !!(
    data.gong_info &&
    data.time_palace &&
    data.day_palace &&
    data.zishen_info
  )
})
</script>

<style scoped>
.m-liuren-pan {
  padding: 16px;
}

.gong-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 8px;
  max-width: 100%;
  margin: 0 auto;
}

.gong-item {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
  position: relative;
}

.gong-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gong-position {
  font-size: 20px;
  font-weight: bold;
  color: #795548;
  text-align: center;
  padding: 4px;
  background-color: rgba(121, 85, 72, 0.05);
  border-radius: 4px;
}

.gong-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.gong-left {
  flex: 1;
  text-align: left;
}

.gong-right {
  flex: 1;
  text-align: right;
}

.gong-star {
  font-size: 18px;
  font-weight: bold;
  color: #E91E63;
}

.gong-branch {
  font-size: 18px;
  font-weight: bold;
  color: #2196F3;
}

.gong-god {
  font-size: 18px;
  font-weight: bold;
  color: #E91E63;
  text-align: right;
}

.gong-relation {
  font-size: 18px;
  font-weight: bold;
  color: #FF9800;
  text-align: right;
}

.gong-center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 60px;
}

.gong-center-text {
  font-size: 16px;
  color: #4CAF50;
  font-weight: 500;
}

.time-palace {
  background-color: rgba(33, 150, 243, 0.05) !important;
  border-radius: 4px;
  overflow: hidden;
}

.time-palace .gong-position {
  background-color: rgba(33, 150, 243, 0.1);
  color: #2196F3;
}

.day-palace {
  background-color: rgba(76, 175, 80, 0.05);
  border-radius: 4px;
  overflow: hidden;
}

.day-palace .gong-position {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
}

.body-palace {
  background-color: rgba(76, 175, 80, 0.05);
  border-radius: 4px;
  overflow: hidden;
}

.body-palace .gong-position {
  color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.1);
}

.body-text {
  font-size: 16px;
  color: #4CAF50;
  font-weight: 500;
}
</style>
