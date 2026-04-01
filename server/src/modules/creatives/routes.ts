import type { Express } from 'express'
import type {
  AcceptCreativeDto,
  AssignCreativeDto,
  RequestCreativeRevisionDto,
  ReassignCreativeDto,
  SubmitCreativeReviewDto,
  UnassignCreativeDto,
} from '../../shared/creatives.js'
import { creativeService } from './service.js'

function toNumericId(value: string): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

async function handleAssign(req: { params: { id: string }; body: Partial<AssignCreativeDto> }, res: any) {
  const id = toNumericId(req.params.id)
  if (!id) return res.status(400).json({ message: 'Invalid creative id' })

  const payload = req.body
  if (!payload.assigneeId || !Number.isInteger(payload.assigneeId)) {
    return res.status(400).json({ message: 'assigneeId is required' })
  }

  try {
    const creative = await creativeService.assign(id, {
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

async function handleReassign(req: { params: { id: string }; body: Partial<ReassignCreativeDto> }, res: any) {
  const id = toNumericId(req.params.id)
  if (!id) return res.status(400).json({ message: 'Invalid creative id' })

  const payload = req.body
  if (!payload.assigneeId || !Number.isInteger(payload.assigneeId)) {
    return res.status(400).json({ message: 'assigneeId is required' })
  }

  try {
    const creative = await creativeService.reassign(id, {
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

async function handleAccept(req: { params: { id: string }; body: AcceptCreativeDto }, res: any) {
  const id = toNumericId(req.params.id)
  if (!id) return res.status(400).json({ message: 'Invalid creative id' })

  try {
    const creative = await creativeService.accept(id, req.body ?? {})
    return res.json(creative)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Accept failed'
    const statusCode = message === 'Creative not found' ? 404 : 400
    return res.status(statusCode).json({ message })
  }
}

async function handleUnassign(req: { params: { id: string }; body: UnassignCreativeDto }, res: any) {
  const id = toNumericId(req.params.id)
  if (!id) return res.status(400).json({ message: 'Invalid creative id' })

  try {
    const creative = await creativeService.unassign(id, req.body ?? {})
    return res.json(creative)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unassign failed'
    const statusCode = message === 'Creative not found' ? 404 : 400
    return res.status(statusCode).json({ message })
  }
}

async function handleSubmitReview(req: { params: { id: string }; body: SubmitCreativeReviewDto }, res: any) {
  const id = toNumericId(req.params.id)
  if (!id) return res.status(400).json({ message: 'Invalid creative id' })

  try {
    const creative = await creativeService.submitReview(id, req.body ?? {})
    return res.json(creative)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Submit review failed'
    const statusCode = message === 'Creative not found' ? 404 : 400
    return res.status(statusCode).json({ message })
  }
}

async function handleRequestRevision(req: { params: { id: string }; body: RequestCreativeRevisionDto }, res: any) {
  const id = toNumericId(req.params.id)
  if (!id) return res.status(400).json({ message: 'Invalid creative id' })

  try {
    const creative = await creativeService.requestRevision(id, req.body ?? {})
    return res.json(creative)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request revision failed'
    const statusCode = message === 'Creative not found' ? 404 : 400
    return res.status(statusCode).json({ message })
  }
}

export function registerCreativeRoutes(app: Express) {
  app.get('/api/creative-requests', async (_req, res) => {
    res.json(await creativeService.list())
  })

  app.get('/api/creative-requests/assigned', async (_req, res) => {
    res.json(await creativeService.listAssigned())
  })

  app.get('/api/creative-requests/my', async (_req, res) => {
    const currentUserId = 3
    res.json(await creativeService.listMine(currentUserId))
  })

  app.get('/api/creative-requests/:id', async (req, res) => {
    const id = toNumericId(req.params.id)
    if (!id) return res.status(400).json({ message: 'Invalid creative id' })

    const creative = await creativeService.getDetail(id)
    if (!creative) {
      return res.status(404).json({ message: 'Creative not found' })
    }

    return res.json(creative)
  })

  app.post('/api/creative-requests/:id/assign', handleAssign)
  app.post('/api/creative-requests/:id/detail/assign', handleAssign)
  app.post('/api/creative-requests/:id/reassign', handleReassign)
  app.post('/api/creative-requests/:id/unassign', handleUnassign)

  app.post('/api/creative-requests/:id/take-to-work', async (req, res) => {
    const id = toNumericId(req.params.id)
    if (!id) return res.status(400).json({ message: 'Invalid creative id' })

    const actorUserId = typeof req.body?.actorUserId === 'number' ? req.body.actorUserId : undefined

    try {
      const creative = await creativeService.takeToWork(id, actorUserId)
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
