<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { mbtiApi } from '@/api/mbti'
import { useGameStore } from '@/stores/game'
import type { PackInfo } from '@/types/game'

const router = useRouter()
const game = useGameStore()

const packs = ref<PackInfo[]>([])
const selectedPackId = ref(0)
const questionCount = ref(8)

onMounted(async () => {
  try {
    const res = await mbtiApi.listPacks()
    packs.value = res.packs || []
    if (packs.value.length > 0) {
      selectedPackId.value = packs.value[0].id
    }
  } catch (e) {
    console.error('load packs failed:', e)
  }
})

const loading = ref(false)

async function startGame() {
  if (loading.value) return
  loading.value = true
  try {
    const res = await mbtiApi.createGame(0, 0, selectedPackId.value, questionCount.value)
    game.gameId = res.game_id
    game.myRole = 'host'
    await mbtiApi.nextQuestion(res.game_id)
    router.push('/lobby')
  } catch (e) {
    console.error('create game failed:', e)
    loading.value = false
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
        :class="{ active: selectedPackId === pack.id }"
        @click="selectedPackId = pack.id"
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
        >{{ n }}</button>
      </div>
    </div>

    <button class="btn-primary start-btn" :disabled="loading" @click="startGame">
      {{ loading ? '创建中...' : '开始游戏' }}
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
  transition: all 0.2s;
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
  transition: all 0.2s;
}
.count-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}
.start-btn {
  width: 100%;
  margin-top: auto;
}
</style>
