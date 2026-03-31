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
  requesterId: number
  assignedDesignerId: number | null
  department: 'processing' | 'reviews' | 'smm' | 'other'
  taskType: VisualTaskType
  status: VisualRequestStatus
  urgency: VisualUrgency
  projectId: number | null
  geo?: string | null
  language?: string | null
  format?: string | null
  formData?: Record<string, unknown> | null
  revisionCount: number
  deadlineAt?: string | null
  deadlineFrozen?: boolean | null
  rating?: number | null
  ratingComment?: string | null
  modelProfileId?: number | null
  visualPurpose?: 'funnel' | 'sales' | 'internal' | 'proof' | null
  visualFormat?: 'photo' | 'video' | 'circle' | 'screenshot' | 'document' | null
  compositionSteps?: string | null
  referenceInstructions?: string | null
  auctionStartedAt?: string | null
  auctionEndedAt?: string | null
  auctionDuration?: number | null
  maxBudget?: string | null
  winningBidId?: number | null
  createdAt: string
  updatedAt: string
}

export type VisualFile = {
  id: number
  visualRequestId: number
  fileType: 'reference' | 'result' | 'attachment'
  fileName: string
  fileUrl: string
  fileSize: number
  version: number
  createdAt: string
}

export type VisualMessage = {
  id: number
  visualRequestId: number
  userId: number
  text: string
  isDeleted: boolean
  createdAt: string
  updatedAt?: string | null
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

export type VisualGalleryItem = {
  id: number
  visualRequestId: number
  comment: string
  sharedByUserId: number
  createdAt: string
}

export type VisualAuctionBid = {
  id: number
  visualRequestId: number
  designerId: number
  amount: string
  estimatedTime?: string | null
  proposedDeadline?: string | null
  createdAt: string
}
