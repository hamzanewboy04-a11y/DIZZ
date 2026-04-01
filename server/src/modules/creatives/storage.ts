import * as mock from '../../shared/mock.js'
import type {
  AssignCreativeDto,
  CreativeCardDto,
  CreativeDetailDto,
  CreativeEntity,
  CreativeStatus,
  CreativeStatusLog,
  CreativeSubtype,
} from '../../shared/creatives.js'
import { dbPool, hasDatabase } from '../../db/client.js'

type CreativeRow = {
  id: number
  internal_code: string
  title: string
  brief: string | null
  type: CreativeEntity['type']
  subtypes: CreativeSubtype[]
  priority: CreativeEntity['priority']
  status: CreativeStatus
  project_id: number | null
  requested_by_id: number
  ordered_by_user_id: number | null
  assigned_to_id: number | null
  price: string | null
  created_at: Date | string
  updated_at: Date | string
  submitted_at: Date | string | null
  accepted_at: Date | string | null
  requested_by_name?: string | null
  assigned_to_name?: string | null
  ordered_by_name?: string | null
}

type CreativeStatusLogRow = {
  id: number
  creative_id: number
  from_status: CreativeStatus | null
  to_status: CreativeStatus
  changed_by_id: number | null
  created_at: Date | string
  note: string | null
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function resolveUserName(userId: number | null): string | null {
  if (userId === null) return null
  return mock.users.find((user) => user.id === userId)?.name ?? null
}

function toCardDto(creative: CreativeEntity): CreativeCardDto {
  return {
    ...creative,
    requestedByName: resolveUserName(creative.requestedById),
    assignedToName: resolveUserName(creative.assignedToId),
    orderedByName: resolveUserName(creative.orderedByUserId),
  }
}

function mapCreativeRow(row: CreativeRow): CreativeCardDto {
  return {
    id: row.id,
    internalCode: row.internal_code,
    title: row.title,
    brief: row.brief,
    type: row.type,
    subtypes: row.subtypes ?? [],
    priority: row.priority,
    status: row.status,
    projectId: row.project_id,
    requestedById: row.requested_by_id,
    orderedByUserId: row.ordered_by_user_id,
    assignedToId: row.assigned_to_id,
    price: row.price,
    createdAt: toIso(row.created_at)!,
    updatedAt: toIso(row.updated_at)!,
    submittedAt: toIso(row.submitted_at),
    acceptedAt: toIso(row.accepted_at),
    requestedByName: row.requested_by_name ?? null,
    assignedToName: row.assigned_to_name ?? null,
    orderedByName: row.ordered_by_name ?? null,
  }
}

function mapLogRow(row: CreativeStatusLogRow): CreativeStatusLog {
  return {
    id: row.id,
    creativeId: row.creative_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    changedById: row.changed_by_id,
    createdAt: toIso(row.created_at)!,
    note: row.note,
  }
}

class InMemoryCreativeStorage {
  list(): CreativeCardDto[] {
    return mock.creatives.map(toCardDto)
  }

  listAssigned(): CreativeCardDto[] {
    return mock.creatives.filter((creative) => creative.assignedToId !== null).map(toCardDto)
  }

  listMine(userId: number): CreativeCardDto[] {
    return mock.creatives.filter((creative) => creative.requestedById === userId).map(toCardDto)
  }

  getById(id: number): CreativeDetailDto | null {
    const creative = mock.creatives.find((item) => item.id === id)
    if (!creative) return null

    return {
      ...toCardDto(creative),
      statusLogs: mock.creativeStatusLogs.filter((log) => log.creativeId === id),
    }
  }

  private createStatusLog(input: {
    creativeId: number
    fromStatus: CreativeStatus | null
    toStatus: CreativeStatus
    changedById: number | null
    note?: string | null
  }): CreativeStatusLog {
    const log: CreativeStatusLog = {
      id: mock.creativeStatusLogs.length > 0 ? Math.max(...mock.creativeStatusLogs.map((item) => item.id)) + 1 : 1,
      creativeId: input.creativeId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      changedById: input.changedById,
      createdAt: new Date().toISOString(),
      note: input.note ?? null,
    }

    mock.creativeStatusLogs.push(log)
    return log
  }

  assign(id: number, payload: AssignCreativeDto): CreativeDetailDto | null {
    const creative = mock.creatives.find((item) => item.id === id)
    if (!creative) return null

    const previousStatus = creative.status
    const isReassign = creative.assignedToId !== null && creative.assignedToId !== payload.assigneeId
    creative.assignedToId = payload.assigneeId
    creative.price = payload.price ?? creative.price
    creative.status = 'sent_to_designer'
    creative.updatedAt = new Date().toISOString()

    this.createStatusLog({
      creativeId: creative.id,
      fromStatus: previousStatus,
      toStatus: creative.status,
      changedById: payload.actorUserId ?? null,
      note: isReassign ? `Reassigned to user #${payload.assigneeId}` : `Assigned to user #${payload.assigneeId}`,
    })

    return this.getById(id)
  }

  unassign(id: number, actorUserId?: number): CreativeDetailDto | null {
    const creative = mock.creatives.find((item) => item.id === id)
    if (!creative) return null

    const previousStatus = creative.status
    creative.assignedToId = null
    creative.status = 'draft'
    creative.updatedAt = new Date().toISOString()

    this.createStatusLog({
      creativeId: creative.id,
      fromStatus: previousStatus,
      toStatus: creative.status,
      changedById: actorUserId ?? null,
      note: 'Unassigned from designer',
    })

    return this.getById(id)
  }

  updateStatus(id: number, nextStatus: CreativeStatus, actorUserId?: number, note?: string): CreativeDetailDto | null {
    const creative = mock.creatives.find((item) => item.id === id)
    if (!creative) return null

    const previousStatus = creative.status
    creative.status = nextStatus
    creative.updatedAt = new Date().toISOString()

    if (nextStatus === 'review') creative.submittedAt = new Date().toISOString()
    if (nextStatus === 'completed') creative.acceptedAt = new Date().toISOString()

    this.createStatusLog({
      creativeId: creative.id,
      fromStatus: previousStatus,
      toStatus: nextStatus,
      changedById: actorUserId ?? null,
      note,
    })

    return this.getById(id)
  }
}

class DatabaseCreativeStorage {
  async list(): Promise<CreativeCardDto[]> {
    const result = await dbPool!.query<CreativeRow>(`
      SELECT
        c.*, 
        requested_by.name AS requested_by_name,
        assigned_to.name AS assigned_to_name,
        ordered_by.name AS ordered_by_name
      FROM creatives c
      LEFT JOIN users requested_by ON requested_by.id = c.requested_by_id
      LEFT JOIN users assigned_to ON assigned_to.id = c.assigned_to_id
      LEFT JOIN users ordered_by ON ordered_by.id = c.ordered_by_user_id
      ORDER BY c.created_at DESC, c.id DESC
    `)

    return result.rows.map(mapCreativeRow)
  }

  async listAssigned(): Promise<CreativeCardDto[]> {
    const result = await dbPool!.query<CreativeRow>(`
      SELECT
        c.*, 
        requested_by.name AS requested_by_name,
        assigned_to.name AS assigned_to_name,
        ordered_by.name AS ordered_by_name
      FROM creatives c
      LEFT JOIN users requested_by ON requested_by.id = c.requested_by_id
      LEFT JOIN users assigned_to ON assigned_to.id = c.assigned_to_id
      LEFT JOIN users ordered_by ON ordered_by.id = c.ordered_by_user_id
      WHERE c.assigned_to_id IS NOT NULL
      ORDER BY c.updated_at DESC, c.id DESC
    `)

    return result.rows.map(mapCreativeRow)
  }

  async listMine(userId: number): Promise<CreativeCardDto[]> {
    const result = await dbPool!.query<CreativeRow>(`
      SELECT
        c.*, 
        requested_by.name AS requested_by_name,
        assigned_to.name AS assigned_to_name,
        ordered_by.name AS ordered_by_name
      FROM creatives c
      LEFT JOIN users requested_by ON requested_by.id = c.requested_by_id
      LEFT JOIN users assigned_to ON assigned_to.id = c.assigned_to_id
      LEFT JOIN users ordered_by ON ordered_by.id = c.ordered_by_user_id
      WHERE c.requested_by_id = $1
      ORDER BY c.created_at DESC, c.id DESC
    `, [userId])

    return result.rows.map(mapCreativeRow)
  }

  async getById(id: number): Promise<CreativeDetailDto | null> {
    const creativeResult = await dbPool!.query<CreativeRow>(`
      SELECT
        c.*, 
        requested_by.name AS requested_by_name,
        assigned_to.name AS assigned_to_name,
        ordered_by.name AS ordered_by_name
      FROM creatives c
      LEFT JOIN users requested_by ON requested_by.id = c.requested_by_id
      LEFT JOIN users assigned_to ON assigned_to.id = c.assigned_to_id
      LEFT JOIN users ordered_by ON ordered_by.id = c.ordered_by_user_id
      WHERE c.id = $1
      LIMIT 1
    `, [id])

    const creative = creativeResult.rows[0]
    if (!creative) return null

    const logsResult = await dbPool!.query<CreativeStatusLogRow>(`
      SELECT id, creative_id, from_status, to_status, changed_by_id, created_at, note
      FROM creative_status_logs
      WHERE creative_id = $1
      ORDER BY created_at ASC, id ASC
    `, [id])

    return {
      ...mapCreativeRow(creative),
      statusLogs: logsResult.rows.map(mapLogRow),
    }
  }

  async assign(id: number, payload: AssignCreativeDto): Promise<CreativeDetailDto | null> {
    const client = await dbPool!.connect()
    try {
      await client.query('BEGIN')

      const currentResult = await client.query<Pick<CreativeRow, 'id' | 'status' | 'assigned_to_id' | 'price'>>(
        `SELECT id, status, assigned_to_id, price FROM creatives WHERE id = $1 FOR UPDATE`,
        [id],
      )
      const current = currentResult.rows[0]
      if (!current) {
        await client.query('ROLLBACK')
        return null
      }

      const isReassign = current.assigned_to_id !== null && current.assigned_to_id !== payload.assigneeId
      await client.query(
        `
          UPDATE creatives
          SET assigned_to_id = $2,
              price = COALESCE($3, price),
              status = 'sent_to_designer',
              updated_at = NOW()
          WHERE id = $1
        `,
        [id, payload.assigneeId, payload.price ?? null],
      )

      await client.query(
        `
          INSERT INTO creative_status_logs (creative_id, from_status, to_status, changed_by_id, note)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [
          id,
          current.status,
          'sent_to_designer',
          payload.actorUserId ?? null,
          isReassign ? `Reassigned to user #${payload.assigneeId}` : `Assigned to user #${payload.assigneeId}`,
        ],
      )

      await client.query('COMMIT')
      return this.getById(id)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async unassign(id: number, actorUserId?: number): Promise<CreativeDetailDto | null> {
    const client = await dbPool!.connect()
    try {
      await client.query('BEGIN')

      const currentResult = await client.query<Pick<CreativeRow, 'id' | 'status'>>(
        `SELECT id, status FROM creatives WHERE id = $1 FOR UPDATE`,
        [id],
      )
      const current = currentResult.rows[0]
      if (!current) {
        await client.query('ROLLBACK')
        return null
      }

      await client.query(
        `
          UPDATE creatives
          SET assigned_to_id = NULL,
              status = 'draft',
              updated_at = NOW()
          WHERE id = $1
        `,
        [id],
      )

      await client.query(
        `
          INSERT INTO creative_status_logs (creative_id, from_status, to_status, changed_by_id, note)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [id, current.status, 'draft', actorUserId ?? null, 'Unassigned from designer'],
      )

      await client.query('COMMIT')
      return this.getById(id)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async updateStatus(id: number, nextStatus: CreativeStatus, actorUserId?: number, note?: string): Promise<CreativeDetailDto | null> {
    const client = await dbPool!.connect()
    try {
      await client.query('BEGIN')

      const currentResult = await client.query<Pick<CreativeRow, 'id' | 'status'>>(
        `SELECT id, status FROM creatives WHERE id = $1 FOR UPDATE`,
        [id],
      )
      const current = currentResult.rows[0]
      if (!current) {
        await client.query('ROLLBACK')
        return null
      }

      await client.query(
        `
          UPDATE creatives
          SET status = $2,
              updated_at = NOW(),
              submitted_at = CASE WHEN $2 = 'review' THEN NOW() ELSE submitted_at END,
              accepted_at = CASE WHEN $2 = 'completed' THEN NOW() ELSE accepted_at END
          WHERE id = $1
        `,
        [id, nextStatus],
      )

      await client.query(
        `
          INSERT INTO creative_status_logs (creative_id, from_status, to_status, changed_by_id, note)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [id, current.status, nextStatus, actorUserId ?? null, note ?? null],
      )

      await client.query('COMMIT')
      return this.getById(id)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}

const inMemoryStorage = new InMemoryCreativeStorage()
const databaseStorage = hasDatabase() ? new DatabaseCreativeStorage() : null

export const creativeStorage = {
  list() {
    return databaseStorage ? databaseStorage.list() : inMemoryStorage.list()
  },
  listAssigned() {
    return databaseStorage ? databaseStorage.listAssigned() : inMemoryStorage.listAssigned()
  },
  listMine(userId: number) {
    return databaseStorage ? databaseStorage.listMine(userId) : inMemoryStorage.listMine(userId)
  },
  getById(id: number) {
    return databaseStorage ? databaseStorage.getById(id) : inMemoryStorage.getById(id)
  },
  assign(id: number, payload: AssignCreativeDto) {
    return databaseStorage ? databaseStorage.assign(id, payload) : inMemoryStorage.assign(id, payload)
  },
  unassign(id: number, actorUserId?: number) {
    return databaseStorage ? databaseStorage.unassign(id, actorUserId) : inMemoryStorage.unassign(id, actorUserId)
  },
  updateStatus(id: number, nextStatus: CreativeStatus, actorUserId?: number, note?: string) {
    return databaseStorage ? databaseStorage.updateStatus(id, nextStatus, actorUserId, note) : inMemoryStorage.updateStatus(id, nextStatus, actorUserId, note)
  },
}
