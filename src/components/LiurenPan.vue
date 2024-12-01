<template>
  <div class="page-container">
    <div class="sidebar">
      <div class="app-title">
        <span>六壬占卜</span>
        <NewDivinationInput @confirm="handleNewDivination" />
      </div>
      <div class="sidebar-content">
        <DivinationHistoryComponent 
          :histories="histories" 
          :currentHistoryId="currentHistoryId"
          @select="selectHistory"
          @delete="deleteHistory"
        />
      </div>
    </div>

    <div class="main-content">
      <div class="divination-panel">
        <div v-if="divinationResult" class="divination-area">
          <div class="result-header">
            <div class="basic-info">
              <div class="main-info">
                <div class="emoji-topic">
                  <span 
                    class="emoji-wrapper" 
                    ref="emojiButtonRef"
                    @click.stop="handleEmojiPickerClick"
                  >{{ currentEmoji }}</span>
                  <div class="question" @click="startEditing" v-if="!isEditing">
                    {{ question || '点击添加问题' }}
                  </div>
                  <el-input
                    v-else
                    ref="questionInput"
                    v-model="question"
                    @blur="finishEditing"
                    @keyup.enter="finishEditing"
                    placeholder="请输入问题"
                  />
                </div>
              </div>
            </div>
            <div class="time-info">
              <div class="lunar-time">{{ lunarTime }}</div>
              <div class="solar-time">{{ formatSolarTime }}</div>
            </div>
          </div>

          <div class="gong-grid">
            <template v-for="i in [2, 3, 4, 1, 6, 5]" :key="i">
              <div 
                class="gong-item"
                :class="{
                  'time-palace': getGongInfo(i).position === divinationResult?.data?.time_palace,
                  'day-palace': getGongInfo(i).position === divinationResult?.data?.day_palace,
                  'body-palace': getGongInfo(i).relation === '自身'
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
                      <template v-if="getGongInfo(i).position === divinationResult?.data?.time_palace && 
                                    getGongInfo(i).position === divinationResult?.data?.day_palace">
                        <div class="gong-center-text">
                          {{ divinationResult?.data?.divination_number }} 身
                        </div>
                      </template>
                      <template v-else-if="getGongInfo(i).position === divinationResult?.data?.time_palace">
                        <div class="gong-center-text">
                          {{ divinationResult?.data?.divination_number }}
                        </div>
                      </template>
                      <template v-else-if="getGongInfo(i).position === divinationResult?.data?.day_palace">
                        <div class="gong-center-text">
                          身
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

          <div class="notes-section">
            <DivinationNotes
              v-model="divinationNotes"
              @save="handleNotesSave"
            />
          </div>
        </div>

        <div v-else class="empty-state">
          <el-empty 
            :image="emptyImage"
            :image-size="400"
            description=" "
          />
        </div>
      </div>
    </div>
  </div>

  <div class="emoji-picker-container" v-if="showEmojiPicker" :style="emojiPickerStyle">
    <div class="emoji-grid">
      <span 
        v-for="emoji in commonEmojis" 
        :key="emoji"
        class="emoji-item"
        @click="handleEmojiSelect({ native: emoji })"
      >
        {{ emoji }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import type { ElInput } from 'element-plus'
import { ElMessage } from 'element-plus'
import type { DivinationResponse } from '../api/liuren'
import type { DivinationHistory } from '../types/divination'
import { getDivinationInfo } from '../api/liuren'
import DivinationHistoryComponent from './DivinationHistory.vue'
import DivinationNotes from './DivinationNotes.vue'
import emptyDivinationImage from '../assets/empty-divination.png'
import NewDivinationInput from './NewDivinationInput.vue'
import dayjs from 'dayjs'

const STORAGE_KEY = 'liuren-histories'
const emptyImage = emptyDivinationImage
const currentTime = ref(new Date())
const divinationNumber = ref('')
const form = ref({
  time: new Date()
})

const showInput = ref(false)

const divinationResult = ref<DivinationResponse | null>(null)
const question = ref('')
const isEditing = ref(false)
const questionInput = ref<InstanceType<typeof ElInput> | null>(null)
const histories = ref<DivinationHistory[]>([])
const loading = ref(false)
const divinationNotes = ref('')

const currentEmoji = ref('🔮')
const showEmojiPicker = ref(false)
const emojiPickerPosition = ref({ x: 0, y: 0 })
const emojiButtonRef = ref<HTMLElement | null>(null)

const commonEmojis = [
  // 占卜相关
  '🔮', '✨', '🌟', '⭐', '💫', '🌙', '☀️', '⚡',
  '🎯', '🎲', '🎨', '🎭', '🎪', '🎬', '📝', '📖',
  '💭', '💡', '💫', '💥', '✅', '❌', '❓', '❗',
  '🌈', '🌊', '🌸', '🍀', '🌺', '🌼', '🌻', '🌹',
  
  // 情感表达
  '❤️', '💔', '💕', '💖', '💗', '💘', '💙', '💚',
  '😊', '😃', '😄', '😆', '😅', '😂', '🤣', '😇',
  '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '🙂', '🤗', '🤩', '🥳', '😎', '🤓', '🧐', '🤔',
  
  // 自然元素
  '🌞', '🌝', '🌚', '🌛', '🌜', '🌕', '🌖', '🌗',
  '🌍', '🌎', '🌏', '🌋', '🗻', '🏔️', '⛰️', '🏕️',
  '🌳', '🌲', '🎋', '🎍', '🍃', '🍂', '🍁', '🌾',
  '🌷', '🌱', '🌿', '☘️', '🍀', '🎋', '🎍', '🪴',
  
  // 物品和符号
  '📚', '📖', '📜', '📄', '✏️', '📝', '💼', '📋',
  '🎨', '🎭', '🎪', '🎯', '🎲', '🎮', '🎼', '🎵',
  '🔔', '🔕', '📢', '📣', '💡', '🔦', '🕯️', '✨',
  '💎', '🔑', '🗝️', '🎁', '🎀', '🎉', '🎊', '🎈'
]

const emojiPickerStyle = computed(() => ({
  position: 'fixed',
  left: `${emojiPickerPosition.value.x}px`,
  top: `${emojiPickerPosition.value.y}px`,
  zIndex: 1000,
  backgroundColor: '#fff',
  borderRadius: '8px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
  padding: '8px',
  maxHeight: '400px',
  overflowY: 'auto'
}))

const currentYear = computed(() => currentTime.value.getFullYear())
const currentDate = computed(() => {
  const month = (currentTime.value.getMonth() + 1).toString().padStart(2, '0')
  const day = currentTime.value.getDate().toString().padStart(2, '0')
  return `${month}月${day}日`
})
const timeDisplay = computed(() => {
  const hour = currentTime.value.getHours().toString().padStart(2, '0')
  const minute = currentTime.value.getMinutes().toString().padStart(2, '0')
  return `${hour}:${minute}`
})
const formatSolarTime = computed(() => {
  if (!currentTime.value) return ''
  return dayjs(currentTime.value).format('YYYY年MM月DD日 HH:mm')
})
const lunarTime = computed(() => {
  if (!divinationResult.value?.data?.lunar_time) return '未知时间'
  return divinationResult.value.data.lunar_time
})
const divinationNumberDisplay = computed(() => {
  if (!divinationNumber.value) return ''
  return `【数字: ${divinationNumber.value}】`
})
const getGongInfo = computed(() => (index: number) => {
  const defaultGongInfo = {
    position: '',
    god: '',
    star: '',
    branch: '',
    relation: '',
    divination_number: ''
  }

  if (!divinationResult.value?.data?.gong_info) {
    return defaultGongInfo
  }

  const gongKey = `gong${index}` as keyof typeof divinationResult.value.data.gong_info
  const gongInfo = divinationResult.value.data.gong_info[gongKey]
  
  if (!gongInfo) {
    return defaultGongInfo
  }

  return {
    position: gongInfo.position || '',
    god: gongInfo.god || '',
    star: gongInfo.star || '',
    branch: gongInfo.branch || '',
    relation: gongInfo.relation || '',
    divination_number: gongInfo.divination_number || gongInfo.number || ''
  }
})

async function loadHistories() {
  console.log('Loading histories from localStorage')
  try {
    const savedHistories = localStorage.getItem(STORAGE_KEY)
    if (savedHistories) {
      histories.value = JSON.parse(savedHistories)
      console.log('Loaded histories:', {
        count: histories.value.length,
        firstHistory: histories.value[0] ? {
          id: histories.value[0].id,
          question: histories.value[0].question,
          time: histories.value[0].time
        } : null
      })
    } else {
      console.log('No saved histories found')
      histories.value = []
    }
  } catch (error) {
    console.error('Error loading histories:', error)
    histories.value = []
  }
}

function saveHistories() {
  console.log('Saving histories:', {
    count: histories.value.length,
    firstHistory: histories.value[0] ? {
      id: histories.value[0].id,
      question: histories.value[0].question,
      time: histories.value[0].time
    } : null
  })
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(histories.value))
    console.log('Histories saved successfully')
  } catch (error) {
    console.error('Error saving histories:', error)
    ElMessage.error('保存历史记录失败')
  }
}

