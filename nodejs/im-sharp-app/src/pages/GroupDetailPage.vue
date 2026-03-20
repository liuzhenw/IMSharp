<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGroupsStore, useAuthStore, useUiStore } from '@/stores'
import { Button, ConfirmationModal, LoadingSpinner, Header } from '@/components'
import { mediaApi } from '@/services'

const route = useRoute()
const router = useRouter()
const groupsStore = useGroupsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const groupId = route.params.id as string
const isLoading = ref(true)
const showLeaveDialog = ref(false)
const showDeleteDialog = ref(false)
const isLeaving = ref(false)
const isDeleting = ref(false)
const showAnnouncementModal = ref(false)
const announcementInput = ref('')
const isSavingAnnouncement = ref(false)
const isTogglingPublic = ref(false)

const showEditModal = ref(false)
const isUploadingAvatar = ref(false)
const avatarFileInputRef = ref<HTMLInputElement | null>(null)
const editAvatarPreview = ref<string | null>(null)
const editAvatarFile = ref<File | null>(null)
const editName = ref('')
const editDescription = ref('')
const isSavingEdit = ref(false)

const group = computed(() => groupsStore.groups.find(g => g.id === groupId))
const members = computed(() => groupsStore.groupMembers.get(groupId) || [])
const displayMembers = computed(() => members.value.slice(0, 8))
const currentMember = computed(() => members.value.find(m => m.userId === authStore.user?.id))
const isOwner = computed(() => group.value?.ownerId === authStore.user?.id)
const isAdmin = computed(() => currentMember.value?.role === 'Admin' || isOwner.value)

onMounted(async () => {
  try {
    if (!group.value) {
      await groupsStore.loadGroups()
    }
    await groupsStore.loadGroupMembers(groupId)
  } catch (error) {
    console.error('加载群组详情失败:', error)
    uiStore.showToast('加载群组详情失败', 'error')
  } finally {
    isLoading.value = false
  }
})

function handleBack() {
  router.push(`/groups/${groupId}/chat`)
}

function handleSendMessage() {
  router.push(`/groups/${groupId}/chat`)
}

function handleSearchMessages() {
  router.push(`/groups/${groupId}/chat?search=true`)
}

function handleViewAllMembers() {
  router.push(`/groups/${groupId}/members`)
}

function handleInviteMembers() {
  router.push(`/groups/${groupId}/invite`)
}

function handleOpenAnnouncement() {
  announcementInput.value = group.value?.announcement?.content || ''
  showAnnouncementModal.value = true
}

async function handleSaveAnnouncement() {
  isSavingAnnouncement.value = true
  try {
    await groupsStore.updateAnnouncement(groupId, announcementInput.value)
    showAnnouncementModal.value = false
    uiStore.showToast('群公告已更新', 'success')
  } catch (error) {
    console.error('更新群公告失败:', error)
    uiStore.showToast('更新群公告失败', 'error')
  } finally {
    isSavingAnnouncement.value = false
  }
}

function handleOpenEditModal() {
  editName.value = group.value?.name || ''
  editDescription.value = group.value?.description || ''
  editAvatarPreview.value = group.value?.avatar || null
  editAvatarFile.value = null
  showEditModal.value = true
}

function handleEditAvatarClick() {
  avatarFileInputRef.value?.click()
}

function handleEditAvatarFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    uiStore.showToast('只支持 JPG、PNG、GIF、WebP 格式的图片', 'error')
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    uiStore.showToast('图片大小不能超过 10MB', 'error')
    return
  }

  editAvatarFile.value = file
  editAvatarPreview.value = URL.createObjectURL(file)
  ;(event.target as HTMLInputElement).value = ''
}

async function handleSaveEdit() {
  const trimmedName = editName.value.trim()
  if (!trimmedName) {
    uiStore.showToast('群名称不能为空', 'error')
    return
  }

  isSavingEdit.value = true
  try {
    let avatarUrl: string | undefined
    if (editAvatarFile.value) {
      isUploadingAvatar.value = true
      const result = await mediaApi.uploadAvatar(editAvatarFile.value)
      avatarUrl = result.url
      isUploadingAvatar.value = false
    }

    await groupsStore.updateGroup(groupId, {
      name: trimmedName,
      description: editDescription.value.trim(),
      ...(avatarUrl ? { avatar: avatarUrl } : {}),
    })

    showEditModal.value = false
    uiStore.showToast('群信息已更新', 'success')
  } catch (error) {
    console.error('更新群信息失败:', error)
    uiStore.showToast('更新群信息失败', 'error')
    isUploadingAvatar.value = false
  } finally {
    isSavingEdit.value = false
  }
}

async function copyGroupNumber() {
  const groupNumber = group.value?.groupNumber
  if (!groupNumber) return

  try {
    await navigator.clipboard.writeText(String(groupNumber))
    uiStore.showToast('群号已复制', 'success')
  } catch {
    uiStore.showToast('复制失败', 'error')
  }
}

