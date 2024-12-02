<template>
  <div class="m-liuren-pan">
    <div class="gong-grid">
      <template v-for="i in [1, 2, 3, 4, 5, 6]" :key="i">
        <div 
          class="gong-item"
          :class="{
            'time-palace': String(i) === String(history.result?.data?.time_palace),
            'day-palace': String(i) === String(history.result?.data?.day_palace),
            'body-palace': String(i) === String(history.result?.data?.zishen_info?.zishen)
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
                <template v-if="String(i) === String(history.result?.data?.time_palace) && 
                              String(i) === String(history.result?.data?.day_palace)">
                  <div class="gong-center-text">
                    {{ history.result?.data?.divination_number }}<span class="body-text">身</span>
                  </div>
                </template>
                <template v-else-if="String(i) === String(history.result?.data?.time_palace)">
                  <div class="gong-center-text">
                    {{ history.result?.data?.divination_number }}
                  </div>
                </template>
                <template v-else-if="String(i) === String(history.result?.data?.day_palace)">
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
  margin-bottom: 16px;
}

.gong-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  background-color: #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  padding: 2px;
}

.gong-item {
  background-color: #fff;
  padding: 0;
  min-height: 100px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  overflow: hidden;
}

.gong-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.gong-position {
  padding: 12px;
  font-size: 18px;
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
  padding: 16px;
  height: 100%;
}

.gong-left,
.gong-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gong-star {
  font-size: 16px;
  color: #9C27B0;
}

.gong-branch {
  font-size: 16px;
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
