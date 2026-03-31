import type { Express } from 'express'
import * as mock from '../../../../shared/src/data/mock'

export function registerUserRoutes(app: Express) {
  app.get('/api/me', (_req, res) => {
    res.json(mock.users[0])
  })

  app.get('/api/users', (_req, res) => {
    res.json(mock.users)
  })
}