async function handleTogglePublic() {
  if (isTogglingPublic.value || !group.value) return

  isTogglingPublic.value = true
  try {
    await groupsStore.updateGroup(groupId, { isPublic: !group.value.isPublic })
    uiStore.showToast('群组类型已更新', 'success')
  } catch (error) {
    console.error('更新群组类型失败:', error)
    uiStore.showToast('更新群组类型失败', 'error')
  } finally {
    isTogglingPublic.value = false
  }
}

async function handleLeaveGroup() {
  isLeaving.value = true
  try {
    await groupsStore.leaveGroup(groupId)
    uiStore.showToast('已离开群组', 'success')
    router.push('/groups')
  } catch (error) {
    console.error('离开群组失败:', error)
    uiStore.showToast('离开群组失败', 'error')
  } finally {
    isLeaving.value = false
    showLeaveDialog.value = false
  }
}

async function handleDeleteGroup() {
  isDeleting.value = true
  try {
    await groupsStore.deleteGroup(groupId)
    uiStore.showToast('群组已解散', 'success')
    router.push('/groups')
  } catch (error) {
    console.error('解散群组失败:', error)
    uiStore.showToast('解散群组失败', 'error')
  } finally {
    isDeleting.value = false
    showDeleteDialog.value = false
  }
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
    <Header title="群组详情" :show-back="true" @back="handleBack">
      <template v-if="isAdmin" #right>
        <button
          @click="handleOpenEditModal"
          class="flex items-center justify-center p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
        >
          <span class="material-symbols-outlined text-xl text-slate-900 dark:text-white">edit</span>
        </button>
      </template>
    </Header>

    <div v-if="isLoading" class="flex-1 flex items-center justify-center py-20">
      <LoadingSpinner />
    </div>

    <main v-else class="flex-1 overflow-y-auto">
      <div class="p-4 space-y-4">
        <div v-if="group" class="bg-white dark:bg-slate-800 rounded-lg p-4">
          <div class="flex items-center gap-4">
            <div class="shrink-0">
              <div
                v-if="group.avatar"
                class="size-16 rounded-lg bg-cover bg-center"
                :style="{ backgroundImage: `url(${group.avatar})` }"
              ></div>
              <div
                v-else
                class="size-16 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-sm"
              >
                <span class="material-symbols-outlined text-white text-3xl">groups</span>
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white truncate">{{ group.name }}</h2>
              <p
                class="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 cursor-pointer"
                @click="copyGroupNumber"
              >
                群号: {{ group.groupNumber }}
                <span class="material-symbols-outlined text-slate-400" style="font-size: 14px">content_copy</span>
              </p>
              <p class="text-sm text-slate-500 dark:text-slate-400">{{ group.memberCount }} 人</p>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p class="text-sm text-slate-600 dark:text-slate-300">
              {{ group.description || '暂无群简介' }}
            </p>
          </div>

          <div class="flex gap-3 mt-4">
            <Button @click="handleSendMessage" class="flex-1">
              发消息
            </Button>
            <Button
              v-if="isAdmin"
              @click="handleInviteMembers"
              variant="secondary"
              class="flex-1"
            >
              邀请
            </Button>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">群组成员</h3>
            <button
              @click="handleViewAllMembers"
              class="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              查看全部
            </button>
          </div>

          <div class="grid grid-cols-4 gap-4">
            <div v-for="member in displayMembers" :key="member.id" class="flex flex-col items-center gap-2">
              <div
                v-if="member.user?.avatar"
                class="size-12 rounded-full bg-cover bg-center"
                :style="{ backgroundImage: `url(${member.user.avatar})` }"
              ></div>
              <div v-else class="size-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <span class="material-symbols-outlined text-slate-400 text-xl">person</span>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-300 truncate w-full text-center">
                {{ member.user?.displayName || member.user?.username }}
              </p>
            </div>

            <button
              v-if="isAdmin"
              @click="handleInviteMembers"
              class="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div class="size-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <span class="material-symbols-outlined text-primary text-xl">add</span>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-300">邀请</p>
            </button>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-700">
          <div
            @click="handleSearchMessages"
            class="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <span class="text-sm text-slate-700 dark:text-slate-300">查找聊天记录</span>
            <span class="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
          </div>

          <div
            class="p-4 flex items-center justify-between"
            :class="isAdmin ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors' : ''"
            @click="isAdmin ? handleOpenAnnouncement() : undefined"
          >
            <span class="text-sm text-slate-700 dark:text-slate-300">群公告</span>
            <div class="flex items-center gap-1 min-w-0 flex-1 justify-end ml-4">
              <span class="text-sm text-slate-500 dark:text-slate-400 truncate">
                {{ group?.announcement?.content || '未设置' }}
              </span>
              <span v-if="isAdmin" class="material-symbols-outlined text-slate-400 text-sm shrink-0">chevron_right</span>
            </div>
          </div>

          <div class="p-4 flex items-center justify-between">
            <span class="text-sm text-slate-700 dark:text-slate-300">公开群组</span>
            <div v-if="isAdmin">
              <button
                @click="handleTogglePublic"
                :disabled="isTogglingPublic"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50"
                :class="group?.isPublic ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'"
              >
                <span
                  class="inline-block size-4 rounded-full bg-white shadow transform transition-transform"
                  :class="group?.isPublic ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </div>
            <span v-else class="text-sm text-slate-500 dark:text-slate-400">
              {{ group?.isPublic ? '公开群组' : '私密群组' }}
            </span>
          </div>

          <div class="p-4 flex items-center justify-between">
            <span class="text-sm text-slate-700 dark:text-slate-300">创建时间</span>
            <span class="text-sm text-slate-500 dark:text-slate-400">
              {{ new Date(group?.createdAt || '').toLocaleDateString('zh-CN') }}
            </span>
          </div>
        </div>

        <div class="space-y-2 pb-6">
          <button
            v-if="!isOwner"
            @click="showLeaveDialog = true"
            class="w-full bg-white dark:bg-slate-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg p-4 text-sm font-medium transition-colors"
          >
            离开群组
          </button>
          <button
            v-if="isOwner"
            @click="showDeleteDialog = true"
            class="w-full bg-white dark:bg-slate-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg p-4 text-sm font-medium transition-colors"
          >
            解散群组
          </button>
        </div>
      </div>
    </main>

    <ConfirmationModal
      :is-open="showLeaveDialog"
      title="离开群组"
      message="确定要离开这个群组吗？离开后将无法接收群消息。"
      confirm-text="离开"
      cancel-text="取消"
      :is-loading="isLeaving"
      @confirm="handleLeaveGroup"
      @cancel="showLeaveDialog = false"
    />

    <ConfirmationModal
      :is-open="showDeleteDialog"
      title="解散群组"
      message="确定要解散这个群组吗？解散后所有成员将被移除，此操作不可恢复。"
      confirm-text="解散"
      cancel-text="取消"
      :is-loading="isDeleting"
      @confirm="handleDeleteGroup"
      @cancel="showDeleteDialog = false"
    />

    <div
      v-if="showAnnouncementModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    >
      <div class="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
        <div class="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 class="text-base font-bold text-slate-900 dark:text-white">编辑群公告</h3>
          <button @click="showAnnouncementModal = false" class="text-slate-400 hover:text-slate-600">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="p-4">
          <textarea
            v-model="announcementInput"
            rows="5"
            placeholder="请输入群公告内容..."
            class="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/50 resize-none text-slate-900 dark:text-white placeholder:text-slate-400"
          ></textarea>
          <div class="mt-4 flex gap-3">
            <button
              @click="showAnnouncementModal = false"
              class="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm"
            >
              取消
            </button>
            <button
              @click="handleSaveAnnouncement"
              :disabled="isSavingAnnouncement"
              class="flex-1 py-3 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-50"
            >
              {{ isSavingAnnouncement ? '保存中...' : '保存并发布' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showEditModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    >
      <div class="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
        <div class="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 class="text-base font-bold text-slate-900 dark:text-white">编辑群信息</h3>
          <button @click="showEditModal = false" class="text-slate-400 hover:text-slate-600">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="p-4 space-y-4">
          <div class="flex justify-center">
            <div class="relative cursor-pointer" @click="handleEditAvatarClick">
              <div
                v-if="editAvatarPreview"
                class="size-20 rounded-xl bg-cover bg-center"
                :style="{ backgroundImage: `url(${editAvatarPreview})` }"
              ></div>
              <div
                v-else
                class="size-20 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center"
              >
                <span class="material-symbols-outlined text-white text-4xl">groups</span>
              </div>
              <div class="absolute -bottom-1 -right-1 bg-primary text-white size-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                <span v-if="!isUploadingAvatar" class="material-symbols-outlined" style="font-size: 14px">edit</span>
                <span v-else class="material-symbols-outlined animate-spin" style="font-size: 14px">progress_activity</span>
              </div>
            </div>
            <input
              ref="avatarFileInputRef"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              class="hidden"
              @change="handleEditAvatarFileSelect"
            />
          </div>

          <div>
            <label class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">群名称</label>
            <input
              v-model="editName"
              maxlength="50"
              placeholder="请输入群名称"
              class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">群简介</label>
            <textarea
              v-model="editDescription"
              rows="3"
              maxlength="200"
              placeholder="请输入群简介（选填）"
              class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            ></textarea>
          </div>

          <div class="flex gap-3 pt-1">
            <button
              @click="showEditModal = false"
              class="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm"
            >
              取消
            </button>
            <button
              @click="handleSaveEdit"
              :disabled="isSavingEdit"
              class="flex-1 py-3 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-50"
            >
              {{ isSavingEdit ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
