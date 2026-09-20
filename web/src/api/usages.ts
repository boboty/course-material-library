import { jsonRequest, request } from './client'
import type { Material } from './materials'

export type Usage = {
  id: string
  session_id: string
  material_id: string
  status: string
  effect: string
  reaction: string | null
  material: Material
  created_at: string
  updated_at: string
}

export const PLANNED_STATUS = '计划'

export async function listUsages(sessionId: string): Promise<Usage[]> {
  return request(`/api/v1/sessions/${encodeURIComponent(sessionId)}/usages`)
}

export async function planMaterial(sessionId: string, materialId: string): Promise<Usage> {
  return request(`/api/v1/sessions/${encodeURIComponent(sessionId)}/usages`,
                 jsonRequest('POST', { material_id: materialId }))
}

export async function removePlannedMaterial(sessionId: string, usageId: string): Promise<void> {
  const response = await fetch(
    `/api/v1/sessions/${encodeURIComponent(sessionId)}/usages/${encodeURIComponent(usageId)}`,
    { method: 'DELETE' },
  )
  if (!response.ok) throw new Error('撤销计划失败，请刷新后重试')
}
