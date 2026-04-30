import { ref, onUnmounted } from 'vue'

export function useCountdown() {
  const remaining = ref(0)
  const total = ref(0)
  const progress = ref(1)
  const isUrgent = ref(false)

  let timer: ReturnType<typeof setInterval> | null = null

  function start(deadlineMs: number, totalMs?: number) {
    stop()
    const now = Date.now()
    const diff = deadlineMs - now
    total.value = totalMs ?? diff
    remaining.value = Math.max(0, diff)
    progress.value = total.value > 0 ? remaining.value / total.value : 0
    isUrgent.value = remaining.value <= 10000

    timer = setInterval(() => {
      const nowMs = Date.now()
      remaining.value = Math.max(0, deadlineMs - nowMs)
      progress.value = total.value > 0 ? remaining.value / total.value : 0
      isUrgent.value = remaining.value <= 10000

      if (remaining.value <= 0) {
        stop()
      }
    }, 100)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  const seconds = () => Math.ceil(remaining.value / 1000)

  onUnmounted(stop)

  return { remaining, total, progress, isUrgent, seconds, start, stop }
}
