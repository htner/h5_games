import http from './http'
import type { PackInfo, RankingItem, MBTIProfile } from '@/types/game'

export const mbtiApi = {
  listPacks(region = '') {
    return http.get<any, { packs: PackInfo[] }>('/packs', { params: { region } })
  },

  createGame(roomId: number, targetUid: number, packId: number, totalQuestions: number) {
    return http.post<any, { game_id: number }>('/game', {
      room_id: roomId,
      target_uid: targetUid,
      pack_id: packId,
      total_questions: totalQuestions,
    })
  },

  nextQuestion(gameId: number) {
    return http.post<any, any>('/game/next', { game_id: gameId })
  },

  revealAnswer(gameId: number, showDistributionOnly = false) {
    return http.post<any, {
      distribution: Record<string, number>
      correct_answer: string
      correct_pct: number
      correct_uids: number[]
      reveal_comment: string
    }>('/game/reveal', { game_id: gameId, show_distribution_only: showDistributionOnly })
  },

  endGame(gameId: number) {
    return http.post<any, any>('/game/end', { game_id: gameId })
  },

  submitTargetAnswer(gameId: number, questionId: number, answer: string) {
    return http.post<any, any>('/game/target_answer', {
      game_id: gameId,
      question_id: questionId,
      answer,
    })
  },

  joinGame(gameId: number) {
    return http.post<any, {
      phase: number
      current_question_idx: number
      total_questions: number
    }>('/game/join', { game_id: gameId })
  },

  vote(gameId: number, questionId: number, useBoost = false) {
    return http.post<any, any>('/game/vote', {
      game_id: gameId,
      question_id: questionId,
      use_boost: useBoost,
    })
  },

  submitGuess(gameId: number, questionId: number, answer: string, useBoost = false) {
    return http.post<any, any>('/game/guess', {
      game_id: gameId,
      question_id: questionId,
      answer,
      use_boost: useBoost,
    })
  },

  getGameState(gameId: number) {
    return http.get<any, any>('/game/state', { params: { game_id: gameId } })
  },

  getSettlement(gameId: number) {
    return http.get<any, { rankings: RankingItem[]; my_rank: number; my_score: number; total_players: number }>(
      '/game/settlement',
      { params: { game_id: gameId } },
    )
  },

  getProfile(gameId: number) {
    return http.get<any, { profile: MBTIProfile; target_uid: number; target_nickname: string; target_avatar_url: string }>(
      '/game/profile',
      { params: { game_id: gameId } },
    )
  },
}
