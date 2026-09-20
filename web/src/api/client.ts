export type Page<T> = { items: T[]; page: number; page_size: number; total: number }
export type Vocabulary = { id: string; name: string; created_at: string }

export type ApiErrorBody = { error?: { code?: string; message?: string; request_id?: string } }

export class ApiError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

export async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)
  if (!response.ok) {
    let code = `HTTP_${response.status}`
    let message = '请求失败，请稍后重试'
    try {
      const body = await response.json() as ApiErrorBody
      if (body.error?.code) code = body.error.code
      if (body.error?.message) message = body.error.message
    } catch { /* 响应不是 JSON 时保留默认文案 */ }
    throw new ApiError(code, message)
  }
  return response.json() as Promise<T>
}

export function jsonRequest(method: 'POST' | 'PUT', payload: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
}

export function pageQuery(params: Record<string, string | number>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) search.set(key, String(value))
  return search.toString()
}

/** 后端分页接口的 page_size 上限，分页取全时按此上限请求。 */
export const MAX_PAGE_SIZE = 100

/**
 * 需要完整候选集时使用：按后端允许的最大 page_size 逐页请求，直到取满 total。
 * 调用方只提供“第几页”的分页请求函数，避免每个页面各写一套循环。
 * 按 keyOf（实体 id）去重：offset 分页在有并发新增时可能让同一条记录跨页重复返回。
 */
export async function fetchAllPages<T>(
  loadPage: (page: number, pageSize: number) => Promise<Page<T>>,
  keyOf: (item: T) => string,
): Promise<T[]> {
  const found = new Map<string, T>()
  for (let page = 1; ; page += 1) {
    const result = await loadPage(page, MAX_PAGE_SIZE)
    for (const item of result.items) found.set(keyOf(item), item)
    // 空页兜底，避免 total 与实际数据不一致时出现死循环
    if (result.items.length === 0 || found.size >= result.total) return [...found.values()]
  }
}
