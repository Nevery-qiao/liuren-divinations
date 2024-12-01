<!-- TimePickerDemo.vue -->
<template>
  <div class="elegant-time-picker">
    <div class="time-card">
      <el-dropdown trigger="click" @command="handleYearSelect">
        <div class="time-segment">
          <div class="segment-label">年份</div>
          <div class="segment-value">{{ selectedYear }}</div>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item 
              v-for="year in yearOptions" 
              :key="year" 
              :command="year"
            >{{ year }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown trigger="click" @command="handleDateSelect">
        <div class="date-segment">
          <div class="segment-label">日期</div>
          <div class="segment-value">{{ selectedDate }}</div>
        </div>
        <template #dropdown>
          <div class="date-selects">
            <el-select v-model="month" class="month-select" @change="handleMonthSelect">
              <el-option 
                v-for="month in 12" 
                :key="month" 
                :value="month"
              >{{ month }}</el-option>
            </el-select>
            <el-select v-model="day" class="day-select" @change="handleDaySelect">
              <el-option 
                v-for="day in daysInMonth" 
                :key="day" 
                :value="day"
              >{{ day }}</el-option>
            </el-select>
          </div>
        </template>
      </el-dropdown>

      <el-dropdown trigger="click">
        <div class="time-segment">
          <div class="segment-label">时间</div>
          <div class="segment-value">{{ selectedTime }}</div>
        </div>
        <template #dropdown>
          <div class="time-input">
            <el-time-picker
              v-model="timeValue"
              format="HH:mm"
              :clearable="false"
              @change="handleTimeChange"
            />
          </div>
        </template>
      </el-dropdown>
    </div>
    
    <!-- 添加占卜笔记区域 -->
    <div class="notes-section">
      <DivinationNotes
        v-model="divinationNotes"
        @save="handleNotesSave"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DivinationNotes from './DivinationNotes.vue'

const emit = defineEmits(['update:dateTime', 'saveNotes'])

// 日期时间值
const dateTime = ref(new Date())
const timeValue = ref(new Date())
const month = ref(dateTime.value.getMonth() + 1)
const day = ref(dateTime.value.getDate())

// 计算年份选项（前后5年）
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)
})

// 计算显示值
const selectedYear = computed(() => dateTime.value.getFullYear())
const selectedDate = computed(() => {
  const date = dateTime.value
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
})
const selectedTime = computed(() => {
  const date = dateTime.value
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
})

const daysInMonth = computed(() => {
  const date = new Date(dateTime.value.getFullYear(), month.value, 0)
  return date.getDate()
})

function handleYearSelect(year: number) {
  const newDate = new Date(dateTime.value)
  newDate.setFullYear(year)
  dateTime.value = newDate
  emit('update:dateTime', newDate)
}

function handleDateSelect(date: string) {
  const [month, day] = date.split('-').map(Number)
  const newDate = new Date(dateTime.value)
  newDate.setMonth(month - 1)
  newDate.setDate(day)
  dateTime.value = newDate
  emit('update:dateTime', newDate)
}

function handleMonthSelect(month: number) {
  const newDate = new Date(dateTime.value)
  newDate.setMonth(month - 1)
  dateTime.value = newDate
  emit('update:dateTime', newDate)
}

function handleDaySelect(day: number) {
  const newDate = new Date(dateTime.value)
  newDate.setDate(day)
  dateTime.value = newDate
  emit('update:dateTime', newDate)
}

function handleTimeChange(time: Date) {
  if (!time) return
  const newDate = new Date(dateTime.value)
  newDate.setHours(time.getHours())
  newDate.setMinutes(time.getMinutes())
  dateTime.value = newDate
  timeValue.value = time
  emit('update:dateTime', newDate)
}

// 占卜笔记相关
const divinationNotes = ref('')

function handleNotesSave(notes: string) {
  emit('saveNotes', notes)
}
</script>

<style scoped>
.elegant-time-picker {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.time-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  width: 360px;
  box-sizing: border-box;
  gap: 32px;
}

.time-segment {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.date-segment {
  flex: 2;
}

.segment-label {
  color: #854d27;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.segment-value {
  font-size: 16px;
  color: #854d27;
  font-weight: 500;
}

.date-selects {
  display: flex;
  gap: 12px;
  justify-content: center;
}

:deep(.month-select), :deep(.day-select) {
  width: 90px;
  
  .el-input__wrapper {
    background: #fff9e7;
    box-shadow: none !important;
    border: 1px solid #d4a373;
  }
  
  .el-input__inner {
    color: #774936;
    text-align: center;
    font-size: 14px;
  }
  
  .el-select__caret {
    color: #774936;
  }
}

:deep(.time-input) {
  width: 80px;
  
  .el-input__wrapper {
    background: #fff9e7;
    box-shadow: none !important;
    border: 1px solid #d4a373;
    padding: 0 8px;
  }
  
  .el-input__inner {
    color: #774936;
    text-align: center;
    font-size: 14px;
  }
}

:deep(.el-select-dropdown) {
  background: #fff9e7;
  border-color: #d4a373;
  
  .el-select-dropdown__item {
    color: #774936;
    height: 32px;
    line-height: 32px;
    
    &.selected {
      color: #c17f59;
      font-weight: bold;
      background: rgba(193, 127, 89, 0.1);
    }
    
    &:hover {
      color: #c17f59;
      background: rgba(193, 127, 89, 0.1);
    }
  }
}

/* 下拉菜单样式 */
:deep(.el-dropdown-menu) {
  background: #fff9e7;
  border-color: #e8d5c4;
  padding: 4px;
}

:deep(.el-dropdown-menu__item) {
  color: #854d27;
  font-size: 14px;
  padding: 6px 12px;
  
  &:hover {
    background: rgba(193, 127, 89, 0.1);
    color: #c17f59;
  }
}

:global(.el-popper.is-light) {
  background: #fff9e7 !important;
  border-color: #d4a373 !important;
  
  .el-popper__arrow::before {
    background: #fff9e7 !important;
    border-color: #d4a373 !important;
  }
}

.notes-section {
  margin-top: 20px;
  border-radius: 4px;
  background-color: #fdfbf7;
}
</style>
