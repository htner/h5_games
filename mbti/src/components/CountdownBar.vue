<script setup lang="ts">
defineProps<{
  progress: number
  seconds: number
  urgent: boolean
}>()
</script>

<template>
  <div class="countdown-bar">
    <div class="countdown-track">
      <div
        class="countdown-fill"
        :class="{ urgent }"
        :style="{ width: `${progress * 100}%` }"
      />
    </div>
    <span class="countdown-text" :class="{ urgent }">{{ seconds }}s</span>
  </div>
</template>

<style scoped>
.countdown-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}
.countdown-track {
  flex: 1;
  height: 8px;
  background: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}
.countdown-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 4px;
  transition: width 0.1s linear;
}
.countdown-fill.urgent {
  background: var(--color-danger);
}
.countdown-text {
  font-size: 13px;
  font-weight: 700;
  min-width: 32px;
  text-align: right;
  color: var(--color-text-secondary);
}
.countdown-text.urgent {
  color: var(--color-danger);
}
</style>
