import type { Express } from 'express'
import { projectStorage } from './storage.js'

export function registerProjectRoutes(app: Express) {
  app.get('/api/projects', async (_req, res) => {
    res.json(await projectStorage.list())
  })
}
