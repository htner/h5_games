import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { useUserStore } from '../stores/user'
import { bridge } from '../bridge'

export function useGameState() {
  const game = useGameStore()
  const user = useUserStore()
  const router = useRouter()

  const handler = (event: string, data: any) => {
    switch (event) {
      case '__room_context':
        user.setRoomContext(data)
        break

      case 'mbti.game_started':
        game.initGame(data)
        router.push('/lobby')
        break

      case 'mbti.voting_started':
        game.startVoting(data.candidates)
        router.push('/voting')
        break

      case 'mbti.guessing_started':
        game.startGuessing(
          {
            id: data.question_id,
            question: data.question,
            dimension: data.dimension,
            options: data.options,
          },
          data.deadline_ms,
        )
        game.currentQuestionIdx = data.q_idx
        game.totalQuestions = data.total
        router.push('/guessing')
        break

      case 'mbti.target_locked':
        game.setTargetLocked()
        break

      case 'mbti.guess_count':
        game.updateGuessCount(data.guess_count)
        break

      case 'mbti.reveal_distribution':
        game.showDistribution(data.distribution)
        router.push('/reveal')
        break

      case 'mbti.reveal_answer':
        game.revealAnswer(data)
        break

      case 'mbti.streak_alert':
        game.showStreak(data)
        break

      case 'mbti.profile_ready':
        game.setProfile(data)
        router.push('/profile')
        break

      case 'mbti.settlement':
        game.setSettlement(data)
        router.push('/settlement')
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
