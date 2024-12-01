// 格式化时间戳为可读格式
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // 如果是今天的时间，显示具体时间
  if (diffDays === 0) {
    if (diffMins < 60) {
      return diffMins <= 1 ? '刚刚' : `${diffMins}分钟前`
    }
    if (diffHours < 24) {
      return `${diffHours}小时前`
    }
    return formatTimeString(date)
  }

  // 如果是昨天，显示"昨天 HH:mm"
  if (diffDays === 1) {
    return `昨天 ${formatTimeString(date)}`
  }

  // 如果是今年，显示"MM-DD HH:mm"
  if (date.getFullYear() === now.getFullYear()) {
    return `${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${formatTimeString(date)}`
  }

  // 其他情况显示完整日期"YYYY-MM-DD HH:mm"
  return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${formatTimeString(date)}`
}

// 格式化时间字符串 HH:mm
function formatTimeString(date: Date): string {
  return `${padZero(date.getHours())}:${padZero(date.getMinutes())}`
}

// 补零
function padZero(num: number): string {
  return num.toString().padStart(2, '0')
}