function addHistory(history?: DivinationHistory) {
  console.log('Adding history:', history)
  
  if (history) {
    histories.value.unshift(history)
  } else if (divinationResult.value) {
    const now = new Date()
    const newHistory: DivinationHistory = {
      id: now.getTime().toString(),
      time: now.toISOString(),
      timestamp: now.getTime(),
      question: question.value || '点击添加问题',
      result: divinationResult.value,
      notes: divinationNotes.value || '',
      number: parseInt(divinationNumber.value),
      emoji: currentEmoji.value || '🔮'
    }
    console.log('Created new history:', newHistory)
    histories.value.unshift(newHistory)
    currentHistoryId.value = newHistory.id
  } else {
    console.warn('Cannot add history: no divination result')
    return
  }
  
  saveHistories()
}

function deleteHistory(id: string) {
  console.log('Deleting history:', id)
  histories.value = histories.value.filter(h => h.id !== id)
  saveHistories()
}

function selectHistory(history: DivinationHistory) {
  console.log('Selecting history:', history)
  console.log('Previous values:', {
    result: divinationResult.value,
    question: question.value,
    notes: divinationNotes.value,
    currentHistoryId: currentHistoryId.value
  })
  
  divinationResult.value = history.result
  question.value = history.question || ''
  divinationNotes.value = history.notes || ''
  currentHistoryId.value = history.id
  currentEmoji.value = history.emoji || '🔮'
  
  // 保存当前查看的记录 ID 到 localStorage
  localStorage.setItem('liuren-last-viewed', history.id)
  
  console.log('Updated values:', {
    result: divinationResult.value,
    question: question.value,
    notes: divinationNotes.value,
    currentHistoryId: currentHistoryId.value,
    emoji: currentEmoji.value
  })
  
  if (history.time) {
    const date = new Date(history.time)
    if (!isNaN(date.getTime())) {
      currentTime.value = date
      form.value.time = date
    }
  }
  
  if (history.number) {
    divinationNumber.value = history.number.toString()
  }
}

