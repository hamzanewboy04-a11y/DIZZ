export type VisualRequestStatus =
  | 'new'
  | 'on_review'
  | 'pending_hod_setup'
  | 'queued_for_auction'
  | 'in_auction'
  | 'in_progress'
  | 'submitted'
  | 'revision'
  | 'clarification'
  | 'on_hold'
  | 'accepted'
  | 'rejected'
  | 'cancelled'

export type VisualTaskType = 'chat_interface' | 'creative' | 'video' | 'visual'
export type VisualUrgency = 'normal' | 'fast' | 'urgent' | 'critical'

export type VisualRequest = {
  id: number
  displayId: string
  title: string
  requesterId: number
  assignedDesignerId: number | null
  department: 'processing' | 'reviews' | 'smm' | 'other'
  taskType: VisualTaskType
  status: VisualRequestStatus
  urgency: VisualUrgency
  projectId: number | null
  brief: string | null
  revisionCount: number
  deadlineAt?: string | null
  createdAt: string
  updatedAt: string
}

export type VisualStatusLog = {
  id: number
  visualRequestId: number
  fromStatus: VisualRequestStatus | null
  toStatus: VisualRequestStatus
  changedById?: number | null
  comment?: string | null
  createdAt: string
}

export type VisualDetailDto = VisualRequest & {
  requesterName: string | null
  assignedDesignerName: string | null
  statusLogs: VisualStatusLog[]
}
