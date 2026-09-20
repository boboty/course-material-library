import { fetchAllPages, jsonRequest, pageQuery, request, type Page, type Vocabulary } from './client'

export type Customer = {
  id: string
  name: string
  short_name: string | null
  industry_id: string | null
  industry: Vocabulary | null
  group_name: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type CustomerInput = {
  name: string
  short_name: string
  industry_id: string | null
  group_name: string
  notes: string
}

export async function listCustomers(q = '', page = 1, pageSize = 20): Promise<Page<Customer>> {
  return request(`/api/v1/customers?${pageQuery({ q, page, page_size: pageSize })}`)
}

/** 场次表单的客户下拉需要完整候选集，按后端上限分页取全。 */
export async function listAllCustomers(): Promise<Customer[]> {
  return fetchAllPages((page, pageSize) => listCustomers('', page, pageSize), customer => customer.id)
}

export async function getCustomer(id: string): Promise<Customer> {
  return request(`/api/v1/customers/${encodeURIComponent(id)}`)
}

export async function createCustomer(payload: CustomerInput): Promise<Customer> {
  return request('/api/v1/customers', jsonRequest('POST', payload))
}

export async function updateCustomer(id: string, payload: CustomerInput): Promise<Customer> {
  return request(`/api/v1/customers/${encodeURIComponent(id)}`, jsonRequest('PUT', payload))
}
