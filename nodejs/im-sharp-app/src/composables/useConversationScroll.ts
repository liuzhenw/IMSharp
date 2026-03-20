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

  if (source) {
    watch(
      [containerRef, () => toValue(source)],
      async ([container]) => {
        if (!container) {
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
  }
}
