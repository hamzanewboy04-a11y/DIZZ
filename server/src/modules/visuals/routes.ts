import type { Express } from 'express'
import * as mock from '../../../../shared/src/data/mock'
import type {
  AssignVisualDto,
  UpdateVisualStatusDto,
  VisualDetailDto,
  VisualRequestStatus,
} from '../../../../shared/src/types/visuals.js'

function resolveUserName(userId: number | null): string | null {
  if (userId === null) return null
  return mock.users.find((user) => user.id === userId)?.name ?? null
}

function toDetail(id: number): VisualDetailDto | null {
  const visual = mock.visuals.find((item) => item.id === id)
  if (!visual) return null

  return {
    ...visual,
    requesterName: resolveUserName(visual.requesterId),
    assignedDesignerName: resolveUserName(visual.assignedDesignerId),
    statusLogs: mock.visualStatusLogs.filter((log) => log.visualRequestId === id),
  }
}

function toNumericId(value: string): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function pushStatusLog(input: {
  visualRequestId: number
  fromStatus: VisualRequestStatus | null
  toStatus: VisualRequestStatus
  changedById?: number
  comment?: string
}) {
  mock.visualStatusLogs.push({
    id: mock.visualStatusLogs.length > 0 ? Math.max(...mock.visualStatusLogs.map((item) => item.id)) + 1 : 1,
    visualRequestId: input.visualRequestId,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    changedById: input.changedById ?? null,
    comment: input.comment ?? null,
    createdAt: new Date().toISOString(),
  })
}

export function registerVisualRoutes(app: Express) {
  app.get('/api/visuals', (_req, res) => {
    res.json(mock.visuals)
  })

  app.get('/api/visuals/:id', (req, res) => {
    const id = toNumericId(req.params.id)
    if (!id) return res.status(400).json({ message: 'Invalid visual id' })

    const visual = toDetail(id)
    if (!visual) return res.status(404).json({ message: 'Visual not found' })

    return res.json(visual)
  })

  app.post('/api/visuals/:id/assign', (req, res) => {
    const id = toNumericId(req.params.id)
    if (!id) return res.status(400).json({ message: 'Invalid visual id' })

    const body = req.body as Partial<AssignVisualDto>
    if (!body.assigneeId || !Number.isInteger(body.assigneeId)) {
      return res.status(400).json({ message: 'assigneeId is required' })
    }

    const visual = mock.visuals.find((item) => item.id === id)
    if (!visual) return res.status(404).json({ message: 'Visual not found' })

    const previousStatus = visual.status
    visual.assignedDesignerId = body.assigneeId
    if (visual.status === 'new') visual.status = 'in_progress'
    visual.updatedAt = new Date().toISOString()

    pushStatusLog({
      visualRequestId: id,
      fromStatus: previousStatus,
      toStatus: visual.status,
      changedById: body.actorUserId,
      comment: `Assigned to user #${body.assigneeId}`,
    })

    return res.json(toDetail(id))
  })

  app.patch('/api/visuals/:id/take', (req, res) => {
    const id = toNumericId(req.params.id)
    if (!id) return res.status(400).json({ message: 'Invalid visual id' })

    const visual = mock.visuals.find((item) => item.id === id)
    if (!visual) return res.status(404).json({ message: 'Visual not found' })
    if (!visual.assignedDesignerId) return res.status(400).json({ message: 'Visual is not assigned' })

    const previousStatus = visual.status
    visual.status = 'in_progress'
    visual.updatedAt = new Date().toISOString()

    pushStatusLog({
      visualRequestId: id,
      fromStatus: previousStatus,
      toStatus: visual.status,
      changedById: typeof req.body?.actorUserId === 'number' ? req.body.actorUserId : undefined,
      comment: 'Taken to work',
    })

    return res.json(toDetail(id))
  })

  app.patch('/api/visuals/:id/status', (req, res) => {
    const id = toNumericId(req.params.id)
    if (!id) return res.status(400).json({ message: 'Invalid visual id' })

    const body = req.body as Partial<UpdateVisualStatusDto>
    if (!body.status) return res.status(400).json({ message: 'status is required' })

    const visual = mock.visuals.find((item) => item.id === id)
    if (!visual) return res.status(404).json({ message: 'Visual not found' })

    const previousStatus = visual.status
    visual.status = body.status
    visual.updatedAt = new Date().toISOString()

    pushStatusLog({
      visualRequestId: id,
      fromStatus: previousStatus,
      toStatus: body.status,
      changedById: body.actorUserId,
      comment: body.comment,
    })

    return res.json(toDetail(id))
  })
}
