import { jsonRequest, pageQuery, request, type Page, type Vocabulary } from './client'

export type { Vocabulary }

export async function listIndustries(q = ''): Promise<Page<Vocabulary>> {
  return request(`/api/v1/industries?${pageQuery({ q, page_size: 100 })}`)
}

export async function createIndustry(name: string): Promise<Vocabulary> {
  return request('/api/v1/industries', jsonRequest('POST', { name }))
}

export async function listAudienceTypes(q = ''): Promise<Page<Vocabulary>> {
  return request(`/api/v1/audience-types?${pageQuery({ q, page_size: 100 })}`)
}

export async function createAudienceType(name: string): Promise<Vocabulary> {
  return request('/api/v1/audience-types', jsonRequest('POST', { name }))
}
