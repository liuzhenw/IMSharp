import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import {
  buildGroupConversationTimelineItems,
  buildPrivateConversationTimelineItems,
} from '@/utils/conversation'
import type { ConversationSystemEvent } from '@/types/conversation'
import type { GroupMessage, PrivateMessage } from '@/types'

export function usePrivateConversationTimeline(options: {
  messages: MaybeRefOrGetter<PrivateMessage[]>
  currentUserId: MaybeRefOrGetter<string | null | undefined>
  selfAvatar: MaybeRefOrGetter<string | null | undefined>
  otherAvatar: MaybeRefOrGetter<string | null | undefined>
}) {
  return computed(() =>
    buildPrivateConversationTimelineItems({
      messages: toValue(options.messages),
      currentUserId: toValue(options.currentUserId),
      selfAvatar: toValue(options.selfAvatar),
      otherAvatar: toValue(options.otherAvatar),
    }),
  )
}

export function useGroupConversationTimeline(options: {
  messages: MaybeRefOrGetter<GroupMessage[]>
  systemEvents: MaybeRefOrGetter<ConversationSystemEvent[]>
  currentUserId: MaybeRefOrGetter<string | null | undefined>
  selfAvatar: MaybeRefOrGetter<string | null | undefined>
  resolveSenderInfo: (message: GroupMessage) => { displayName: string; avatar: string | null }
}) {
  return computed(() =>
    buildGroupConversationTimelineItems({
      messages: toValue(options.messages),
      systemEvents: toValue(options.systemEvents),
      currentUserId: toValue(options.currentUserId),
      selfAvatar: toValue(options.selfAvatar),
      resolveSenderInfo: options.resolveSenderInfo,
    }),
  )
}
