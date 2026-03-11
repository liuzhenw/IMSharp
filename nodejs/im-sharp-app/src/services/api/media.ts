import http from '../http'
import type { UploadFileResponse } from '@/types'

export const mediaApi = {
  // 上传文件
  async upload(file: File, onProgress?: (progress: number) => void): Promise<UploadFileResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await http.post<UploadFileResponse>('/api/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })

    return response.data
  },

  // 上传头像
  async uploadAvatar(file: File): Promise<UploadFileResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await http.post<UploadFileResponse>('/api/media/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  },
}