const isNewDivination = ref(false)

async function getDivination() {
  if (!divinationNumber.value) {
    console.error('No divination number')
    return
  }

  try {
    console.log('Getting divination for:', {
      number: divinationNumber.value,
      time: dayjs(currentTime.value).format('YYYY-MM-DD HH:mm:ss')
    })

    const result = await getDivinationInfo(
      divinationNumber.value,
      dayjs(currentTime.value).format('YYYY-MM-DD HH:mm:ss')
    )

    if (!result || result.code !== 0) {
      console.error('Invalid result:', result)
      ElMessage.error('获取占卜信息失败，请稍后重试')
      return
    }

    console.log('Got divination result:', result)
    divinationResult.value = result
    
    // 只在新占卜时添加历史记录
    if (isNewDivination.value) {
      addHistory()
      isNewDivination.value = false // 重置标志
    }
  } catch (error) {
    console.error('Error:', error)
    ElMessage.error('获取占卜信息失败，请稍后重试')
  }
}

function handleNewDivination(data?: { number: number; time: string }) {
  console.log('New divination:', data)
  try {
    // 重置当前状态
    currentHistoryId.value = ''
    divinationResult.value = null
    question.value = ''
    divinationNotes.value = ''
    isNewDivination.value = true

    if (data) {
      console.log('Creating date with:', data)
      divinationNumber.value = data.number.toString()
      
      // 解析时间
      const [month, day, hour, minute] = data.time.split(/[-\s:]/)
      const now = new Date()
      const year = now.getFullYear()
      
      currentTime.value = new Date(year, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute))
      form.value.time = currentTime.value
      
      // 获取占卜信息
      getDivination()
    }
  } catch (error) {
    console.error('Error in handleNewDivination:', error)
    ElMessage.error('创建新占卜失败，请稍后重试')
  }
}

function handleEmojiSelect(emoji: { native: string }) {
  console.log('Emoji selected:', emoji)
  currentEmoji.value = emoji.native
  showEmojiPicker.value = false
  
  // 更新历史记录中的 emoji
  if (currentHistoryId.value) {
    const currentHistory = histories.value.find(h => h.id === currentHistoryId.value)
    if (currentHistory) {
      currentHistory.emoji = emoji.native
      saveHistories()
    }
  }
}

