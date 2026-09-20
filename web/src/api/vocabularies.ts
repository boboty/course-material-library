import { fetchAllPages, jsonRequest, pageQuery, request, type Page, type Vocabulary } from './client'

export type { Vocabulary }

export async function listIndustries(q = '', page = 1, pageSize = 100): Promise<Page<Vocabulary>> {
  return request(`/api/v1/industries?${pageQuery({ q, page, page_size: pageSize })}`)
}

/** 行业是客户表单和词表维护页的完整候选集，按后端上限分页取全。 */
export async function listAllIndustries(q = ''): Promise<Vocabulary[]> {
  return fetchAllPages((page, pageSize) => listIndustries(q, page, pageSize), item => item.id)
}

export async function createIndustry(name: string): Promise<Vocabulary> {
  return request('/api/v1/industries', jsonRequest('POST', { name }))
}

export async function listAudienceTypes(q = '', page = 1, pageSize = 100): Promise<Page<Vocabulary>> {
  return request(`/api/v1/audience-types?${pageQuery({ q, page, page_size: pageSize })}`)
}

/** 人群类型是场次表单和词表维护页的完整候选集，按后端上限分页取全。 */
export async function listAllAudienceTypes(q = ''): Promise<Vocabulary[]> {
  return fetchAllPages((page, pageSize) => listAudienceTypes(q, page, pageSize), item => item.id)
}

export async function createAudienceType(name: string): Promise<Vocabulary> {
  return request('/api/v1/audience-types', jsonRequest('POST', { name }))
}
