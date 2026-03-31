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

export type CreativeEntity = {
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

export type CreativeCardDto = CreativeEntity & {
  requestedByName: string | null
  assignedToName: string | null
  orderedByName: string | null
}

export type CreativeDetailDto = CreativeCardDto & {
  statusLogs: CreativeStatusLog[]
}

export type AssignCreativeDto = {
  assigneeId: number
  price?: string
  actorUserId?: number
}

export type AcceptCreativeDto = {
  actorUserId?: number
}

export type ReassignCreativeDto = {
  assigneeId: number
  actorUserId?: number
  price?: string
}

export type UnassignCreativeDto = {
  actorUserId?: number
}

export type SubmitCreativeReviewDto = {
  actorUserId?: number
}

export type RequestCreativeRevisionDto = {
  actorUserId?: number
  note?: string
}

export type CreateCreativeDto = {
  projectId: number | null
  title: string
  brief?: string | null
  type: CreativeType
  subtypes?: CreativeSubtype[]
  priority?: CreativePriority
  requestedById: number
  orderedByUserId?: number | null
}
