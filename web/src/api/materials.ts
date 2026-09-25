import type { Course } from './courses'
import { fetchAllPages } from './client'

export type Material = {
  id: string
  title: string
  type: string | null
  body: string | null
  supporting_judgment: string | null
  speaking_notes: string | null
  source_note: string | null
  courses: Course[]
  status: string
  created_at: string
  updated_at: string
}
export type MaterialPage = { items: Material[]; page: number; page_size: number; total: number }
export type NewMaterial = { title: string; type: string; body: string }
export const materialStatuses = ['草稿', '可用', '主力', '待更新', '退役'] as const
export const materialTypes = ['故事', '案例', 'Demo', '金句', '段子', '行业素材'] as const

export async function listMaterials(q = '', page = 1, status = '', type = '', pageSize?: number,
                                   courseId = ''): Promise<MaterialPage> {
  const params = new URLSearchParams({ q, page: String(page) })
  if (pageSize) params.set('page_size', String(pageSize))
  if (status) params.set('status', status)
  if (type) params.set('type', type)
  if (courseId) params.set('course_id', courseId)
  const response = await fetch(`/api/v1/materials?${params}`)
  if (!response.ok) throw new Error('素材列表加载失败')
  return response.json() as Promise<MaterialPage>
}

export async function listAllMaterials(q = ''): Promise<Material[]> {
  return fetchAllPages((page, pageSize) => listMaterials(q, page, '', '', pageSize), material => material.id)
}

export async function findExactTitle(title: string): Promise<Material | null> {
  const params = new URLSearchParams({ title, page_size: '1' })
  const response = await fetch(`/api/v1/materials?${params}`)
  if (!response.ok) throw new Error('同标题查询失败')
  const result = await response.json() as MaterialPage
  return result.items[0] ?? null
}

export async function getMaterial(id: string): Promise<Material> {
  const response = await fetch(`/api/v1/materials/${encodeURIComponent(id)}`)
  if (!response.ok) throw new Error(response.status === 404 ? '素材不存在' : '素材加载失败')
  return response.json() as Promise<Material>
}

export async function createMaterial(payload: NewMaterial): Promise<Material> {
  const response = await fetch('/api/v1/materials', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('保存失败，请检查标题、类型和正文')
  return response.json() as Promise<Material>
}

export async function importMaterials(markdown: string): Promise<{ count: number }> {
  const response = await fetch('/api/v1/materials/import', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markdown }),
  })
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: { message?: string } } | null
    throw new Error(result?.error?.message || '批量导入失败，请检查内容后重试')
  }
  return response.json() as Promise<{ count: number }>
}

export type MaterialUpdate = {
  title: string
  type: string | null
  body: string | null
  supporting_judgment: string | null
  speaking_notes: string | null
  source_note: string | null
  course_ids: string[]
  status: string
}

export async function updateMaterial(id: string, payload: MaterialUpdate): Promise<Material> {
  const response = await fetch(`/api/v1/materials/${encodeURIComponent(id)}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  if (!response.ok) {
    if (response.status === 404) throw new Error('素材不存在')
    const result = await response.json().catch(() => null) as { error?: { code?: string; message?: string } } | null
    throw new Error(result?.error?.code === 'MATERIAL_INCOMPLETE' ? result.error.message || '非草稿素材必须填写类型和正文' : '保存失败，请检查标题、类型、正文和状态')
  }
  return response.json() as Promise<Material>
}
