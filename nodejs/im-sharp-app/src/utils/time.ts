/**
 * 格式化消息时间
 * @param time ISO 时间字符串
 * @returns 格式化后的时间字符串（如：14:30）
 */
export function formatTime(time: string): string {
  const date = new Date(time)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

/**
 * 格式化会话列表右侧时间
 * @param time ISO 时间字符串
 * @returns 格式化后的时间字符串（如：14:30、昨天、3天前）
 */
export function formatConversationTime(time: string | null): string {
  if (!time) {
    return ''
  }

  const date = new Date(time)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayDiff = Math.floor((today.getTime() - messageDay.getTime()) / (1000 * 60 * 60 * 24))

  if (dayDiff <= 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  if (dayDiff === 1) {
    return '昨天'
  }

  if (dayDiff < 7) {
    return `${dayDiff}天前`
  }

  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

/**
 * 格式化日期分隔符
 * @param time ISO 时间字符串
 * @returns 格式化后的日期字符串（如：今天、昨天、2024/01/15）
 */
export function formatDate(time: string): string {
  const date = new Date(time)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const diffTime = today.getTime() - messageDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.getDay()] || '未知'
  } else {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/')
  }
}
