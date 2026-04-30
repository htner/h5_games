<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  distribution: Record<string, number>
  correct: string | null
}>()

const items = computed(() => {
  const total = Object.values(props.distribution).reduce((a, b) => a + b, 0)
  return Object.entries(props.distribution).map(([key, count]) => ({
    label: key,
    count,
    pct: total > 0 ? Math.round((count / total) * 100) : 0,
    isCorrect: key === props.correct,
  })).sort((a, b) => b.count - a.count)
})
</script>

<template>
  <div class="dist-chart" v-if="items.length > 0">
    <div v-for="item in items" :key="item.label" class="dist-row">
      <span class="dist-label" :class="{ correct: item.isCorrect }">{{ item.label }}</span>
      <div class="dist-track">
        <div
          class="dist-fill"
          :class="{ correct: item.isCorrect }"
          :style="{ width: `${item.pct}%` }"
        />
      </div>
      <span class="dist-pct" :class="{ correct: item.isCorrect }">{{ item.pct }}%</span>
    </div>
  </div>
</template>

<style scoped>
.dist-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dist-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dist-label {
  min-width: 24px;
  font-weight: 700;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.dist-label.correct {
  color: var(--color-primary);
}
.dist-track {
  flex: 1;
  height: 24px;
  background: var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}
.dist-fill {
  height: 100%;
  background: #FFB5C2;
  border-radius: 12px;
  transition: width 0.5s ease-out;
}
.dist-fill.correct {
  background: var(--color-primary);
}
.dist-pct {
  min-width: 40px;
  text-align: right;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-secondary);
}
.dist-pct.correct {
  color: var(--color-primary);
}
</style>
