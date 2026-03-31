export type CreativeShellStatus =
  | 'draft'
  | 'pending_hod_setup'
  | 'queued_for_auction'
  | 'in_auction'
  | 'sent_to_designer'
  | 'in_progress'
  | 'review'
  | 'submitted'
  | 'revision'
  | 'completed'
  | 'archived'

export type CreativeShellType = 'static' | 'video'

export type CreativeShellPriority = 'normal' | 'fast' | 'urgent' | 'critical'

export type CreativeListItem = {
  id: number
  internalCode: string
  title?: string
  projectName: string
  type: CreativeShellType
  status: CreativeShellStatus
  priority: CreativeShellPriority
  requestedByName?: string
  assignedToName?: string | null
  createdAt: string
}

export type CreativeMetrics = {
  total: number
  assigned: number
  mine: number
  inProgress: number
  review: number
  completed: number
}

export type CreativeDetailModel = {
  id: number
  internalCode: string
  projectName: string
  type: CreativeShellType
  status: CreativeShellStatus
  priority: CreativeShellPriority
  title?: string
  summary?: string
  requestedByName?: string
  assignedToName?: string | null
  createdAt: string
  blocks?: Array<{
    title: string
    content: string
  }>
}
