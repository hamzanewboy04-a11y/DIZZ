import type { Express } from 'express'
import type {
  AcceptCreativeDto,
  AssignCreativeDto,
  RequestCreativeRevisionDto,
  ReassignCreativeDto,
  SubmitCreativeReviewDto,
  UnassignCreativeDto,
} from '../../shared/creatives'
import { creativeService } from './service.js'

function toNumericId(value: string): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function handleAssign(req: { params: { id: string }; body: Partial<AssignCreativeDto> }, res: any) {
  const id = toNumericId(req.params.id)
  if (!id) return res.status(400).json({ message: 'Invalid creative id' })

  const payload = req.body
  if (!payload.assigneeId || !Number.isInteger(payload.assigneeId)) {
    return res.status(400).json({ message: 'assigneeId is required' })
  }

  try {
    const creative = creativeService.assign(id, {
      assigneeId: payload.assigneeId,
      price: payload.price,
      actorUserId: payload.actorUserId,
    })

    return res.json(creative)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Assign failed'
    const statusCode = message === 'Creative not found' ? 404 : 400
    return res.status(statusCode).json({ message })
  }
}

function handleReassign(req: { params: { id: string }; body: Partial<ReassignCreativeDto> }, res: any) {
  const id = toNumericId(req.params.id)
  if (!id) return res.status(400).json({ message: 'Invalid creative id' })

  const payload = req.body
  if (!payload.assigneeId || !Number.isInteger(payload.assigneeId)) {
    return res.status(400).json({ message: 'assigneeId is required' })
  }

  try {
    const creative = creativeService.reassign(id, {
      assigneeId: payload.assigneeId,
      price: payload.price,
      actorUserId: payload.actorUserId,
    })

    return res.json(creative)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Reassign failed'
    const statusCode = message === 'Creative not found' ? 404 : 400
    return res.status(statusCode).json({ message })
  }
}

function handleAccept(req: { params: { id: string }; body: AcceptCreativeDto }, res: any) {
  const id = toNumericId(req.params.id)
  if (!id) return res.status(400).json({ message: 'Invalid creative id' })

  try {
    const creative = creativeService.accept(id, req.body ?? {})
    return res.json(creative)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Accept failed'
    const statusCode = message === 'Creative not found' ? 404 : 400
    return res.status(statusCode).json({ message })
  }
}

function handleUnassign(req: { params: { id: string }; body: UnassignCreativeDto }, res: any) {
  const id = toNumericId(req.params.id)
  if (!id) return res.status(400).json({ message: 'Invalid creative id' })

  try {
    const creative = creativeService.unassign(id, req.body ?? {})
    return res.json(creative)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unassign failed'
    const statusCode = message === 'Creative not found' ? 404 : 400
    return res.status(statusCode).json({ message })
  }
}

function handleSubmitReview(req: { params: { id: string }; body: SubmitCreativeReviewDto }, res: any) {
  const id = toNumericId(req.params.id)
  if (!id) return res.status(400).json({ message: 'Invalid creative id' })

  try {
    const creative = creativeService.submitReview(id, req.body ?? {})
    return res.json(creative)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Submit review failed'
    const statusCode = message === 'Creative not found' ? 404 : 400
    return res.status(statusCode).json({ message })
  }
}

function handleRequestRevision(req: { params: { id: string }; body: RequestCreativeRevisionDto }, res: any) {
  const id = toNumericId(req.params.id)
  if (!id) return res.status(400).json({ message: 'Invalid creative id' })

  try {
    const creative = creativeService.requestRevision(id, req.body ?? {})
    return res.json(creative)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request revision failed'
    const statusCode = message === 'Creative not found' ? 404 : 400
    return res.status(statusCode).json({ message })
  }
}

export function registerCreativeRoutes(app: Express) {
  app.get('/api/creative-requests', (_req, res) => {
    res.json(creativeService.list())
  })

  app.get('/api/creative-requests/assigned', (_req, res) => {
    res.json(creativeService.listAssigned())
  })

  app.get('/api/creative-requests/my', (_req, res) => {
    const currentUserId = 3
    res.json(creativeService.listMine(currentUserId))
  })

  app.get('/api/creative-requests/:id', (req, res) => {
    const id = toNumericId(req.params.id)
    if (!id) return res.status(400).json({ message: 'Invalid creative id' })

    const creative = creativeService.getDetail(id)
    if (!creative) {
      return res.status(404).json({ message: 'Creative not found' })
    }

    return res.json(creative)
  })

  app.post('/api/creative-requests/:id/assign', handleAssign)
  app.post('/api/creative-requests/:id/detail/assign', handleAssign)
  app.post('/api/creative-requests/:id/reassign', handleReassign)
  app.post('/api/creative-requests/:id/unassign', handleUnassign)

  app.post('/api/creative-requests/:id/take-to-work', (req, res) => {
    const id = toNumericId(req.params.id)
    if (!id) return res.status(400).json({ message: 'Invalid creative id' })

    const actorUserId = typeof req.body?.actorUserId === 'number' ? req.body.actorUserId : undefined

    try {
      const creative = creativeService.takeToWork(id, actorUserId)
      return res.json(creative)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Take to work failed'
      const statusCode = message === 'Creative not found' ? 404 : 400
      return res.status(statusCode).json({ message })
    }
  })

  app.post('/api/creative-requests/:id/submit-review', handleSubmitReview)
  app.post('/api/creative-requests/:id/request-revision', handleRequestRevision)
  app.post('/api/creative-requests/:id/accept', handleAccept)
  app.post('/api/creative-requests/:id/detail/accept', handleAccept)
}
