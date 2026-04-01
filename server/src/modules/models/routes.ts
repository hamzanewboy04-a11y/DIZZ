import type { Express } from 'express'
import type { CreateModelProfileDto, UpdateModelProfileDto } from '../../shared/models.js'
import { modelStorage } from './storage.js'

function toNumericId(value: string): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function registerModelRoutes(app: Express) {
  app.get('/api/model-profiles', async (_req, res) => {
    res.json(await modelStorage.list())
  })

  app.get('/api/model-profiles/:id', async (req, res) => {
    const id = toNumericId(req.params.id)
    if (!id) return res.status(400).json({ message: 'Invalid model profile id' })

    const profile = await modelStorage.getById(id)
    if (!profile) return res.status(404).json({ message: 'Model profile not found' })

    return res.json(profile)
  })

  app.post('/api/model-profiles', async (req, res) => {
    const body = req.body as Partial<CreateModelProfileDto>
    if (!body.name || !body.geo) {
      return res.status(400).json({ message: 'name and geo are required' })
    }

    const created = await modelStorage.create({
      name: body.name,
      geo: body.geo,
      description: body.description ?? null,
      projectId: body.projectId ?? null,
    })

    return res.status(201).json(created)
  })

  app.patch('/api/model-profiles/:id', async (req, res) => {
    const id = toNumericId(req.params.id)
    if (!id) return res.status(400).json({ message: 'Invalid model profile id' })

    const body = req.body as UpdateModelProfileDto
    const profile = await modelStorage.update(id, body)
    if (!profile) return res.status(404).json({ message: 'Model profile not found' })

    return res.json(profile)
  })
}
