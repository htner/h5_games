<script setup lang="ts">
import { useGameState } from '@/composables/useGameState'

useGameState()
</script>

<template>
  <router-view />
</template>
