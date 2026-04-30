<script setup lang="ts">
import { useGameStore } from '@/stores/game'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const game = useGameStore()
const user = useUserStore()
const router = useRouter()

user.fetchUserInfo()

function onSetup() {
  router.push('/setup')
}
</script>

<template>
  <div class="page">
    <div class="lobby-header">
      <div class="lobby-emoji">🎭</div>
      <h1 class="lobby-title">灵魂读心术</h1>
      <p class="lobby-subtitle">测测你有多懂 TA</p>
    </div>

    <div class="lobby-content">
      <div v-if="game.phase === 'idle'" class="lobby-idle card fade-in">
        <div class="lobby-icon">🔮</div>
        <p class="lobby-hint">等待主播发起游戏...</p>
        <button class="btn-primary lobby-btn" @click="onSetup">发起游戏</button>
      </div>
      <div v-else class="lobby-active card fade-in">
        <p class="active-label">游戏进行中</p>
        <p class="active-progress">第 {{ game.currentQuestionIdx + 1 }} / {{ game.totalQuestions }} 题</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lobby-header {
  text-align: center;
  padding: 48px 0 20px;
}
.lobby-emoji {
  font-size: 56px;
  margin-bottom: 12px;
}
.lobby-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-primary);
}
.lobby-subtitle {
  color: var(--color-text-secondary);
  margin-top: 6px;
  font-size: 14px;
}
.lobby-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
}
.lobby-idle {
  text-align: center;
  padding: 32px 24px;
  width: 100%;
}
.lobby-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.lobby-hint {
  color: var(--color-text-secondary);
  margin-bottom: 28px;
  font-size: 14px;
}
.lobby-btn {
  width: 100%;
}
.lobby-active {
  text-align: center;
  padding: 28px 24px;
  width: 100%;
}
.active-label {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
}
.active-progress {
  color: var(--color-primary);
  font-size: 20px;
  font-weight: 800;
}
</style>
