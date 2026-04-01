import type { Express } from 'express'
import { teamStorage } from './storage.js'

export function registerTeamRoutes(app: Express) {
  app.get('/api/design-team/stats', async (_req, res) => {
    res.json(await teamStorage.getStats())
  })

  app.get('/api/design-staff-settings', async (_req, res) => {
    res.json(await teamStorage.getDesignStaffSettings())
  })

  app.get('/api/staff-rate-periods', async (_req, res) => {
    res.json(await teamStorage.getStaffRatePeriods())
  })

  app.get('/api/reviewer-reports', async (_req, res) => {
    res.json(await teamStorage.getReviewerReports())
  })

  app.get('/api/smm-reports', async (_req, res) => {
    res.json(await teamStorage.getSmmReports())
  })
}
