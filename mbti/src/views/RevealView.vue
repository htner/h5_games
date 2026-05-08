<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import { mbtiApi } from '../api/mbti'
import DistributionChart from '../components/DistributionChart.vue'

const game = useGameStore()
const canControl = game.myRole === 'host' || game.myRole === 'target'
const hasAnswer = computed(() => game.correctAnswer !== null)

async function showDist() {
  try {
    await mbtiApi.revealAnswer(game.gameId!, true)
  } catch (e) {
    console.error('show dist failed:', e)
  }
}

async function reveal() {
  try {
    await mbtiApi.revealAnswer(game.gameId!, false)
  } catch (e) {
    console.error('reveal failed:', e)
  }
}
</script>

<template>
  <div class="page">
    <div class="page-title">答案揭晓</div>

    <div class="question-card card fade-in">
      <div class="question-text">{{ game.currentQuestion?.question }}</div>
    </div>

    <div class="dist-area card">
      <DistributionChart
        :distribution="game.distribution"
        :correct="game.correctAnswer"
      />
    </div>

    <div v-if="hasAnswer" class="result-card card fade-in">
      <div class="correct-answer">
        ✨ TA 的真实答案是：<strong>{{ game.correctAnswer }}</strong>
      </div>
      <div v-if="game.isCorrect !== null" class="correct-pct">
        <span v-if="game.isCorrect" class="result-correct">🎉 你猜对了！</span>
        <span v-else class="result-wrong">😅 翻车了</span>
      </div>
      <div v-if="game.revealComment" class="reveal-comment">{{ game.revealComment }}</div>
    </div>

    <div v-if="canControl && !hasAnswer" class="reveal-actions">
      <button
        v-if="Object.keys(game.distribution).length === 0"
        class="btn-primary"
        @click="showDist"
      >
        展示猜测分布
      </button>
      <button v-else class="btn-primary" @click="reveal">
        揭晓答案
      </button>
    </div>
  </div>
</template>

<style scoped>
.question-card {
  text-align: center;
  margin-bottom: 16px;
  padding: 20px 16px;
}
.question-text {
  font-size: 15px;
  line-height: 1.6;
  font-weight: 600;
}
.dist-area {
  padding: 20px 16px;
  margin-bottom: 16px;
}
.result-card {
  text-align: center;
  padding: 24px 16px;
  background: var(--color-bg-muted);
  border: 1px solid #FDE68A;
}
.correct-answer {
  font-size: 18px;
  margin-bottom: 10px;
}
.correct-answer strong {
  color: var(--color-primary);
  font-size: 20px;
}
.result-correct {
  color: var(--color-success);
  font-size: 16px;
  font-weight: 700;
}
.result-wrong {
  color: var(--color-danger);
  font-size: 16px;
  font-weight: 700;
}
.reveal-comment {
  color: var(--color-text-secondary);
  font-size: 13px;
  margin-top: 14px;
  font-style: italic;
  line-height: 1.5;
}
.reveal-actions {
  margin-top: auto;
  padding: 16px 0;
}
.reveal-actions .btn-primary {
  width: 100%;
}
</style>
