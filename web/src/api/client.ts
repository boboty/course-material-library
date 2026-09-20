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
