import type { Project, User } from '../types/domain'
import type { CreativeEntity, CreativeStatusLog } from '../types/creatives'
import type { VisualRequest, VisualStatusLog } from '../types/visuals'
import type { ModelProfile, ModelProfileBlock } from '../types/models'
import type { DesignStaffSetting, ReviewerReport, SmmReport, StaffRatePeriod } from '../types/team'

export const users: User[] = [
  { id: 1, name: 'Nikita', roles: ['head_designer'] },
  { id: 2, name: 'Alice', roles: ['designer'] },
  { id: 3, name: 'Max', roles: ['buyer'] },
  { id: 4, name: 'Sofia', roles: ['designer'] },
]

export const projects: Project[] = [
  { id: 1, name: 'Peru' },
  { id: 2, name: 'Italy' },
]

const now = Date.now()

export const creatives: CreativeEntity[] = [
  {
    id: 101,
    internalCode: 'PERU-0101',
    title: 'Peru static promo',
    brief: 'Need a static creative with strong CTA for Peru funnel.',
    type: 'static',
    subtypes: ['banner'],
    priority: 'normal',
    status: 'sent_to_designer',
    projectId: 1,
    requestedById: 3,
    orderedByUserId: 3,
    assignedToId: 2,
    price: '35',
    createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 50).toISOString(),
    submittedAt: null,
    acceptedAt: null,
  },
  {
    id: 102,
    internalCode: 'ITALY-0102',
    title: 'Italy video concept',
    brief: 'Video concept for Italy geo with hook in first 3 seconds.',
    type: 'video',
    subtypes: ['ugc', 'motion'],
    priority: 'urgent',
    status: 'review',
    projectId: 2,
    requestedById: 3,
    orderedByUserId: 3,
    assignedToId: 2,
    price: '90',
    createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 30).toISOString(),
    submittedAt: new Date(now - 1000 * 60 * 40).toISOString(),
    acceptedAt: null,
  },
  {
    id: 103,
    internalCode: 'PERU-0103',
    title: 'Peru deepfake test',
    brief: 'Experimental deepfake concept for internal validation.',
    type: 'video',
    subtypes: ['deepfake'],
    priority: 'fast',
    status: 'draft',
    projectId: 1,
    requestedById: 3,
    orderedByUserId: 3,
    assignedToId: null,
    price: null,
    createdAt: new Date(now - 1000 * 60 * 20).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 20).toISOString(),
    submittedAt: null,
    acceptedAt: null,
  },
]

export const creativeStatusLogs: CreativeStatusLog[] = [
  {
    id: 1,
    creativeId: 101,
    fromStatus: null,
    toStatus: 'draft',
    changedById: 3,
    createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
    note: 'Created by buyer',
  },
  {
    id: 2,
    creativeId: 101,
    fromStatus: 'draft',
    toStatus: 'sent_to_designer',
    changedById: 1,
    createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
    note: 'Assigned to designer',
  },
  {
    id: 3,
    creativeId: 102,
    fromStatus: null,
    toStatus: 'draft',
    changedById: 3,
    createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    note: 'Created by buyer',
  },
  {
    id: 4,
    creativeId: 102,
    fromStatus: 'draft',
    toStatus: 'sent_to_designer',
    changedById: 1,
    createdAt: new Date(now - 1000 * 60 * 60 * 23).toISOString(),
    note: 'Assigned to designer',
  },
  {
    id: 5,
    creativeId: 102,
    fromStatus: 'sent_to_designer',
    toStatus: 'in_progress',
    changedById: 2,
    createdAt: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
    note: 'Designer accepted the task',
  },
  {
    id: 6,
    creativeId: 102,
    fromStatus: 'in_progress',
    toStatus: 'review',
    changedById: 2,
    createdAt: new Date(now - 1000 * 60 * 40).toISOString(),
    note: 'Submitted for review',
  },
]

