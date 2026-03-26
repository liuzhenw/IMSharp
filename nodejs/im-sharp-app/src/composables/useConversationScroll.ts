import { nextTick, ref, watch, type MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'

async function afterPaint(): Promise<void> {
  await nextTick()

  await new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame !== 'function') {
      resolve()
      return
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
}

export function useConversationScroll(source?: MaybeRefOrGetter<unknown>) {
  const containerRef = ref<HTMLElement | null>(null)
  const pendingPrependSnapshot = ref<{
    scrollTop: number
    scrollHeight: number
  } | null>(null)

  function setContainer(element: HTMLElement | null) {
    containerRef.value = element
  }

  async function scrollToBottom() {
    await afterPaint()

    if (!containerRef.value) {
      return
    }

    containerRef.value.scrollTop = containerRef.value.scrollHeight
  }

  async function scrollToMessage(messageId: string): Promise<boolean> {
    await afterPaint()

    const messageElement = document.querySelector<HTMLElement>(`[data-message-id="${messageId}"]`)
    if (!messageElement) {
      return false
    }

    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return true
  }

  async function preserveScrollPosition<T>(task: () => Promise<T>): Promise<T> {
    if (!containerRef.value) {
      return await task()
    }

    const snapshot = {
      scrollTop: containerRef.value.scrollTop,
      scrollHeight: containerRef.value.scrollHeight,
    }

    pendingPrependSnapshot.value = snapshot

    try {
      const result = await task()
      await afterPaint()

      if (containerRef.value && pendingPrependSnapshot.value === snapshot) {
        const heightDelta = containerRef.value.scrollHeight - snapshot.scrollHeight
        containerRef.value.scrollTop = snapshot.scrollTop + heightDelta
        pendingPrependSnapshot.value = null
      }

      return result
    } catch (error) {
      if (pendingPrependSnapshot.value === snapshot) {
        pendingPrependSnapshot.value = null
      }

      throw error
    }
  }

  if (source) {
    watch(
      [containerRef, () => toValue(source)],
      async ([container]) => {
        if (!container) {
          return
        }

        if (pendingPrependSnapshot.value) {
          const snapshot = pendingPrependSnapshot.value
          await afterPaint()
          container.scrollTop =
            snapshot.scrollTop + (container.scrollHeight - snapshot.scrollHeight)
          pendingPrependSnapshot.value = null
          return
        }

        await scrollToBottom()
      },
      { deep: false, flush: 'post', immediate: true },
    )
  } else {
    watch(
      containerRef,
      async (container) => {
        if (!container) {
          return
        }

        await scrollToBottom()
      },
      { flush: 'post' },
    )
  }

  return {
    containerRef,
    setContainer,
    scrollToBottom,
    scrollToMessage,
    preserveScrollPosition,
  }
}
