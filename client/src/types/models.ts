export type ModelProfile = {
  id: number
  name: string
  geo: string
  age?: number | null
  description?: string | null
  projectId: number | null
  createdAt: string
  updatedAt: string
}

export type ModelProfileBlock = {
  id: number
  profileId: number
  title: string
  content: string
  sortOrder: number
}

export type ModelProfileDetailDto = ModelProfile & {
  blocks: ModelProfileBlock[]
}
