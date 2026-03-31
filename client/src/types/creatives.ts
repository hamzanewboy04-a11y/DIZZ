export type CreativePriority = 'normal' | 'fast' | 'urgent' | 'critical'

export type CreativeStatus =
  | 'draft'
  | 'sent_to_designer'
  | 'in_progress'
  | 'review'
  | 'revision'
  | 'completed'

export type CreativeType = 'static' | 'video'

export type CreativeSubtype =
  | 'banner'
  | 'ugc'
  | 'story'
  | 'motion'
  | 'lipsync'
  | 'deepfake'

export type CreativeStatusLog = {
  id: number
  creativeId: number
  fromStatus: CreativeStatus | null
  toStatus: CreativeStatus
  changedById: number | null
  createdAt: string
  note?: string | null
}

export type Creative = {
  id: number
  internalCode: string
  title: string
  brief: string | null
  type: CreativeType
  subtypes: CreativeSubtype[]
  priority: CreativePriority
  status: CreativeStatus
  projectId: number | null
  requestedById: number
  orderedByUserId: number | null
  assignedToId: number | null
  price: string | null
  createdAt: string
  updatedAt: string
  submittedAt: string | null
  acceptedAt: string | null
}

export type CreativeDetailDto = Creative & {
  requestedByName: string | null
  assignedToName: string | null
  orderedByName: string | null
  statusLogs: CreativeStatusLog[]
}
