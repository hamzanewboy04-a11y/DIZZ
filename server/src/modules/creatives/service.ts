import type {
  AcceptCreativeDto,
  AssignCreativeDto,
  CreativeDetailDto,
  ReassignCreativeDto,
  RequestCreativeRevisionDto,
  SubmitCreativeReviewDto,
  UnassignCreativeDto,
} from '../../shared/creatives.js'
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

  getDetail(id: number): Promise<CreativeDetailDto | null> | CreativeDetailDto | null {
    return creativeStorage.getById(id)
  }

  async assign(id: number, payload: AssignCreativeDto): Promise<CreativeDetailDto> {
    const creative = await creativeStorage.getById(id)

    if (!creative) throw new Error('Creative not found')
    if (!assignableStatuses.has(creative.status)) {
      throw new Error(`Creative cannot be assigned from status ${creative.status}`)
    }

    const updated = await creativeStorage.assign(id, payload)
    if (!updated) throw new Error('Creative not found after assign')
    return updated
  }

  async reassign(id: number, payload: ReassignCreativeDto): Promise<CreativeDetailDto> {
    const creative = await creativeStorage.getById(id)

    if (!creative) throw new Error('Creative not found')
    if (!reassignStatuses.has(creative.status)) {
      throw new Error(`Creative cannot be reassigned from status ${creative.status}`)
    }

    const updated = await creativeStorage.assign(id, payload)
    if (!updated) throw new Error('Creative not found after reassign')
    return updated
  }

  async unassign(id: number, payload: UnassignCreativeDto): Promise<CreativeDetailDto> {
    const creative = await creativeStorage.getById(id)

    if (!creative) throw new Error('Creative not found')
    if (!creative.assignedToId) throw new Error('Creative is not assigned')
    if (!unassignStatuses.has(creative.status)) {
      throw new Error(`Creative cannot be unassigned from status ${creative.status}`)
    }

    const updated = await creativeStorage.unassign(id, payload.actorUserId)
    if (!updated) throw new Error('Creative not found after unassign')
    return updated
  }

  async takeToWork(id: number, actorUserId?: number): Promise<CreativeDetailDto> {
    const creative = await creativeStorage.getById(id)

    if (!creative) throw new Error('Creative not found')
    if (!creative.assignedToId) {
      throw new Error('Creative must be assigned before accepting to work')
    }
    if (!takeToWorkStatuses.has(creative.status)) {
      throw new Error(`Creative cannot be taken to work from status ${creative.status}`)
    }

    const updated = await creativeStorage.updateStatus(id, 'in_progress', actorUserId)
    if (!updated) throw new Error('Creative not found after status update')
    return updated
  }

  async submitReview(id: number, payload: SubmitCreativeReviewDto): Promise<CreativeDetailDto> {
    const creative = await creativeStorage.getById(id)

    if (!creative) throw new Error('Creative not found')
    if (!submitReviewStatuses.has(creative.status)) {
      throw new Error(`Creative cannot be submitted for review from status ${creative.status}`)
    }

    const updated = await creativeStorage.updateStatus(id, 'review', payload.actorUserId)
    if (!updated) throw new Error('Creative not found after submit review')
    return updated
  }

  async requestRevision(id: number, payload: RequestCreativeRevisionDto): Promise<CreativeDetailDto> {
    const creative = await creativeStorage.getById(id)

    if (!creative) throw new Error('Creative not found')
    if (!revisionRequestStatuses.has(creative.status)) {
      throw new Error(`Revision cannot be requested from status ${creative.status}`)
    }

    const updated = await creativeStorage.updateStatus(id, 'revision', payload.actorUserId, payload.note)
    if (!updated) throw new Error('Creative not found after revision request')
    return updated
  }

  async accept(id: number, payload: AcceptCreativeDto): Promise<CreativeDetailDto> {
    const creative = await creativeStorage.getById(id)

    if (!creative) throw new Error('Creative not found')
    if (!acceptableStatuses.has(creative.status)) {
      throw new Error(`Creative cannot be accepted from status ${creative.status}`)
    }

    const updated = await creativeStorage.updateStatus(id, 'completed', payload.actorUserId)
    if (!updated) throw new Error('Creative not found after accept')
    return updated
  }
}

export const creativeService = new CreativeService()
