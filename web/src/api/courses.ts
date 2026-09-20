import { fetchAllPages, jsonRequest, pageQuery, request, type Page } from './client'

export const courseStatuses = ['启用', '停用'] as const

export type CourseStatus = (typeof courseStatuses)[number]

export type Course = {
  id: string
  name: string
  alias: string | null
  status: CourseStatus
  created_at: string
  updated_at: string
}

export type CourseInput = { name: string; alias: string; status: CourseStatus }

export async function listCourses(q = '', page = 1): Promise<Page<Course>> {
  return request(`/api/v1/courses?${pageQuery({ q, page, page_size: 20 })}`)
}

export async function getCourse(id: string): Promise<Course> {
  return request(`/api/v1/courses/${encodeURIComponent(id)}`)
}

export async function createCourse(payload: CourseInput): Promise<Course> {
  return request('/api/v1/courses', jsonRequest('POST', payload))
}

export async function updateCourse(id: string, payload: CourseInput): Promise<Course> {
  return request(`/api/v1/courses/${encodeURIComponent(id)}`, jsonRequest('PUT', payload))
}

/** 场次表单的主课程下拉需要完整候选集，按后端上限分页取全。 */
export async function listEnabledCourses(): Promise<Course[]> {
  return fetchAllPages((page, pageSize) => request<Page<Course>>(`/api/v1/courses?${pageQuery({
    status: '启用', page, page_size: pageSize,
  })}`), course => course.id)
}
