import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useEmbedStore = defineStore('embed', () => {
  const isEmbedMode = ref(false)
  const theme = ref<'light' | 'dark'>('light')
  const parentOrigin = ref('*')

  function configure(options: { theme?: string; parentOrigin?: string }) {
    isEmbedMode.value = true
    theme.value = options.theme === 'dark' ? 'dark' : 'light'
    parentOrigin.value = options.parentOrigin ?? '*'
  }

  function notifyParent(type: string, data?: unknown) {
    if (!isEmbedMode.value) return
    window.parent.postMessage(
      { source: 'imsharp-embed', type, data },
      parentOrigin.value || '*'
    )
  }

  return { isEmbedMode, theme, parentOrigin, configure, notifyParent }
})