function handleEmojiPickerClick(event: MouseEvent) {
  console.log('handleEmojiPickerClick called')
  const target = event.target as HTMLElement
  console.log('Click target:', target)
  
  const rect = target.getBoundingClientRect()
  console.log('Target rect:', rect)
  
  emojiPickerPosition.value = {
    x: rect.left,
    y: rect.bottom + 5
  }
  console.log('Set picker position to:', emojiPickerPosition.value)
  
  showEmojiPicker.value = !showEmojiPicker.value
  console.log('Toggled emoji picker:', showEmojiPicker.value)
}

function handleClickOutside(event: MouseEvent) {
  if (!showEmojiPicker.value) return
  
  const target = event.target as HTMLElement
  const emojiButton = emojiButtonRef.value
  const pickerContainer = document.querySelector('.emoji-picker-container')
  
  // 如果点击的是 emoji 按钮或其子元素，不关闭
  if (emojiButton?.contains(target)) {
    return
  }
  
  // 如果点击的是选择器容器或其子元素，不关闭
  if (pickerContainer?.contains(target)) {
    return
  }
  
  showEmojiPicker.value = false
}

// 生命周期钩子
onMounted(async () => {
  console.log('LiurenPan component mounted')
  await loadHistories()

  // 从 localStorage 获取上次查看的占卜记录 ID
  const lastViewedId = localStorage.getItem('liuren-last-viewed')
  console.log('Last viewed history ID:', lastViewedId)

  if (lastViewedId) {
    // 如果有上次查看的记录，尝试找到它
    const lastViewed = histories.value.find(h => h.id === lastViewedId)
    if (lastViewed) {
      console.log('Found last viewed history:', lastViewed)
      selectHistory(lastViewed)
      return
    } else {
      console.log('Last viewed history not found')
    }
  }

  // 如果没有上次查看的记录，或者找不到该记录，显示最新的记录
  if (histories.value.length > 0) {
    console.log('Selecting most recent history:', histories.value[0])
    selectHistory(histories.value[0])
  }
})

function startEditing() {
  console.log('Starting editing...')
  isEditing.value = true
  nextTick(() => {
    questionInput.value?.focus()
  })
}

function finishEditing() {
  console.log('Finishing editing...')
  isEditing.value = false
  updateCurrentHistory()
}

function handleNotesSave(value: string) {
  console.log('Notes saved:', {
    value,
    currentHistoryId: currentHistoryId.value,
    previousNotes: divinationNotes.value
  })
  divinationNotes.value = value
  
  // 如果没有当前历史记录ID，创建一个新的
  if (!currentHistoryId.value && divinationResult.value) {
    console.log('No current history ID, creating new history')
    const now = new Date()
    const newHistory: DivinationHistory = {
      id: now.getTime().toString(),
      time: now.toISOString(),
      timestamp: now.getTime(),
      question: question.value || '',
      result: divinationResult.value,
      notes: value,
      number: parseInt(divinationNumber.value)
    }
    console.log('Created new history:', newHistory)
    histories.value.unshift(newHistory)
    currentHistoryId.value = newHistory.id
  }
  
  // 更新历史记录并保存
  updateCurrentHistory()
}

function updateCurrentHistory() {
  console.log('Updating current history:', {
    divinationResult: divinationResult.value ? 'exists' : 'null',
    currentHistoryId: currentHistoryId.value,
    question: question.value,
    notes: divinationNotes.value,
    historiesCount: histories.value.length
  })
  
  if (!divinationResult.value) {
    console.warn('No divination result, skipping update')
    return
  }
  
  // 如果没有当前历史记录ID，说明是新的占卜，需要创建一个新的历史记录
  if (!currentHistoryId.value) {
    console.log('No current history ID, creating new history')
    const now = new Date()
    const newHistory: DivinationHistory = {
      id: now.getTime().toString(),
      time: now.toISOString(),
      timestamp: now.getTime(),
      question: question.value || '',
      result: divinationResult.value,
      notes: divinationNotes.value || '',
      number: parseInt(divinationNumber.value)
    }
    console.log('Created new history:', newHistory)
    histories.value.unshift(newHistory)
    currentHistoryId.value = newHistory.id
    saveHistories()
    return
  }
  
  // 查找当前历史记录
  const currentHistory = histories.value.find(h => h.id === currentHistoryId.value)
  
  if (currentHistory) {
    console.log('Found current history:', {
      id: currentHistory.id,
      old: { question: currentHistory.question, notes: currentHistory.notes },
      new: { question: question.value, notes: divinationNotes.value }
    })
    
    // 只有当值真正改变时才更新和保存
    if (currentHistory.question !== question.value || currentHistory.notes !== divinationNotes.value) {
      currentHistory.question = question.value
      currentHistory.notes = divinationNotes.value
      console.log('History updated, saving changes')
      saveHistories()
    } else {
      console.log('No changes detected, skipping save')
    }
  } else {
    console.warn('No matching history found for ID:', currentHistoryId.value)
    // 如果找不到对应的历史记录，创建一个新的
    const now = new Date()
    const newHistory: DivinationHistory = {
      id: now.getTime().toString(),
      time: now.toISOString(),
      timestamp: now.getTime(),
      question: question.value || '',
      result: divinationResult.value,
      notes: divinationNotes.value || '',
      number: parseInt(divinationNumber.value)
    }
    console.log('Created new history due to missing record:', newHistory)
    histories.value.unshift(newHistory)
    currentHistoryId.value = newHistory.id
    saveHistories()
  }
}

