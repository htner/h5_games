<script setup lang="ts">
import type { RankingEntry } from '../stores/game'

defineProps<{
  items: RankingEntry[]
}>()

const medals = ['🥇', '🥈', '🥉']
</script>

<template>
  <div class="ranking-list">
    <div
      v-for="(item, idx) in items"
      :key="item.uid"
      class="ranking-item fade-in"
      :class="{ top3: idx < 3 }"
    >
      <span class="rank-badge">{{ idx < 3 ? medals[idx] : `${idx + 1}.` }}</span>
      <div v-if="item.avatar_url" class="rank-avatar">
        <img :src="item.avatar_url" alt="" />
      </div>
      <div class="rank-info">
        <div class="rank-name">{{ item.nickname || `用户${item.uid}` }}</div>
        <div class="rank-stats">
          {{ item.correct_count }} 题命中 · 最高 {{ item.max_streak }} 连击
        </div>
      </div>
      <div class="rank-score">{{ item.score }}</div>
    </div>
  </div>
</template>

<style scoped>
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ranking-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.ranking-item.top3 {
  background: var(--color-bg-muted);
  border-color: #ffb5c2;
}
.rank-badge {
  font-size: 18px;
  min-width: 32px;
  text-align: center;
}
.rank-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid var(--color-border);
}
.rank-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.rank-info {
  flex: 1;
  min-width: 0;
}
.rank-name {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rank-stats {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}
.rank-score {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-primary);
}
</style>
