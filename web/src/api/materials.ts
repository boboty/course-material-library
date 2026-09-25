export type Material = {
  id: string
  title: string
  type: string | null
  body: string | null
  status: string
  created_at: string
  updated_at: string
}
export type MaterialPage = { items: Material[]; page: number; page_size: number; total: number }
export type NewMaterial = { title: string; type: string; body: string }
export const materialStatuses = ['草稿', '可用', '主力', '待更新', '退役'] as const

export async function listMaterials(q = '', page = 1, status = ''): Promise<MaterialPage> {
  const params = new URLSearchParams({ q, page: String(page) })
  if (status) params.set('status', status)
  const response = await fetch(`/api/v1/materials?${params}`)
  if (!response.ok) throw new Error('素材列表加载失败')
  return response.json() as Promise<MaterialPage>
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
