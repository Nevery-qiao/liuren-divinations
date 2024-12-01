import type { DivinationHistory, GroupedHistory } from '../types/divination'

// 计算时间差（天数）
function getDaysDiff(timestamp: number): number {
  if (!timestamp || isNaN(timestamp)) {
    return 0  // 如果时间戳无效，返回0（今天）
  }
  const now = new Date()
  const date = new Date(timestamp)
  // 确保date是有效的日期
  if (isNaN(date.getTime())) {
    return 0
  }
  const diffTime = now.getTime() - date.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

// 获取分组标题
function getGroupTitle(daysDiff: number): string {
  if (daysDiff === 0) return '今天'
  if (daysDiff === 1) return '昨天'
  if (daysDiff < 7) return `${daysDiff}天前`
  if (daysDiff < 14) return '上周'
  if (daysDiff < 30) return `${Math.floor(daysDiff / 7)}周前`
  return `${Math.floor(daysDiff / 30)}月前`
}

// 对历史记录进行分组
export function groupHistoryByTime(histories: DivinationHistory[]): GroupedHistory[] {
  // 确保所有历史记录都有有效的时间戳
  const validHistories = histories.filter(h => h.timestamp && !isNaN(h.timestamp))
  
  // 按时间戳排序（从新到旧）
  const sortedHistories = [...validHistories].sort((a, b) => b.timestamp - a.timestamp)
  
  const groups: Map<string, DivinationHistory[]> = new Map()
  
  sortedHistories.forEach(history => {
    const daysDiff = getDaysDiff(history.timestamp)
    const title = getGroupTitle(daysDiff)
    
    if (!groups.has(title)) {
      groups.set(title, [])
    }
    groups.get(title)?.push(history)
  })
  
  return Array.from(groups.entries()).map(([title, items]) => ({
    title,
    items
  }))
}

// 清理30天前的记录
export function cleanOldHistories(histories: DivinationHistory[]): DivinationHistory[] {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  return histories.filter(history => history.timestamp > thirtyDaysAgo)
}

// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
