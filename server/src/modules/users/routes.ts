import type { Express } from 'express'
import { userStorage } from './storage.js'

export function registerUserRoutes(app: Express) {
  app.get('/api/me', async (_req, res) => {
    try {
      res.json(await userStorage.getMe())
    } catch {
      res.status(404).json({ message: 'No users found' })
    }
  })

  app.get('/api/users', async (_req, res) => {
    res.json(await userStorage.list())
  })
}
