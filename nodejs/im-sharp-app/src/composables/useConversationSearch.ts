import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { debounce } from '@/utils/debounce'
import type { ConversationSearchResult } from '@/types/conversation'

export function useConversationSearch<T>(options: {
  initialSearchMode?: boolean
  search: (keyword: string) => Promise<T[]>
  mapResult: (result: T, keyword: string) => ConversationSearchResult
  onError: (error: unknown) => void
  scrollToMessage: (messageId: string) => Promise<boolean> | boolean
}) {
  const isSearchMode = ref(Boolean(options.initialSearchMode))
  const searchKeyword = ref('')
  const rawResults = ref<T[]>([])
  const isSearching = ref(false)
  const highlightedMessageId = ref<string | null>(null)

  let requestToken = 0
  let highlightTimer: ReturnType<typeof setTimeout> | null = null

  function clearHighlightTimer() {
    if (!highlightTimer) {
      return
    }

    clearTimeout(highlightTimer)
    highlightTimer = null
  }

  function resetSearch(clearHighlight = true) {
    searchKeyword.value = ''
    rawResults.value = []
    isSearching.value = false
    requestToken += 1

    if (clearHighlight) {
      clearHighlightTimer()
      highlightedMessageId.value = null
    }
  }

  function openSearch() {
    isSearchMode.value = true
  }

  function closeSearch(clearHighlight = true) {
    isSearchMode.value = false
    resetSearch(clearHighlight)
  }

  function toggleSearchMode() {
    if (isSearchMode.value) {
      closeSearch()
      return
    }

    openSearch()
  }

  const performSearch = debounce(async (keyword: string) => {
    const trimmedKeyword = keyword.trim()
    const currentToken = ++requestToken

    if (!trimmedKeyword) {
      rawResults.value = []
      isSearching.value = false
      return
    }

    isSearching.value = true

    try {
      const results = await options.search(trimmedKeyword)
      if (currentToken !== requestToken) {
        return
      }

      rawResults.value = results
    } catch (error) {
      if (currentToken === requestToken) {
        options.onError(error)
      }
    } finally {
      if (currentToken === requestToken) {
        isSearching.value = false
      }
    }
  }, 300)

  watch(searchKeyword, (newKeyword) => {
    performSearch(newKeyword)
  })

  async function selectResult(messageId: string) {
    highlightedMessageId.value = messageId
    closeSearch(false)
    await options.scrollToMessage(messageId)

    clearHighlightTimer()
    highlightTimer = setTimeout(() => {
      if (highlightedMessageId.value === messageId) {
        highlightedMessageId.value = null
      }
    }, 3000)
  }

  const results = computed(() =>
    (rawResults.value as T[]).map((result) => options.mapResult(result, searchKeyword.value)),
  )

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isSearchMode.value) {
      closeSearch()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    clearHighlightTimer()
  })

  return {
    isSearchMode,
    searchKeyword,
    isSearching,
    results,
    highlightedMessageId,
    openSearch,
    closeSearch,
    toggleSearchMode,
    selectResult,
  }
}
