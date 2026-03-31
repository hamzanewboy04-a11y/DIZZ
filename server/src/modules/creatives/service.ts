import type {
  AcceptCreativeDto,
  AssignCreativeDto,
  CreativeDetailDto,
  ReassignCreativeDto,
  RequestCreativeRevisionDto,
  SubmitCreativeReviewDto,
  UnassignCreativeDto,
} from '../../../../shared/src/types/creatives.js'
import { creativeStorage } from './storage.js'

const assignableStatuses = new Set(['draft', 'revision', 'sent_to_designer'])
const acceptableStatuses = new Set(['review'])
const takeToWorkStatuses = new Set(['sent_to_designer', 'revision'])
const submitReviewStatuses = new Set(['in_progress'])
const reassignStatuses = new Set(['sent_to_designer', 'in_progress', 'review', 'revision'])
const unassignStatuses = new Set(['sent_to_designer', 'in_progress', 'review', 'revision'])
const revisionRequestStatuses = new Set(['review'])

export class CreativeService {
  list() {
    return creativeStorage.list()
  }

  listAssigned() {
    return creativeStorage.listAssigned()
  }

  listMine(userId: number) {
    return creativeStorage.listMine(userId)
  }

  getDetail(id: number): CreativeDetailDto | null {
    return creativeStorage.getById(id)
  }

  assign(id: number, payload: AssignCreativeDto): CreativeDetailDto {
    const creative = creativeStorage.getById(id)

    if (!creative) throw new Error('Creative not found')
    if (!assignableStatuses.has(creative.status)) {
      throw new Error(`Creative cannot be assigned from status ${creative.status}`)
    }

    const updated = creativeStorage.assign(id, payload)
    if (!updated) throw new Error('Creative not found after assign')
    return updated
  }

  reassign(id: number, payload: ReassignCreativeDto): CreativeDetailDto {
    const creative = creativeStorage.getById(id)

    if (!creative) throw new Error('Creative not found')
    if (!reassignStatuses.has(creative.status)) {
      throw new Error(`Creative cannot be reassigned from status ${creative.status}`)
    }

    const updated = creativeStorage.assign(id, payload)
    if (!updated) throw new Error('Creative not found after reassign')
    return updated
  }

  unassign(id: number, payload: UnassignCreativeDto): CreativeDetailDto {
    const creative = creativeStorage.getById(id)

    if (!creative) throw new Error('Creative not found')
    if (!creative.assignedToId) throw new Error('Creative is not assigned')
    if (!unassignStatuses.has(creative.status)) {
      throw new Error(`Creative cannot be unassigned from status ${creative.status}`)
    }

    const updated = creativeStorage.unassign(id, payload.actorUserId)
    if (!updated) throw new Error('Creative not found after unassign')
    return updated
  }

  takeToWork(id: number, actorUserId?: number): CreativeDetailDto {
    const creative = creativeStorage.getById(id)

    if (!creative) throw new Error('Creative not found')
    if (!creative.assignedToId) {
      throw new Error('Creative must be assigned before accepting to work')
    }
    if (!takeToWorkStatuses.has(creative.status)) {
      throw new Error(`Creative cannot be taken to work from status ${creative.status}`)
    }

    const updated = creativeStorage.updateStatus(id, 'in_progress', actorUserId)
    if (!updated) throw new Error('Creative not found after status update')
    return updated
  }

  submitReview(id: number, payload: SubmitCreativeReviewDto): CreativeDetailDto {
    const creative = creativeStorage.getById(id)

    if (!creative) throw new Error('Creative not found')
    if (!submitReviewStatuses.has(creative.status)) {
      throw new Error(`Creative cannot be submitted for review from status ${creative.status}`)
    }

    const updated = creativeStorage.updateStatus(id, 'review', payload.actorUserId)
    if (!updated) throw new Error('Creative not found after submit review')
    return updated
  }

  requestRevision(id: number, payload: RequestCreativeRevisionDto): CreativeDetailDto {
    const creative = creativeStorage.getById(id)

    if (!creative) throw new Error('Creative not found')
    if (!revisionRequestStatuses.has(creative.status)) {
      throw new Error(`Revision cannot be requested from status ${creative.status}`)
    }

    const updated = creativeStorage.updateStatus(id, 'revision', payload.actorUserId, payload.note)
    if (!updated) throw new Error('Creative not found after revision request')
    return updated
  }

  accept(id: number, payload: AcceptCreativeDto): CreativeDetailDto {
    const creative = creativeStorage.getById(id)

    if (!creative) throw new Error('Creative not found')
    if (!acceptableStatuses.has(creative.status)) {
      throw new Error(`Creative cannot be accepted from status ${creative.status}`)
    }

    const updated = creativeStorage.updateStatus(id, 'completed', payload.actorUserId)
    if (!updated) throw new Error('Creative not found after accept')
    return updated
  }
}

export const creativeService = new CreativeService()
