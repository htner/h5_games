<script setup lang="ts">
import { useGameStore } from '../stores/game'
import { useRouter } from 'vue-router'
import RadarChart from '../components/RadarChart.vue'

const game = useGameStore()
const router = useRouter()

function goSettlement() {
  router.push('/settlement')
}
</script>

<template>
  <div class="page">
    <div class="page-title">🎭 本局灵魂画像</div>

    <div v-if="game.profile" class="profile-card card fade-in">
      <div class="mbti-type">{{ game.profile.mbti_type }}</div>
      <div class="mbti-label">{{ game.profile.label }}</div>
      <div class="mbti-desc">{{ game.profile.description }}</div>
      <RadarChart :dimensions="game.profile.dimensions" />
    </div>

    <button class="btn-primary next-btn" @click="goSettlement">查看排行榜</button>
  </div>
</template>

<style scoped>
.profile-card {
  text-align: center;
  padding: 28px 20px;
  margin-bottom: 20px;
}
.mbti-type {
  font-size: 48px;
  font-weight: 900;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 6px;
  letter-spacing: 2px;
}
.mbti-label {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}
.mbti-desc {
  color: var(--color-text-secondary);
  font-size: 13px;
  margin-bottom: 20px;
  line-height: 1.5;
}
.next-btn {
  width: 100%;
  margin-top: auto;
}
</style>
