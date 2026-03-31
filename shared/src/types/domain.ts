export type Role =
  | 'designer'
  | 'head_designer'
  | 'buyer'
  | 'assistant'
  | 'gospodin'
  | 'reviewer'
  | 'smm_manager'

export type User = {
  id: number
  name: string
  roles: Role[]
}

export type Project = {
  id: number
  name: string
}

export type CreativeStatus =
  | 'draft'
  | 'sent_to_designer'
  | 'in_progress'
  | 'submitted'
  | 'revision'
  | 'completed'

export type CreativeType = 'static' | 'video'

export type Creative = {
  id: number
  internalCode: string
  title: string
  type: CreativeType
  priority: 'normal' | 'fast' | 'urgent' | 'critical'
  status: CreativeStatus
  projectId: number | null
  requestedById: number
  assignedToId: number | null
  createdAt: string
}
