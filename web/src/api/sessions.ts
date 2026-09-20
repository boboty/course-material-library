import { jsonRequest, pageQuery, request, type Page, type Vocabulary } from './client'
import type { Course } from './courses'

export const sessionDurations = ['半天', '一天', '两天', '其他'] as const

export type SessionDuration = (typeof sessionDurations)[number]

export type CustomerSummary = {
  id: string
  name: string
  short_name: string | null
  group_name: string | null
}

export type TeachingSession = {
  id: string
  session_date: string
  duration: SessionDuration
  audience_description: string | null
  notes: string | null
  customer: CustomerSummary
  course: Course
  audience_types: Vocabulary[]
  created_at: string
  updated_at: string
}

export type SessionInput = {
  customer_id: string
  course_id: string
  session_date: string
  audience_type_ids: string[]
  audience_description: string
  duration: SessionDuration
  notes: string
}

export async function listSessions(page = 1): Promise<Page<TeachingSession>> {
  return request(`/api/v1/sessions?${pageQuery({ page, page_size: 20 })}`)
}

export async function getSession(id: string): Promise<TeachingSession> {
  return request(`/api/v1/sessions/${encodeURIComponent(id)}`)
}

export async function createSession(payload: SessionInput): Promise<TeachingSession> {
  return request('/api/v1/sessions', jsonRequest('POST', payload))
}
