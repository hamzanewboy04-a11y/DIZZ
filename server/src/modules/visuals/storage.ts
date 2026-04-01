import * as mock from '../../shared/mock.js'
import { dbPool, hasDatabase } from '../../db/client.js'
import type {
  AssignVisualDto,
  UpdateVisualStatusDto,
  VisualDetailDto,
  VisualRequest,
  VisualRequestStatus,
  VisualStatusLog,
} from '../../shared/visuals.js'

type VisualRow = {
  id: number
  display_id: string
  title: string
  requester_id: number
  assigned_designer_id: number | null
  department: VisualRequest['department']
  task_type: VisualRequest['taskType']
  status: VisualRequestStatus
  urgency: VisualRequest['urgency']
  project_id: number | null
  brief: string | null
  revision_count: number
  deadline_at: Date | string | null
  created_at: Date | string
  updated_at: Date | string
  requester_name?: string | null
  assigned_designer_name?: string | null
}

type VisualStatusLogRow = {
  id: number
  visual_request_id: number
  from_status: VisualRequestStatus | null
  to_status: VisualRequestStatus
  changed_by_id: number | null
  comment: string | null
  created_at: Date | string
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function resolveUserName(userId: number | null): string | null {
  if (userId === null) return null
  return mock.users.find((user) => user.id === userId)?.name ?? null
}

function mapVisualRow(row: VisualRow): VisualRequest {
  return {
    id: row.id,
    displayId: row.display_id,
    title: row.title,
    requesterId: row.requester_id,
    assignedDesignerId: row.assigned_designer_id,
    department: row.department,
    taskType: row.task_type,
    status: row.status,
    urgency: row.urgency,
    projectId: row.project_id,
    brief: row.brief,
    revisionCount: row.revision_count,
    deadlineAt: toIso(row.deadline_at),
    createdAt: toIso(row.created_at)!,
    updatedAt: toIso(row.updated_at)!,
  }
}

function mapVisualLogRow(row: VisualStatusLogRow): VisualStatusLog {
  return {
    id: row.id,
    visualRequestId: row.visual_request_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    changedById: row.changed_by_id,
    comment: row.comment,
    createdAt: toIso(row.created_at)!,
  }
}

class InMemoryVisualStorage {
  list(): VisualRequest[] {
    return mock.visuals
  }

  getById(id: number): VisualDetailDto | null {
    const visual = mock.visuals.find((item) => item.id === id)
    if (!visual) return null

    return {
      ...visual,
      requesterName: resolveUserName(visual.requesterId),
      assignedDesignerName: resolveUserName(visual.assignedDesignerId),
      statusLogs: mock.visualStatusLogs.filter((log) => log.visualRequestId === id),
    }
  }

  private pushStatusLog(input: {
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

  assign(id: number, payload: AssignVisualDto): VisualDetailDto | null {
    const visual = mock.visuals.find((item) => item.id === id)
    if (!visual) return null

    const previousStatus = visual.status
    visual.assignedDesignerId = payload.assigneeId
    if (visual.status === 'new') visual.status = 'in_progress'
    visual.updatedAt = new Date().toISOString()

    this.pushStatusLog({
      visualRequestId: id,
      fromStatus: previousStatus,
      toStatus: visual.status,
      changedById: payload.actorUserId,
      comment: `Assigned to user #${payload.assigneeId}`,
    })

    return this.getById(id)
  }

  take(id: number, actorUserId?: number): VisualDetailDto | null {
    const visual = mock.visuals.find((item) => item.id === id)
    if (!visual) return null

    const previousStatus = visual.status
    visual.status = 'in_progress'
    visual.updatedAt = new Date().toISOString()

    this.pushStatusLog({
      visualRequestId: id,
      fromStatus: previousStatus,
      toStatus: visual.status,
      changedById: actorUserId,
      comment: 'Taken to work',
    })

    return this.getById(id)
  }

  updateStatus(id: number, payload: UpdateVisualStatusDto): VisualDetailDto | null {
    const visual = mock.visuals.find((item) => item.id === id)
    if (!visual) return null

    const previousStatus = visual.status
    visual.status = payload.status
    visual.updatedAt = new Date().toISOString()

    this.pushStatusLog({
      visualRequestId: id,
      fromStatus: previousStatus,
      toStatus: payload.status,
      changedById: payload.actorUserId,
      comment: payload.comment,
    })

    return this.getById(id)
  }
}

class DatabaseVisualStorage {
  async list(): Promise<VisualRequest[]> {
    const result = await dbPool!.query<VisualRow>(`
      SELECT
        id, display_id, title, requester_id, assigned_designer_id, department,
        task_type, status, urgency, project_id, brief, revision_count,
        deadline_at, created_at, updated_at
      FROM visual_requests
      ORDER BY created_at DESC, id DESC
    `)

    return result.rows.map(mapVisualRow)
  }

  async getById(id: number): Promise<VisualDetailDto | null> {
    const visualResult = await dbPool!.query<VisualRow>(`
      SELECT
        v.id, v.display_id, v.title, v.requester_id, v.assigned_designer_id, v.department,
        v.task_type, v.status, v.urgency, v.project_id, v.brief, v.revision_count,
        v.deadline_at, v.created_at, v.updated_at,
        requester.name AS requester_name,
        assigned_designer.name AS assigned_designer_name
      FROM visual_requests v
      LEFT JOIN users requester ON requester.id = v.requester_id
      LEFT JOIN users assigned_designer ON assigned_designer.id = v.assigned_designer_id
      WHERE v.id = $1
      LIMIT 1
    `, [id])

    const visual = visualResult.rows[0]
    if (!visual) return null

    const logsResult = await dbPool!.query<VisualStatusLogRow>(`
      SELECT id, visual_request_id, from_status, to_status, changed_by_id, comment, created_at
      FROM visual_status_logs
      WHERE visual_request_id = $1
      ORDER BY created_at ASC, id ASC
    `, [id])

    return {
      ...mapVisualRow(visual),
      requesterName: visual.requester_name ?? null,
      assignedDesignerName: visual.assigned_designer_name ?? null,
      statusLogs: logsResult.rows.map(mapVisualLogRow),
    }
  }

  async assign(id: number, payload: AssignVisualDto): Promise<VisualDetailDto | null> {
    const client = await dbPool!.connect()
    try {
      await client.query('BEGIN')

      const currentResult = await client.query<Pick<VisualRow, 'id' | 'status'>>(
        `SELECT id, status FROM visual_requests WHERE id = $1 FOR UPDATE`,
        [id],
      )
      const current = currentResult.rows[0]
      if (!current) {
        await client.query('ROLLBACK')
        return null
      }

      const nextStatus = current.status === 'new' ? 'in_progress' : current.status

      await client.query(
        `
          UPDATE visual_requests
          SET assigned_designer_id = $2,
              status = $3,
              updated_at = NOW()
          WHERE id = $1
        `,
        [id, payload.assigneeId, nextStatus],
      )

      await client.query(
        `
          INSERT INTO visual_status_logs (visual_request_id, from_status, to_status, changed_by_id, comment)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [id, current.status, nextStatus, payload.actorUserId ?? null, `Assigned to user #${payload.assigneeId}`],
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

  async take(id: number, actorUserId?: number): Promise<VisualDetailDto | null> {
    const client = await dbPool!.connect()
    try {
      await client.query('BEGIN')

      const currentResult = await client.query<Pick<VisualRow, 'id' | 'status'>>(
        `SELECT id, status FROM visual_requests WHERE id = $1 FOR UPDATE`,
        [id],
      )
      const current = currentResult.rows[0]
      if (!current) {
        await client.query('ROLLBACK')
        return null
      }

      await client.query(
        `
          UPDATE visual_requests
          SET status = 'in_progress',
              updated_at = NOW()
          WHERE id = $1
        `,
        [id],
      )

      await client.query(
        `
          INSERT INTO visual_status_logs (visual_request_id, from_status, to_status, changed_by_id, comment)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [id, current.status, 'in_progress', actorUserId ?? null, 'Taken to work'],
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

  async updateStatus(id: number, payload: UpdateVisualStatusDto): Promise<VisualDetailDto | null> {
    const client = await dbPool!.connect()
    try {
      await client.query('BEGIN')

      const currentResult = await client.query<Pick<VisualRow, 'id' | 'status'>>(
        `SELECT id, status FROM visual_requests WHERE id = $1 FOR UPDATE`,
        [id],
      )
      const current = currentResult.rows[0]
      if (!current) {
        await client.query('ROLLBACK')
        return null
      }

      await client.query(
        `
          UPDATE visual_requests
          SET status = $2,
              updated_at = NOW()
          WHERE id = $1
        `,
        [id, payload.status],
      )

      await client.query(
        `
          INSERT INTO visual_status_logs (visual_request_id, from_status, to_status, changed_by_id, comment)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [id, current.status, payload.status, payload.actorUserId ?? null, payload.comment ?? null],
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

const inMemoryStorage = new InMemoryVisualStorage()
const databaseStorage = hasDatabase() ? new DatabaseVisualStorage() : null

export const visualStorage = {
  list() {
    return databaseStorage ? databaseStorage.list() : inMemoryStorage.list()
  },
  getById(id: number) {
    return databaseStorage ? databaseStorage.getById(id) : inMemoryStorage.getById(id)
  },
  assign(id: number, payload: AssignVisualDto) {
    return databaseStorage ? databaseStorage.assign(id, payload) : inMemoryStorage.assign(id, payload)
  },
  take(id: number, actorUserId?: number) {
    return databaseStorage ? databaseStorage.take(id, actorUserId) : inMemoryStorage.take(id, actorUserId)
  },
  updateStatus(id: number, payload: UpdateVisualStatusDto) {
    return databaseStorage ? databaseStorage.updateStatus(id, payload) : inMemoryStorage.updateStatus(id, payload)
  },
}
