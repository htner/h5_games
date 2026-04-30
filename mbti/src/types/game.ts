export type GamePhase = 'idle' | 'setup' | 'voting' | 'guessing' | 'revealing' | 'profile' | 'settlement'
export type UserRole = 'host' | 'target' | 'guesser'

export interface PackInfo {
  id: number
  name: string
  icon: string
  dimensions: string
  description: string
}

export interface OptionItem {
  text: string
  value: string
}

export interface QuestionBrief {
  id: number
  question: string
  dimension: string
}

export interface QuestionDetail {
  id: number
  question: string
  dimension: string
  options: OptionItem[]
}

export interface RankingItem {
  uid: number
  nickname: string
  avatar_url: string
  score: number
  correct_count: number
  max_streak: number
  rank: number
  compatibility_pct: number
}

export interface MBTIDimension {
  dimension: string
  dominant: string
  percentage: number
}

export interface MBTIProfile {
  mbti_type: string
  label: string
  description: string
  dimensions: MBTIDimension[]
}

export interface RevealedQuestion {
  question_id: number
  question: string
  correct_answer: string
  my_correct: boolean
}
