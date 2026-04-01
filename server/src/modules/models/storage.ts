import * as mock from '../../shared/mock.js'
import { dbPool, hasDatabase } from '../../db/client.js'
import type {
  CreateModelProfileDto,
  ModelProfile,
  ModelProfileBlock,
  ModelProfileDetailDto,
  UpdateModelProfileDto,
} from '../../shared/models.js'

type ModelProfileRow = {
  id: number
  name: string
  geo: string
  age: number | null
  description: string | null
  project_id: number | null
  created_at: Date | string
  updated_at: Date | string
}

type ModelProfileBlockRow = {
  id: number
  profile_id: number
  title: string
  content: string
  sort_order: number
}

function toIso(value: Date | string | null | undefined): string {
  if (!value) return new Date().toISOString()
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function mapProfileRow(row: ModelProfileRow): ModelProfile {
  return {
    id: row.id,
    name: row.name,
    geo: row.geo,
    age: row.age,
    description: row.description,
    projectId: row.project_id,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }
}

function mapBlockRow(row: ModelProfileBlockRow): ModelProfileBlock {
  return {
    id: row.id,
    profileId: row.profile_id,
    title: row.title,
    content: row.content,
    sortOrder: row.sort_order,
  }
}

class InMemoryModelStorage {
  list(): ModelProfile[] {
    return mock.modelProfiles
  }

  getById(id: number): ModelProfileDetailDto | null {
    const profile = mock.modelProfiles.find((item) => item.id === id)
    if (!profile) return null

    return {
      ...profile,
      blocks: mock.modelProfileBlocks.filter((block) => block.profileId === id).sort((a, b) => a.sortOrder - b.sortOrder),
    }
  }

  create(payload: CreateModelProfileDto): ModelProfile {
    const created: ModelProfile = {
      id: mock.modelProfiles.length > 0 ? Math.max(...mock.modelProfiles.map((item) => item.id)) + 1 : 1,
      name: payload.name,
      geo: payload.geo,
      age: null,
      description: payload.description ?? null,
      projectId: payload.projectId ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mock.modelProfiles.push(created)
    return created
  }

  update(id: number, payload: UpdateModelProfileDto): ModelProfile | null {
    const profile = mock.modelProfiles.find((item) => item.id === id)
    if (!profile) return null

    if (payload.name !== undefined) profile.name = payload.name
    if (payload.geo !== undefined) profile.geo = payload.geo
    if (payload.description !== undefined) profile.description = payload.description ?? null
    if (payload.projectId !== undefined) profile.projectId = payload.projectId ?? null
    profile.updatedAt = new Date().toISOString()

    return profile
  }
}

class DatabaseModelStorage {
  async list(): Promise<ModelProfile[]> {
    const result = await dbPool!.query<ModelProfileRow>(`
      SELECT id, name, geo, age, description, project_id, created_at, updated_at
      FROM model_profiles
      ORDER BY updated_at DESC, id DESC
    `)

    return result.rows.map(mapProfileRow)
  }

  async getById(id: number): Promise<ModelProfileDetailDto | null> {
    const profileResult = await dbPool!.query<ModelProfileRow>(`
      SELECT id, name, geo, age, description, project_id, created_at, updated_at
      FROM model_profiles
      WHERE id = $1
      LIMIT 1
    `, [id])

    const profile = profileResult.rows[0]
    if (!profile) return null

    const blocksResult = await dbPool!.query<ModelProfileBlockRow>(`
      SELECT id, profile_id, title, content, sort_order
      FROM model_profile_blocks
      WHERE profile_id = $1
      ORDER BY sort_order ASC, id ASC
    `, [id])

    return {
      ...mapProfileRow(profile),
      blocks: blocksResult.rows.map(mapBlockRow),
    }
  }

  async create(payload: CreateModelProfileDto): Promise<ModelProfile> {
    const result = await dbPool!.query<ModelProfileRow>(`
      INSERT INTO model_profiles (name, geo, age, description, project_id)
      VALUES ($1, $2, NULL, $3, $4)
      RETURNING id, name, geo, age, description, project_id, created_at, updated_at
    `, [payload.name, payload.geo, payload.description ?? null, payload.projectId ?? null])

    return mapProfileRow(result.rows[0])
  }

  async update(id: number, payload: UpdateModelProfileDto): Promise<ModelProfile | null> {
    const result = await dbPool!.query<ModelProfileRow>(`
      UPDATE model_profiles
      SET
        name = COALESCE($2, name),
        geo = COALESCE($3, geo),
        description = CASE WHEN $4::text IS NULL THEN description ELSE $4 END,
        project_id = CASE WHEN $5::integer IS NULL THEN project_id ELSE $5 END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, geo, age, description, project_id, created_at, updated_at
    `, [
      id,
      payload.name ?? null,
      payload.geo ?? null,
      payload.description === undefined ? null : payload.description,
      payload.projectId === undefined ? null : payload.projectId,
    ])

    return result.rows[0] ? mapProfileRow(result.rows[0]) : null
  }
}

const inMemoryStorage = new InMemoryModelStorage()
const databaseStorage = hasDatabase() ? new DatabaseModelStorage() : null

export const modelStorage = {
  list() {
    return databaseStorage ? databaseStorage.list() : inMemoryStorage.list()
  },
  getById(id: number) {
    return databaseStorage ? databaseStorage.getById(id) : inMemoryStorage.getById(id)
  },
  create(payload: CreateModelProfileDto) {
    return databaseStorage ? databaseStorage.create(payload) : inMemoryStorage.create(payload)
  },
  update(id: number, payload: UpdateModelProfileDto) {
    return databaseStorage ? databaseStorage.update(id, payload) : inMemoryStorage.update(id, payload)
  },
}
