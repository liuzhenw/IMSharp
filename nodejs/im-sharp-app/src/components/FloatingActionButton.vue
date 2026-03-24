<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const externalUrl = import.meta.env.VITE_EXTERNAL_LINK_URL

// 按钮尺寸和边距常量
const BUTTON_SIZE = 56 // w-14 = 56px
const MARGIN = 16

// 位置状态（绝对位置，相对于视口）
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const startPosition = ref({ x: 0, y: 0 }) // 记录拖拽开始时的按钮位置
const dragDistance = ref(0)

// 获取默认位置（右下角）
function getDefaultPosition() {
  return {
    x: window.innerWidth - BUTTON_SIZE - MARGIN - 24, // 24px = right-6
    y: window.innerHeight - BUTTON_SIZE - MARGIN - 96  // 96px = bottom-24
  }
}

// 约束位置在视口内
function constrainPosition(x: number, y: number) {
  const maxX = window.innerWidth - BUTTON_SIZE - MARGIN
  const maxY = window.innerHeight - BUTTON_SIZE - MARGIN

  return {
    x: Math.max(MARGIN, Math.min(x, maxX)),
    y: Math.max(MARGIN, Math.min(y, maxY))
  }
}

// 拖拽开始
function handleDragStart(e: TouchEvent | MouseEvent) {
  e.preventDefault() // 阻止默认行为（如页面滚动）

  isDragging.value = true
  dragDistance.value = 0

  const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX
  const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY

  // 记录鼠标相对于按钮左上角的偏移
  dragStart.value = {
    x: clientX - position.value.x,
    y: clientY - position.value.y
  }

  // 记录拖拽开始时的按钮位置
  startPosition.value = { ...position.value }
}

// 拖拽移动
function handleDragMove(e: TouchEvent | MouseEvent) {
  if (!isDragging.value) return

  const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX
  const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY

  // 计算新位置（绝对位置）
  const newX = clientX - dragStart.value.x
  const newY = clientY - dragStart.value.y

  // 计算从开始位置到当前位置的总距离
  const dx = newX - startPosition.value.x
  const dy = newY - startPosition.value.y
  dragDistance.value = Math.sqrt(dx * dx + dy * dy)

  // 约束并更新位置
  position.value = constrainPosition(newX, newY)
}

// 拖拽结束
function handleDragEnd() {
  if (!isDragging.value) return

  // 如果拖拽距离小于 5px，视为点击
  if (dragDistance.value < 5 && externalUrl) {
    // 在当前标签页打开链接
    window.location.href = externalUrl
  }

  isDragging.value = false

  // 保存位置到 localStorage
  localStorage.setItem('floatingButtonPosition', JSON.stringify(position.value))
}

// 点击处理（用于鼠标点击，不拖拽的情况）
function handleClick(e: MouseEvent) {
  // 如果是拖拽后的点击，阻止默认行为
  if (dragDistance.value >= 5) {
    e.preventDefault()
    e.stopPropagation()
  }
}

// 初始化位置
onMounted(() => {
  const savedPosition = localStorage.getItem('floatingButtonPosition')
  if (savedPosition) {
    try {
      const saved = JSON.parse(savedPosition)
      // 验证保存的位置是否在当前视口内
      position.value = constrainPosition(saved.x, saved.y)
    } catch (e) {
      console.error('解析浮动按钮位置失败:', e)
      position.value = getDefaultPosition()
    }
  } else {
    // 使用默认位置（右下角）
    position.value = getDefaultPosition()
  }

  // 添加全局事件监听
  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', handleDragEnd)
  document.addEventListener('touchmove', handleDragMove, { passive: false })
  document.addEventListener('touchend', handleDragEnd)
})

// 清理事件监听
onUnmounted(() => {
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)
  document.removeEventListener('touchmove', handleDragMove)
  document.removeEventListener('touchend', handleDragEnd)
})
</script>

<template>
  <button
    v-if="externalUrl"
    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`,
      transition: isDragging ? 'none' : 'transform 0.2s'
    }"
    :class="[
      'fixed w-14 h-14 rounded-full',
      'bg-primary dark:bg-primary text-white',
      'shadow-lg shadow-primary/25 dark:shadow-primary/40',
      'flex items-center justify-center',
      'z-50',
      isDragging ? 'cursor-move scale-95' : 'cursor-pointer hover:scale-110',
      'transition-transform duration-200'
    ]"
    aria-label="外部链接"
    @mousedown="handleDragStart"
    @touchstart="handleDragStart"
    @click="handleClick"
  >
    <span class="text-sm font-medium">首页</span>
  </button>
</template>
