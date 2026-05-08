<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '../stores/game'
import { useCountdown } from '../composables/useCountdown'
import { mbtiApi } from '../api/mbti'
import CountdownBar from '../components/CountdownBar.vue'

const game = useGameStore()
const countdown = useCountdown()
const selected = ref<number | null>(null)
const voted = ref(false)

countdown.start(game.deadlineMs, 20_000)

async function onVote(questionId: number) {
  if (voted.value) return
  selected.value = questionId
  voted.value = true
  try {
    await mbtiApi.vote(game.gameId!, questionId)
  } catch (e) {
    console.error('vote failed:', e)
  }
}
</script>

<template>
  <div class="page">
    <div class="page-title">你最想揭开 TA 的哪一面？</div>

    <div class="countdown-wrap card">
      <CountdownBar
        :progress="countdown.progress.value"
        :seconds="countdown.seconds()"
        :urgent="countdown.isUrgent.value"
      />
    </div>

    <div class="candidate-list">
      <div
        v-for="c in game.candidateQuestions"
        :key="c.id"
        class="candidate-card card fade-in"
        :class="{ selected: selected === c.id, voted }"
        @click="onVote(c.id)"
      >
        <div class="candidate-q">{{ c.question }}</div>
        <div class="candidate-dim">{{ c.dimension }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.countdown-wrap {
  padding: 14px 16px;
  margin-bottom: 16px;
}
.candidate-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.candidate-card {
  padding: 18px 16px;
  border: 2px solid var(--color-border);
  transition: all .2s;
}
.candidate-card.selected {
  border-color: var(--color-primary);
  background: var(--color-bg-muted);
}
.candidate-card.voted:not(.selected) {
  opacity: .45;
}
.candidate-q {
  font-size: 14px;
  line-height: 1.5;
  font-weight: 600;
}
.candidate-dim {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-top: 6px;
}
</style>
