import type { Express } from 'express'
import * as mock from '../../../../shared/src/data/mock'
import type { CreateModelProfileDto, ModelProfileDetailDto, UpdateModelProfileDto } from '../../../../shared/src/types/models.js'

function toNumericId(value: string): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function toDetail(id: number): ModelProfileDetailDto | null {
  const profile = mock.modelProfiles.find((item) => item.id === id)
  if (!profile) return null

  return {
    ...profile,
    blocks: mock.modelProfileBlocks.filter((block) => block.profileId === id).sort((a, b) => a.sortOrder - b.sortOrder),
  }
}

export function registerModelRoutes(app: Express) {
  app.get('/api/model-profiles', (_req, res) => {
    res.json(mock.modelProfiles)
  })

  app.get('/api/model-profiles/:id', (req, res) => {
    const id = toNumericId(req.params.id)
    if (!id) return res.status(400).json({ message: 'Invalid model profile id' })

    const profile = toDetail(id)
    if (!profile) return res.status(404).json({ message: 'Model profile not found' })

    return res.json(profile)
  })

  app.post('/api/model-profiles', (req, res) => {
    const body = req.body as Partial<CreateModelProfileDto>
    if (!body.name || !body.geo) {
      return res.status(400).json({ message: 'name and geo are required' })
    }

    const created = {
      id: mock.modelProfiles.length > 0 ? Math.max(...mock.modelProfiles.map((item) => item.id)) + 1 : 1,
      name: body.name,
      geo: body.geo,
      age: null,
      description: body.description ?? null,
      projectId: body.projectId ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mock.modelProfiles.push(created)
    return res.status(201).json(created)
  })

  app.patch('/api/model-profiles/:id', (req, res) => {
    const id = toNumericId(req.params.id)
    if (!id) return res.status(400).json({ message: 'Invalid model profile id' })

    const profile = mock.modelProfiles.find((item) => item.id === id)
    if (!profile) return res.status(404).json({ message: 'Model profile not found' })

    const body = req.body as UpdateModelProfileDto
    if (body.name !== undefined) profile.name = body.name
    if (body.geo !== undefined) profile.geo = body.geo
    if (body.description !== undefined) profile.description = body.description ?? null
    if (body.projectId !== undefined) profile.projectId = body.projectId ?? null
    profile.updatedAt = new Date().toISOString()

    return res.json(profile)
  })
}
