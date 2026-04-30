import { defineStore } from 'pinia'
import { ref } from 'vue'
import { bridge } from '@/bridge/native'

export const useUserStore = defineStore('user', () => {
  const uid = ref(0)
  const nickname = ref('')
  const avatarUrl = ref('')
  const vipLevel = ref(0)

  async function fetchUserInfo() {
    const info = await bridge.getUserInfo()
    if (info) {
      uid.value = info.uid
      nickname.value = info.nickname
      avatarUrl.value = info.avatar_url
      vipLevel.value = info.vip_level
    }
  }

  return { uid, nickname, avatarUrl, vipLevel, fetchUserInfo }
})
