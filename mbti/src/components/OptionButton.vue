<script setup lang="ts">
const props = defineProps<{
  text: string
  value: string
  selected: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  select: [value: string]
}>()

function onClick() {
  if (!props.disabled) {
    emit('select', props.value)
  }
}
</script>

<template>
  <button
    class="option-btn"
    :class="{ selected, disabled }"
    @click="onClick"
  >
    <span class="option-text">{{ text }}</span>
    <span v-if="selected" class="option-check">✓</span>
  </button>
</template>

<style scoped>
.option-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px 18px;
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  text-align: left;
  transition: all 0.2s;
}
.option-btn:active:not(.disabled) {
  transform: scale(0.98);
}
.option-btn.selected {
  border-color: var(--color-primary);
  background: var(--color-bg-muted);
}
.option-btn.disabled:not(.selected) {
  opacity: 0.5;
}
.option-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
}
.option-check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
