import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DivinationHistory } from '../types/divination'
import { groupHistoryByTime } from '../utils/history'

// 统一 PC 端和移动端的存储 key
const STORAGE_KEY = 'liuren-histories'

export const useHistoryStore = defineStore('history', {
  state: () => {
    // 初始化时从本地存储加载数据
    const stored = localStorage.getItem(STORAGE_KEY)
    let historyList: DivinationHistory[] = []
    
    if (stored) {
      try {
        historyList = JSON.parse(stored)
        console.log('[HistoryStore] Loaded from localStorage:', {
          count: historyList.length,
          firstItem: historyList[0] ? {
            id: historyList[0].id,
            hasResult: !!historyList[0].result,
            resultData: historyList[0].result?.data
          } : null
        })
      } catch (e) {
        console.error('[HistoryStore] Failed to parse localStorage:', e)
      }
    }
    
    return {
      historyList,
      selectedId: null as string | null,
    }
  },
  
  actions: {
    addHistory(history: DivinationHistory) {
      console.log('[HistoryStore] Adding history:', {
        id: history.id,
        hasResult: !!history.result,
        resultData: history.result?.data
      })
      this.historyList.unshift(history)
      this.saveToLocalStorage()
    },
    
    deleteHistory(id: string) {
      console.log('[HistoryStore] Deleting history:', { id })
      const index = this.historyList.findIndex(h => h.id === id)
      if (index > -1) {
        this.historyList.splice(index, 1)
        // 如果删除的是当前选中的记录，清除选中状态
        if (this.selectedId === id) {
          this.selectedId = null
        }
        this.saveToLocalStorage()
      }
    },
    
    updateHistory(history: DivinationHistory) {
      console.log('[HistoryStore] Updating history:', {
        id: history.id,
        hasResult: !!history.result,
        resultData: history.result?.data
      })
      const index = this.historyList.findIndex(h => h.id === history.id)
      if (index > -1) {
        this.historyList[index] = history
        this.saveToLocalStorage()
      }
    },
    
    saveToLocalStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.historyList))
      } catch (e) {
        console.error('[HistoryStore] Failed to save to localStorage:', e)
      }
    }
  },
  
  getters: {
    // 获取分组后的历史记录
    groupedHistory: (state) => {
      return groupHistoryByTime(state.historyList)
    },
    
    // 获取当前选中的历史记录
    currentHistory: (state) => {
      return state.historyList.find(h => h.id === state.selectedId)
    }
  }
})
