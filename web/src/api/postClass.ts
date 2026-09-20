import { jsonRequest, request } from './client'
import type { Usage } from './usages'

export type UsageEdit = { id: string; status: '已用' | '未用'; effect: '未评' | '好' | '差'; reaction: string | null }
export type AddedMaterial = { material_id: string; effect: '未评' | '好' | '差'; reaction: string | null }
export type NewMaterial = { title: string; effect: '未评' | '好' | '差'; reaction: string | null }

export function savePostClass(sessionId: string, payload: {
  usages: UsageEdit[]
  existing_materials: AddedMaterial[]
  new_materials: NewMaterial[]
}): Promise<Usage[]> {
  return request(`/api/v1/sessions/${encodeURIComponent(sessionId)}/post-class`, jsonRequest('PUT', payload))
}
