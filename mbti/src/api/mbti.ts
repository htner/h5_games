import axios from 'axios'
import { hasBridge, bridgeRequest } from '../bridge'

const http = axios.create({
  baseURL: '/mbti/v1',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = window.__authToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use((res) => {
  const data = res.data
  if (data.res_code && data.res_code !== 0) {
    return Promise.reject(new Error(data.res_message || 'unknown error'))
  }
  return data
}, (err) => Promise.reject(err))

const api = {
  async get(path: string, params?: Record<string, any>): Promise<any> {
    if (hasBridge()) {
      const qs = params
        ? '?' + Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
        : ''
      return bridgeRequest('GET', `/mbti/v1${path}${qs}`)
    }
    return await http.get(path, { params })
  },

  async post(path: string, body?: Record<string, any>): Promise<any> {
    if (hasBridge()) {
      return bridgeRequest('POST', `/mbti/v1${path}`, body)
    }
    return await http.post(path, body)
  },
}

export const mbtiApi = {
  listPacks(region = '') {
    return api.get('/packs', { region })
  },

  createGame(roomId: number, targetUid: number, packId: number, totalQuestions: number) {
    return api.post('/game', {
      room_id: roomId,
      target_uid: targetUid,
      pack_id: packId,
      total_questions: totalQuestions,
    })
  },

  nextQuestion(gameId: number) {
    return api.post('/game/next', { game_id: gameId })
  },

  revealAnswer(gameId: number, showDistributionOnly = false) {
    return api.post('/game/reveal', { game_id: gameId, show_distribution_only: showDistributionOnly })
  },

  endGame(gameId: number) {
    return api.post('/game/end', { game_id: gameId })
  },

  submitTargetAnswer(gameId: number, questionId: number, answer: string) {
    return api.post('/game/target_answer', { game_id: gameId, question_id: questionId, answer })
  },

  joinGame(gameId: number) {
    return api.post('/game/join', { game_id: gameId })
  },

  vote(gameId: number, questionId: number, useBoost = false) {
    return api.post('/game/vote', { game_id: gameId, question_id: questionId, use_boost: useBoost })
  },

  submitGuess(gameId: number, questionId: number, answer: string, useBoost = false) {
    return api.post('/game/guess', {
      game_id: gameId,
      question_id: questionId,
      answer,
      use_boost: useBoost,
    })
  },

  getGameState(gameId: number) {
    return api.get('/game/state', { game_id: gameId })
  },

  getSettlement(gameId: number) {
    return api.get('/game/settlement', { game_id: gameId })
  },

  getProfile(gameId: number) {
    return api.get('/game/profile', { game_id: gameId })
  },
}
