import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  GamePhase,
  UserRole,
  PackInfo,
  QuestionDetail,
  QuestionBrief,
  RankingItem,
  MBTIProfile,
  RevealedQuestion,
} from '@/types/game'

export const useGameStore = defineStore('game', () => {
  const gameId = ref<number | null>(null)
  const phase = ref<GamePhase>('idle')
  const myRole = ref<UserRole>('guesser')

  const packInfo = ref<PackInfo | null>(null)
  const totalQuestions = ref(0)
  const currentQuestionIdx = ref(0)
  const currentQuestion = ref<QuestionDetail | null>(null)
  const candidateQuestions = ref<QuestionBrief[]>([])

  const myGuess = ref<string | null>(null)
  const targetLocked = ref(false)
  const guessCount = ref(0)
  const deadlineMs = ref(0)

  const distribution = ref<Record<string, number>>({})
  const correctAnswer = ref<string | null>(null)
  const isCorrect = ref<boolean | null>(null)
  const streak = ref(0)
  const revealComment = ref('')

  const ranking = ref<RankingItem[]>([])
  const myRank = ref(0)
  const myScore = ref(0)
  const totalPlayers = ref(0)

  const profile = ref<MBTIProfile | null>(null)
  const revealed = ref<RevealedQuestion[]>([])

  const targetUid = ref(0)
  const targetNickname = ref('')
  const targetAvatarUrl = ref('')

  const progress = computed(() => {
    if (totalQuestions.value === 0) return 0
    return currentQuestionIdx.value / totalQuestions.value
  })

  function initGame(data: any) {
    gameId.value = data.game_id
    targetUid.value = data.target_uid
    totalQuestions.value = data.total_questions
    currentQuestionIdx.value = 0
    phase.value = 'setup'
    revealed.value = []
    ranking.value = []
    myScore.value = 0
    streak.value = 0
  }

  function startVoting(candidates: QuestionBrief[]) {
    phase.value = 'voting'
    candidateQuestions.value = candidates
  }

  function startGuessing(question: QuestionDetail, deadline: number) {
    phase.value = 'guessing'
    currentQuestion.value = question
    deadlineMs.value = deadline
    myGuess.value = null
    targetLocked.value = false
    guessCount.value = 0
  }

  function setTargetLocked() {
    targetLocked.value = true
  }

  function updateGuessCount(count: number) {
    guessCount.value = count
  }

  function showDistribution(dist: Record<string, number>) {
    phase.value = 'revealing'
    distribution.value = dist
    correctAnswer.value = null
  }

  function revealAnswer(data: any) {
    correctAnswer.value = data.correct_answer
    distribution.value = data.distribution || distribution.value
    revealComment.value = data.reveal_comment || ''

    if (myGuess.value && data.correct_answer) {
      isCorrect.value = myGuess.value === data.correct_answer
    }
    currentQuestionIdx.value++
  }

  function showStreak(data: any) {
    if (data.uid === targetUid.value) return
    streak.value = data.streak_count
  }

  function setProfile(data: any) {
    phase.value = 'profile'
    profile.value = {
      mbti_type: data.mbti_type,
      label: data.label,
      description: data.description,
      dimensions: data.dimensions,
    }
  }

  function setSettlement(data: any) {
    phase.value = 'settlement'
    ranking.value = data.rankings || []
    totalPlayers.value = data.total_players || 0
  }

  function reset() {
    gameId.value = null
    phase.value = 'idle'
    myRole.value = 'guesser'
    currentQuestion.value = null
    myGuess.value = null
    correctAnswer.value = null
    ranking.value = []
    profile.value = null
    revealed.value = []
  }

  return {
    gameId, phase, myRole,
    packInfo, totalQuestions, currentQuestionIdx, currentQuestion, candidateQuestions,
    myGuess, targetLocked, guessCount, deadlineMs,
    distribution, correctAnswer, isCorrect, streak, revealComment,
    ranking, myRank, myScore, totalPlayers,
    profile, revealed,
    targetUid, targetNickname, targetAvatarUrl,
    progress,
    initGame, startVoting, startGuessing, setTargetLocked, updateGuessCount,
    showDistribution, revealAnswer, showStreak, setProfile, setSettlement, reset,
  }
})
