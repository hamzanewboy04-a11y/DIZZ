import * as mock from '../../shared/mock'
import type {
  AssignCreativeDto,
  CreativeCardDto,
  CreativeDetailDto,
  CreativeEntity,
  CreativeStatus,
  CreativeStatusLog,
} from '../../shared/creatives'

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

function createStatusLog(input: {
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

export class InMemoryCreativeStorage {
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

  assign(id: number, payload: AssignCreativeDto): CreativeDetailDto | null {
    const creative = mock.creatives.find((item) => item.id === id)
    if (!creative) return null

    const previousStatus = creative.status
    const isReassign = creative.assignedToId !== null && creative.assignedToId !== payload.assigneeId
    creative.assignedToId = payload.assigneeId
    creative.price = payload.price ?? creative.price
    creative.status = 'sent_to_designer'
    creative.updatedAt = new Date().toISOString()

    createStatusLog({
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

    createStatusLog({
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

    createStatusLog({
      creativeId: creative.id,
      fromStatus: previousStatus,
      toStatus: nextStatus,
      changedById: actorUserId ?? null,
      note,
    })

    return this.getById(id)
  }
}

export const creativeStorage = new InMemoryCreativeStorage()
