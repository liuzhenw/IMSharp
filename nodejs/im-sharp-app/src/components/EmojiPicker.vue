<script setup lang="ts">
interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [emoji: string]
  close: []
}>()

const emojiCategories = [
  {
    name: '笑脸',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏'],
  },
  {
    name: '手势',
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '🙏', '💪', '🦾', '🦿', '🦵'],
  },
  {
    name: '爱心',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  },
  {
    name: '其他',
    emojis: ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '✨', '💫', '🔥', '💯', '✅', '❌'],
  },
]

function selectEmoji(emoji: string) {
  emit('select', emoji)
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen"
    class="absolute bottom-full left-0 w-full bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 shadow-xl animate-slide-in-from-bottom max-h-64 overflow-y-auto"
  >
    <div v-for="category in emojiCategories" :key="category.name" class="mb-4 last:mb-0">
      <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{{ category.name }}</h4>
      <div class="grid grid-cols-8 gap-2">
        <button
          v-for="(emoji, index) in category.emojis"
          :key="index"
          @click="selectEmoji(emoji)"
          class="text-2xl hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded transition-colors"
        >
          {{ emoji }}
        </button>
      </div>
    </div>
  </div>
</template>
