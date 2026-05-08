import { defineStore } from 'pinia'
import { ref } from 'vue'
import { bridge } from '../bridge'

export const useUserStore = defineStore('user', () => {
  const uid = ref(0)
  const nickname = ref('')
  const avatarUrl = ref('')
  const vipLevel = ref(0)

  const roomId = ref('')
  const isHost = ref(false)

  async function fetchUserInfo() {
    const info = await bridge.getUserInfo()
    if (info) {
      uid.value = info.uid
      nickname.value = info.nickname
      avatarUrl.value = info.avatar_url
      vipLevel.value = info.vip_level
    }
  }

  function setRoomContext(ctx: {
    uid: number
    room_id: string
    is_host?: boolean
  }) {
    uid.value = ctx.uid
    roomId.value = ctx.room_id
    isHost.value = ctx.is_host ?? false
  }

  return {
    uid,
    nickname,
    avatarUrl,
    vipLevel,
    roomId,
    isHost,
    fetchUserInfo,
    setRoomContext,
  }
})
