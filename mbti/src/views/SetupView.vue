<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { useUserStore } from '../stores/user'
import { mbtiApi } from '../api/mbti'

const router = useRouter()
const game = useGameStore()
const user = useUserStore()

interface PackInfo {
  id: number
  name: string
  icon: string
  description: string
}

const packs = ref<PackInfo[]>([])
const selectedPack = ref(0)
const questionCount = ref(8)
const creating = ref(false)

onMounted(async () => {
  try {
    const data = await mbtiApi.listPacks()
    packs.value = data.packs || []
    if (packs.value.length > 0) {
      selectedPack.value = packs.value[0].id
    }
  } catch (e) {
    console.error('load packs failed:', e)
  }
})

async function startGame() {
  if (creating.value) return
  creating.value = true
  try {
    const roomId = Number(user.roomId) || 0
    const result = await mbtiApi.createGame(roomId, 0, selectedPack.value, questionCount.value)
    game.gameId = result.game_id
    game.myRole = 'host'
    await mbtiApi.nextQuestion(result.game_id)
    // Don't navigate — wait for server push (mbti.guessing_started) to drive navigation
  } catch (e) {
    console.error('create game failed:', e)
    creating.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="page-title">选择卡包</div>

    <div class="pack-list">
      <div
        v-for="pack in packs"
        :key="pack.id"
        class="pack-card"
        :class="{ active: selectedPack === pack.id }"
        @click="selectedPack = pack.id"
      >
        <div class="pack-icon">{{ pack.icon }}</div>
        <div class="pack-body">
          <div class="pack-name">{{ pack.name }}</div>
          <div class="pack-desc">{{ pack.description }}</div>
        </div>
      </div>
    </div>

    <div class="question-count">
      <span class="count-label">题目数量</span>
      <div class="count-options">
        <button
          v-for="n in [5, 8, 10]"
          :key="n"
          class="count-btn"
          :class="{ active: questionCount === n }"
          @click="questionCount = n"
        >
          {{ n }}
        </button>
      </div>
    </div>

    <button
      class="btn-primary start-btn"
      :disabled="creating"
      @click="startGame"
    >
      {{ creating ? '创建中...' : '开始游戏' }}
    </button>
  </div>
</template>

<style scoped>
.pack-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 28px;
}
.pack-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all .2s;
  box-shadow: var(--shadow-card);
}
.pack-card.active {
  border-color: var(--color-primary);
  background: var(--color-bg-muted);
}
.pack-icon {
  font-size: 32px;
  flex-shrink: 0;
}
.pack-body {
  flex: 1;
  min-width: 0;
}
.pack-name {
  font-weight: 700;
  font-size: 15px;
}
.pack-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}
.question-count {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}
.count-label {
  font-size: 14px;
  font-weight: 600;
}
.count-options {
  display: flex;
  gap: 8px;
}
.count-btn {
  width: 48px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  color: var(--color-text);
  font-weight: 700;
  font-size: 14px;
  transition: all .2s;
}
.count-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}
.start-btn {
  width: 100%;
  margin-top: auto;
}
</style>
