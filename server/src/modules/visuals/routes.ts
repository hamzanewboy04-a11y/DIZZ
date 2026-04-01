import type { Express } from 'express'
import type {
  AssignVisualDto,
  UpdateVisualStatusDto,
} from '../../shared/visuals.js'
import { visualStorage } from './storage.js'

function toNumericId(value: string): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function registerVisualRoutes(app: Express) {
  app.get('/api/visuals', async (_req, res) => {
    res.json(await visualStorage.list())
  })

  app.get('/api/visuals/:id', async (req, res) => {
    const id = toNumericId(req.params.id)
    if (!id) return res.status(400).json({ message: 'Invalid visual id' })

    const visual = await visualStorage.getById(id)
    if (!visual) return res.status(404).json({ message: 'Visual not found' })

    return res.json(visual)
  })

  app.post('/api/visuals/:id/assign', async (req, res) => {
    const id = toNumericId(req.params.id)
    if (!id) return res.status(400).json({ message: 'Invalid visual id' })

    const body = req.body as Partial<AssignVisualDto>
    if (!body.assigneeId || !Number.isInteger(body.assigneeId)) {
      return res.status(400).json({ message: 'assigneeId is required' })
    }

    const visual = await visualStorage.assign(id, {
      assigneeId: body.assigneeId,
      actorUserId: body.actorUserId,
    })
    if (!visual) return res.status(404).json({ message: 'Visual not found' })

    return res.json(visual)
  })

  app.patch('/api/visuals/:id/take', async (req, res) => {
    const id = toNumericId(req.params.id)
    if (!id) return res.status(400).json({ message: 'Invalid visual id' })

    const current = await visualStorage.getById(id)
    if (!current) return res.status(404).json({ message: 'Visual not found' })
    if (!current.assignedDesignerId) return res.status(400).json({ message: 'Visual is not assigned' })

    const visual = await visualStorage.take(id, typeof req.body?.actorUserId === 'number' ? req.body.actorUserId : undefined)
    if (!visual) return res.status(404).json({ message: 'Visual not found' })

    return res.json(visual)
  })

  app.patch('/api/visuals/:id/status', async (req, res) => {
    const id = toNumericId(req.params.id)
    if (!id) return res.status(400).json({ message: 'Invalid visual id' })

    const body = req.body as Partial<UpdateVisualStatusDto>
    if (!body.status) return res.status(400).json({ message: 'status is required' })

    const visual = await visualStorage.updateStatus(id, {
      status: body.status,
      actorUserId: body.actorUserId,
      comment: body.comment,
    })
    if (!visual) return res.status(404).json({ message: 'Visual not found' })

    return res.json(visual)
  })
}
