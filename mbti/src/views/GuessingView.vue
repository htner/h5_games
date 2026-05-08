<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '../stores/game'
import { useCountdown } from '../composables/useCountdown'
import { mbtiApi } from '../api/mbti'
import CountdownBar from '../components/CountdownBar.vue'
import OptionButton from '../components/OptionButton.vue'

const game = useGameStore()
const countdown = useCountdown()
const submitted = ref(false)

countdown.start(game.deadlineMs, 30_000)

const isTarget = game.myRole === 'target'

async function onSelect(value: string) {
  if (submitted.value) return
  game.myGuess = value
  submitted.value = true
  try {
    if (isTarget) {
      await mbtiApi.submitTargetAnswer(game.gameId!, game.currentQuestion!.id, value)
    } else {
      await mbtiApi.submitGuess(game.gameId!, game.currentQuestion!.id, value)
    }
  } catch (e) {
    console.error('submit failed:', e)
    submitted.value = false
    game.myGuess = null
  }
}
</script>

<template>
  <div class="page">
    <div class="guess-header card">
      <div class="q-progress">
        {{ game.currentQuestionIdx + 1 }} / {{ game.totalQuestions }}
      </div>
      <CountdownBar
        :progress="countdown.progress.value"
        :seconds="countdown.seconds()"
        :urgent="countdown.isUrgent.value"
      />
    </div>

    <div class="question-card card fade-in">
      <div class="question-text">{{ game.currentQuestion?.question }}</div>
      <div v-if="isTarget" class="question-hint">请选择你的真实答案</div>
      <div v-else class="question-hint">猜猜 TA 会选什么？</div>
    </div>

    <div class="options-area">
      <OptionButton
        v-for="opt in game.currentQuestion?.options"
        :key="opt.value"
        :text="opt.text"
        :value="opt.value"
        :selected="game.myGuess === opt.value"
        :disabled="submitted"
        @select="onSelect"
      />
    </div>

    <div v-if="!isTarget" class="status-bar">
      <span v-if="game.targetLocked" class="locked-text">🔒 TA 已做出选择...</span>
      <span class="guess-stat">{{ game.guessCount }} 人已猜测</span>
    </div>
  </div>
</template>

<style scoped>
.guess-header {
  margin-bottom: 12px;
  padding: 14px 16px;
}
.q-progress {
  text-align: center;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 10px;
  font-weight: 600;
}
.question-card {
  text-align: center;
  margin-bottom: 20px;
  padding: 20px 16px;
}
.question-text {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.6;
  margin-bottom: 8px;
}
.question-hint {
  font-size: 12px;
  color: var(--color-text-secondary);
}
.options-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.locked-text {
  color: var(--color-warning);
  font-weight: 600;
}
</style>
