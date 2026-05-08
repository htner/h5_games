<script setup lang="ts">
import { useGameStore } from '../stores/game'
import { useRouter } from 'vue-router'
import { bridge } from '../bridge'
import RankingList from '../components/RankingList.vue'

const game = useGameStore()
const router = useRouter()

function share() {
  bridge.shareCard('', `我在灵魂读心术中排名第 ${game.myRank} 名！`)
}

function goBack() {
  game.reset()
  router.push('/lobby')
}
</script>

<template>
  <div class="page">
    <div class="page-title">🏆 灵魂契合排行榜</div>

    <RankingList :items="game.ranking" />

    <div v-if="game.myRank > 0" class="my-rank card">
      <span>
        你的排名：第 <strong>{{ game.myRank }}</strong> 名 / 共 {{ game.totalPlayers }} 人
      </span>
    </div>

    <div class="actions">
      <button class="btn-primary" @click="share">分享排名</button>
      <button class="btn-secondary" @click="goBack">返回</button>
    </div>
  </div>
</template>

<style scoped>
.my-rank {
  text-align: center;
  padding: 14px;
  margin-top: 12px;
  font-size: 14px;
  color: var(--color-text-secondary);
}
.my-rank strong {
  color: var(--color-primary);
  font-size: 18px;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: auto;
  padding: 16px 0;
}
.btn-secondary {
  background: var(--color-bg-card);
  color: var(--color-text);
  padding: 14px 32px;
  border-radius: var(--radius-lg);
  font-size: 15px;
  font-weight: 700;
  border: 2px solid var(--color-border);
  box-shadow: var(--shadow-card);
}
</style>
