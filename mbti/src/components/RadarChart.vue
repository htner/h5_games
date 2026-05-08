<script setup lang="ts">
defineProps<{
  dimensions: Array<{
    dimension: string
    dominant: string
    percentage: number
  }>
}>()

const colors = ['#FF5C80', '#D8B4FE', '#FF8FAB', '#BAE6FD']
</script>

<template>
  <div class="radar-chart">
    <div v-for="(dim, idx) in dimensions" :key="dim.dimension" class="dim-row">
      <span class="dim-left" :style="{ color: colors[idx % colors.length] }">
        {{ dim.dimension.split('-')[0] }}
      </span>
      <div class="dim-track">
        <div
          class="dim-fill"
          :style="{ width: `${dim.percentage}%`, background: colors[idx % colors.length] }"
        />
        <div class="dim-center" />
      </div>
      <span class="dim-right">{{ dim.dimension.split('-')[1] }}</span>
      <span class="dim-pct">{{ dim.percentage }}%</span>
    </div>
  </div>
</template>

<style scoped>
.radar-chart {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 0;
}
.dim-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dim-left, .dim-right {
  min-width: 20px;
  font-weight: 800;
  font-size: 14px;
}
.dim-left {
  text-align: right;
}
.dim-right {
  color: var(--color-text-secondary);
}
.dim-track {
  flex: 1;
  height: 10px;
  background: var(--color-border);
  border-radius: 5px;
  position: relative;
  overflow: hidden;
}
.dim-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 5px;
  transition: width .5s ease-out;
}
.dim-center {
  position: absolute;
  left: 50%;
  top: -2px;
  width: 2px;
  height: 14px;
  background: rgba(155, 138, 147, 0.3);
  transform: translateX(-50%);
}
.dim-pct {
  min-width: 36px;
  text-align: right;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-secondary);
}
</style>