export const visuals: VisualRequest[] = [
  {
    id: 201,
    displayId: 'VIS-201',
    title: 'Reviewer landing visual',
    requesterId: 1,
    assignedDesignerId: 2,
    department: 'reviews',
    taskType: 'visual',
    status: 'in_progress',
    urgency: 'urgent',
    projectId: 1,
    brief: 'Need a clean visual for reviewer landing with clearer hierarchy.',
    revisionCount: 1,
    deadlineAt: new Date(now + 1000 * 60 * 60 * 8).toISOString(),
    createdAt: new Date(now - 1000 * 60 * 60 * 10).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 202,
    displayId: 'VIS-202',
    title: 'SMM story pack',
    requesterId: 1,
    assignedDesignerId: null,
    department: 'smm',
    taskType: 'creative',
    status: 'new',
    urgency: 'normal',
    projectId: 2,
    brief: 'Need a story pack for Italy geo with 3 variants.',
    revisionCount: 0,
    deadlineAt: new Date(now + 1000 * 60 * 60 * 24).toISOString(),
    createdAt: new Date(now - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 45).toISOString(),
  },
]

export const visualStatusLogs: VisualStatusLog[] = [
  {
    id: 1,
    visualRequestId: 201,
    fromStatus: null,
    toStatus: 'new',
    changedById: 1,
    createdAt: new Date(now - 1000 * 60 * 60 * 10).toISOString(),
    comment: 'Created',
  },
  {
    id: 2,
    visualRequestId: 201,
    fromStatus: 'new',
    toStatus: 'in_progress',
    changedById: 1,
    createdAt: new Date(now - 1000 * 60 * 60 * 9).toISOString(),
    comment: 'Assigned to designer',
  },
  {
    id: 3,
    visualRequestId: 202,
    fromStatus: null,
    toStatus: 'new',
    changedById: 1,
    createdAt: new Date(now - 1000 * 60 * 45).toISOString(),
    comment: 'Created',
  },
]

export const modelProfiles: ModelProfile[] = [
  {
    id: 301,
    name: 'Valeria',
    geo: 'PERU',
    age: 24,
    description: 'UGC-friendly profile for Peru creative flow.',
    projectId: 1,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 302,
    name: 'Giulia',
    geo: 'ITALY',
    age: 27,
    description: 'Lifestyle / story format profile for Italy.',
    projectId: 2,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
  },
]

export const modelProfileBlocks: ModelProfileBlock[] = [
  {
    id: 1,
    profileId: 301,
    title: 'Legend',
    content: 'Strong direct-response face, good for promo hooks.',
    sortOrder: 1,
  },
  {
    id: 2,
    profileId: 301,
    title: 'Content notes',
    content: 'Works better in short-form static and UGC hybrid concepts.',
    sortOrder: 2,
  },
  {
    id: 3,
    profileId: 302,
    title: 'Legend',
    content: 'Best for story packs and warm visual tone.',
    sortOrder: 1,
  },
]

export const designStaffSettings: DesignStaffSetting[] = [
  { id: 1, userId: 2, roleLabel: 'designer', isActive: true },
  { id: 2, userId: 4, roleLabel: 'designer', isActive: true },
  { id: 3, userId: 1, roleLabel: 'head_designer', isActive: true },
]

export const staffRatePeriods: StaffRatePeriod[] = [
  { id: 1, userId: 2, rateLabel: 'Base', rateValue: '50', startDate: new Date(now - 1000 * 60 * 60 * 24 * 30).toISOString(), endDate: null },
  { id: 2, userId: 4, rateLabel: 'Senior', rateValue: '70', startDate: new Date(now - 1000 * 60 * 60 * 24 * 30).toISOString(), endDate: null },
]

export const reviewerReports: ReviewerReport[] = [
  { id: 1, userId: 1, date: new Date(now - 1000 * 60 * 60 * 24).toISOString(), geo: 'PERU', bigReviews: 4, miniReviews: 6, totalEarned: '42' },
]

export const smmReports: SmmReport[] = [
  { id: 1, userId: 1, date: new Date(now - 1000 * 60 * 60 * 24).toISOString(), channelGeo: 'ITALY', posts: 3, stories: 5, totalEarned: '35' },
]
