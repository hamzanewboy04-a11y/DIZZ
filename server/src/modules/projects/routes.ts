import type { Express } from 'express'
import * as mock from '../../shared/mock'

export function registerProjectRoutes(app: Express) {
  app.get('/api/projects', (_req, res) => {
    res.json(mock.projects)
  })
}
