import * as mock from '../../shared/mock.js'
import { dbPool, hasDatabase } from '../../db/client.js'
import type { DesignStaffSetting, ReviewerReport, SmmReport, StaffRatePeriod, TeamStatsDto } from '../../shared/team.js'

type DesignStaffSettingRow = {
  id: number
  user_id: number
  role_label: string
  is_active: boolean
}

type StaffRatePeriodRow = {
  id: number
  user_id: number
  rate_label: string
  rate_value: string
  start_date: Date | string
  end_date: Date | string | null
}

type ReviewerReportRow = {
  id: number
  user_id: number
  date: Date | string
  geo: string
  big_reviews: number
  mini_reviews: number
  total_earned: string
}

type SmmReportRow = {
  id: number
  user_id: number
  date: Date | string
  channel_geo: string
  posts: number
  stories: number
  total_earned: string
}

function toIso(value: Date | string | null | undefined): string {
  if (!value) return new Date().toISOString()
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function mapDesignStaffSetting(row: DesignStaffSettingRow): DesignStaffSetting {
  return {
    id: row.id,
    userId: row.user_id,
    roleLabel: row.role_label,
    isActive: row.is_active,
  }
}

function mapStaffRatePeriod(row: StaffRatePeriodRow): StaffRatePeriod {
  return {
    id: row.id,
    userId: row.user_id,
    rateLabel: row.rate_label,
    rateValue: row.rate_value,
    startDate: toIso(row.start_date),
    endDate: row.end_date ? toIso(row.end_date) : null,
  }
}

function mapReviewerReport(row: ReviewerReportRow): ReviewerReport {
  return {
    id: row.id,
    userId: row.user_id,
    date: toIso(row.date),
    geo: row.geo,
    bigReviews: row.big_reviews,
    miniReviews: row.mini_reviews,
    totalEarned: row.total_earned,
  }
}

function mapSmmReport(row: SmmReportRow): SmmReport {
  return {
    id: row.id,
    userId: row.user_id,
    date: toIso(row.date),
    channelGeo: row.channel_geo,
    posts: row.posts,
    stories: row.stories,
    totalEarned: row.total_earned,
  }
}

class InMemoryTeamStorage {
  getStats(): TeamStatsDto {
    return {
      designers: mock.users.filter((user) => user.roles.includes('designer')).length,
      reviewers: mock.users.filter((user) => user.roles.includes('reviewer')).length,
      smmManagers: mock.users.filter((user) => user.roles.includes('smm_manager')).length,
      activeCreatives: mock.creatives.filter((creative) => ['in_progress', 'review', 'revision'].includes(creative.status)).length,
      activeVisuals: mock.visuals.filter((visual) => ['in_progress', 'submitted', 'revision'].includes(visual.status)).length,
    }
  }

  getDesignStaffSettings(): DesignStaffSetting[] {
    return mock.designStaffSettings
  }

  getStaffRatePeriods(): StaffRatePeriod[] {
    return mock.staffRatePeriods
  }

  getReviewerReports(): ReviewerReport[] {
    return mock.reviewerReports
  }

  getSmmReports(): SmmReport[] {
    return mock.smmReports
  }
}

class DatabaseTeamStorage {
  async getStats(): Promise<TeamStatsDto> {
    const [designers, reviewers, smmManagers, activeCreatives, activeVisuals] = await Promise.all([
      dbPool!.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM users WHERE 'designer' = ANY(roles)`),
      dbPool!.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM users WHERE 'reviewer' = ANY(roles)`),
      dbPool!.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM users WHERE 'smm_manager' = ANY(roles)`),
      dbPool!.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM creatives WHERE status IN ('in_progress', 'review', 'revision')`),
      dbPool!.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM visual_requests WHERE status IN ('in_progress', 'submitted', 'revision')`),
    ])

    return {
      designers: Number(designers.rows[0]?.count ?? 0),
      reviewers: Number(reviewers.rows[0]?.count ?? 0),
      smmManagers: Number(smmManagers.rows[0]?.count ?? 0),
      activeCreatives: Number(activeCreatives.rows[0]?.count ?? 0),
      activeVisuals: Number(activeVisuals.rows[0]?.count ?? 0),
    }
  }

  async getDesignStaffSettings(): Promise<DesignStaffSetting[]> {
    const result = await dbPool!.query<DesignStaffSettingRow>(`
      SELECT id, user_id, role_label, is_active
      FROM design_staff_settings
      ORDER BY id ASC
    `)

    return result.rows.map(mapDesignStaffSetting)
  }

  async getStaffRatePeriods(): Promise<StaffRatePeriod[]> {
    const result = await dbPool!.query<StaffRatePeriodRow>(`
      SELECT id, user_id, rate_label, rate_value, start_date, end_date
      FROM staff_rate_periods
      ORDER BY start_date DESC, id DESC
    `)

    return result.rows.map(mapStaffRatePeriod)
  }

  async getReviewerReports(): Promise<ReviewerReport[]> {
    const result = await dbPool!.query<ReviewerReportRow>(`
      SELECT id, user_id, date, geo, big_reviews, mini_reviews, total_earned
      FROM reviewer_reports
      ORDER BY date DESC, id DESC
    `)

    return result.rows.map(mapReviewerReport)
  }

  async getSmmReports(): Promise<SmmReport[]> {
    const result = await dbPool!.query<SmmReportRow>(`
      SELECT id, user_id, date, channel_geo, posts, stories, total_earned
      FROM smm_reports
      ORDER BY date DESC, id DESC
    `)

    return result.rows.map(mapSmmReport)
  }
}

const inMemoryStorage = new InMemoryTeamStorage()
const databaseStorage = hasDatabase() ? new DatabaseTeamStorage() : null

export const teamStorage = {
  getStats() {
    return databaseStorage ? databaseStorage.getStats() : inMemoryStorage.getStats()
  },
  getDesignStaffSettings() {
    return databaseStorage ? databaseStorage.getDesignStaffSettings() : inMemoryStorage.getDesignStaffSettings()
  },
  getStaffRatePeriods() {
    return databaseStorage ? databaseStorage.getStaffRatePeriods() : inMemoryStorage.getStaffRatePeriods()
  },
  getReviewerReports() {
    return databaseStorage ? databaseStorage.getReviewerReports() : inMemoryStorage.getReviewerReports()
  },
  getSmmReports() {
    return databaseStorage ? databaseStorage.getSmmReports() : inMemoryStorage.getSmmReports()
  },
}
