import type { Express } from 'express'
import * as mock from '../../shared/mock.js'

export function registerTeamRoutes(app: Express) {
  app.get('/api/design-team/stats', (_req, res) => {
    res.json({
      designers: mock.users.filter((user) => user.roles.includes('designer')).length,
      reviewers: mock.users.filter((user) => user.roles.includes('reviewer')).length,
      smmManagers: mock.users.filter((user) => user.roles.includes('smm_manager')).length,
      activeCreatives: mock.creatives.filter((creative) => ['in_progress', 'review', 'revision'].includes(creative.status)).length,
      activeVisuals: mock.visuals.filter((visual) => ['in_progress', 'submitted', 'revision'].includes(visual.status)).length,
    })
  })

  app.get('/api/design-staff-settings', (_req, res) => {
    res.json(mock.designStaffSettings)
  })

  app.get('/api/staff-rate-periods', (_req, res) => {
    res.json(mock.staffRatePeriods)
  })

  app.get('/api/reviewer-reports', (_req, res) => {
    res.json(mock.reviewerReports)
  })

  app.get('/api/smm-reports', (_req, res) => {
    res.json(mock.smmReports)
  })
}