const currentHistoryId = ref<string>('')

onUnmounted(() => {
  console.log('LiurenPan component unmounting')
  document.removeEventListener('click', handleClickOutside)
})

watch(divinationNotes, () => {
  console.log('Notes changed:', divinationNotes.value)
  // updateCurrentHistory()
}, { deep: true })

watch(divinationResult, (newVal) => {
  console.log('Divination result changed:', newVal)
  // if (newVal && !isInitialDivination.value) {
  //   updateCurrentHistory()
  // }
}, { deep: true })
</script>

<style scoped>
.page-container {
  display: flex;
  width: 100%;
  height: 100vh;
  background-color: #fff9e7;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  height: 100%;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  background-color: #a68b6c;
}

.app-title {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #8b5e34;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  height: 64px; /* 固定高度 */
  box-sizing: border-box;
}

.sidebar-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 确保flex布局正确计算高度 */
}

.divination-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 确保flex布局正确计算高度 */
  position: relative; /* 添加相对定位 */
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.input-label {
  width: 80px;
  text-align: right;
  flex-shrink: 0;
}

.time-group {
  display: flex;
  align-items: center;
  gap: 15px;
}

.time-segment {
  cursor: pointer;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  min-width: 100px;
}

.segment-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.segment-value {
  color: #606266;
}

.time-selection {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  background: #fff;
  padding: 0 24px;
  border-radius: 4px;
  border: 1px solid rgba(139, 94, 52, 0.2);
  height: 40px;
}

.submit-btn {
  height: 40px;
  padding: 0 20px;
  width: 120px;
  background-color: #8b5e34;
  border-color: #8b5e34;
}

.submit-btn:hover {
  background-color: #a17349;
  border-color: #a17349;
}

.divination-area {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
  flex: 1;
  min-height: 0;
}

.result-section {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  padding: 15px;
  flex-shrink: 0;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
}

.basic-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.main-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.emoji-topic {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  color: #333;
  cursor: pointer;
}

.emoji-wrapper {
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #666;
  font-size: 14px;
  text-align: right;
}

.lunar-time, .solar-time {
  white-space: nowrap;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.emoji {
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.emoji:hover {
  background-color: var(--el-color-primary-light-9);
}

.topic {
  font-size: 16px;
  font-weight: 500;
}

.center-section, .right-section {
  text-align: center;
}

.liuren-pan {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

.gong-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  width: 100%;
  margin: 20px auto;
}

.gong-item {
  position: relative;
  border: 1px solid rgba(139, 94, 52, 0.2);
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
  transition: all 0.3s ease;
  min-height: 180px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
  font-size: 20px;
  color: #4CAF50;
  font-weight: 500;
}

.time-palace {
  background-color: rgba(33, 150, 243, 0.05);
  border-color: #2196F3;
}

.day-palace {
  background-color: rgba(76, 175, 80, 0.05);
  border-color: #4CAF50;
}

.body-palace {
  border-color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.05);
}

.body-palace .gong-position {
  color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.1);
}

.notes-section {
  width: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.emoji-picker-container {
  position: fixed;
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  padding: 8px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.emoji-grid::-webkit-scrollbar {
  width: 6px;
}

.emoji-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.emoji-grid::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.emoji-grid::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.emoji-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  font-size: 20px;
}

.emoji-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.emoji-wrapper {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.emoji-wrapper:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>
