import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { bridge } from '@/bridge/native'

export function useGameState() {
  const store = useGameStore()
  const router = useRouter()

  const handler = (event: string, data: any) => {
    switch (event) {
      case 'mbti.game_started':
        store.initGame(data)
        router.push('/lobby')
        break
      case 'mbti.voting_started':
        store.startVoting(data.candidates)
        router.push('/voting')
        break
      case 'mbti.guessing_started':
        store.startGuessing(
          {
            id: data.question_id,
            question: data.question,
            dimension: data.dimension,
            options: data.options,
          },
          data.deadline_ms,
        )
        store.currentQuestionIdx = data.q_idx
        store.totalQuestions = data.total
        router.push('/guessing')
        break
      case 'mbti.target_locked':
        store.setTargetLocked()
        break
      case 'mbti.guess_count':
        store.updateGuessCount(data.guess_count)
        break
      case 'mbti.reveal_distribution':
        store.showDistribution(data.distribution)
        router.push('/reveal')
        break
      case 'mbti.reveal_answer':
        store.revealAnswer(data)
        break
      case 'mbti.streak_alert':
        store.showStreak(data)
        break
      case 'mbti.profile_ready':
        store.setProfile(data)
        router.push('/profile')
        break
      case 'mbti.settlement':
        store.setSettlement(data)
        router.push('/settlement')
        break
      case 'mbti.game_ended':
        break
    }
  }

  onMounted(() => {
    bridge.onRoomPush(handler)
  })

  onUnmounted(() => {
    bridge.offRoomPush(handler)
  })
}
