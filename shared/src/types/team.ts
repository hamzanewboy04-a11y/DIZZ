export type ReviewerReport = {
  id: number
  userId: number
  date: string
  geo: string
  bigReviews: number
  miniReviews: number
  totalEarned: string
}

export type SmmReport = {
  id: number
  userId: number
  date: string
  channelGeo: string
  posts: number
  stories: number
  totalEarned: string
}

export type DesignStaffSetting = {
  id: number
  userId: number
  roleLabel: string
  isActive: boolean
}

export type StaffRatePeriod = {
  id: number
  userId: number
  rateLabel: string
  rateValue: string
  startDate: string
  endDate: string | null
}

export type TeamStatsDto = {
  designers: number
  reviewers: number
  smmManagers: number
  activeCreatives: number
  activeVisuals: number
}
