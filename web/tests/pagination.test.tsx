import { afterEach, vi } from 'vitest'
import { fetchAllPages, type Page } from '../src/api/client'
import { listAllCustomers } from '../src/api/customers'
import { listEnabledCourses } from '../src/api/courses'
import { listAllAudienceTypes, listAllIndustries } from '../src/api/vocabularies'

afterEach(() => { vi.unstubAllGlobals() })

type Row = { id: string }

const idOf = (item: Row) => item.id

function pageOf(items: Row[], total: number, page: number, pageSize = 100): Page<Row> {
  return { items, page, page_size: pageSize, total }
}

function makeItems(count: number, start: number): Row[] {
  return Array.from({ length: count }, (_, index) => ({ id: `虚构-${start + index}` }))
}

/** 模拟后端分页：遵守 page / page_size，并返回真实 total。 */
function installFakeApi(total: number) {
  const requests: URL[] = []
  vi.stubGlobal('fetch', vi.fn(async (input: string) => {
    const url = new URL(input, 'http://localhost')
    requests.push(url)
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
    const pageSize = Math.max(1, Number(url.searchParams.get('page_size') || '20'))
    const start = (page - 1) * pageSize
    const items = makeItems(Math.max(0, Math.min(pageSize, total - start)), start)
    return { ok: true, json: async () => ({ items, page, page_size: pageSize, total }) }
  }))
  return requests
}

test('fetchAllPages walks every page until total is reached', async () => {
  const calls: number[] = []
  const loadPage = vi.fn(async (page: number, pageSize: number) => {
    calls.push(page)
    expect(pageSize).toBe(100)
    if (page === 1) return pageOf(makeItems(100, 0), 205, 1)
    if (page === 2) return pageOf(makeItems(100, 100), 205, 2)
    return pageOf(makeItems(5, 200), 205, 3)
  })
  const items = await fetchAllPages(loadPage, idOf)
  expect(calls).toEqual([1, 2, 3])
  expect(items).toHaveLength(205)
})

test('fetchAllPages returns a single short page without extra requests', async () => {
  const loadPage = vi.fn(async (page: number) => pageOf(makeItems(3, 0), 3, page))
  const items = await fetchAllPages(loadPage, idOf)
  expect(items).toHaveLength(3)
  expect(loadPage).toHaveBeenCalledTimes(1)
})

test('fetchAllPages stops on an empty page even if total is larger', async () => {
  const loadPage = vi.fn(async (page: number) => (
    page === 1 ? pageOf(makeItems(100, 0), 999, 1) : pageOf([], 999, page)
  ))
  const items = await fetchAllPages(loadPage, idOf)
  expect(items).toHaveLength(100)
  expect(loadPage).toHaveBeenCalledTimes(2)
})

test('fetchAllPages deduplicates records that shift across a page boundary', async () => {
  // 并发新增会把上一页末尾的记录挤到下一页，offset 分页因此重复返回同一条
  const loadPage = vi.fn(async (page: number) => {
    if (page === 1) return pageOf(makeItems(100, 0), 101, 1)
    return pageOf(makeItems(2, 99), 101, 2)
  })
  const items = await fetchAllPages(loadPage, idOf)
  expect(items).toHaveLength(101)
  expect(new Set(items.map(item => item.id)).size).toBe(101)
  expect(items.filter(item => item.id === '虚构-99')).toHaveLength(1)
})

test('listAllCustomers requests every page at the backend page_size cap', async () => {
  const requests = installFakeApi(205)
  const items = await listAllCustomers()
  expect(items).toHaveLength(205)
  expect(requests.map(url => url.pathname)).toEqual(['/api/v1/customers', '/api/v1/customers', '/api/v1/customers'])
  expect(requests.map(url => url.searchParams.get('page'))).toEqual(['1', '2', '3'])
  for (const url of requests) expect(url.searchParams.get('page_size')).toBe('100')
})

test('listEnabledCourses keeps the 启用 filter while paging beyond the first 100', async () => {
  const requests = installFakeApi(150)
  const items = await listEnabledCourses()
  expect(items).toHaveLength(150)
  expect(requests).toHaveLength(2)
  for (const url of requests) expect(url.searchParams.get('status')).toBe('启用')
})

test('listAllIndustries and listAllAudienceTypes fetch beyond the first 100', async () => {
  const requests = installFakeApi(101)
  expect(await listAllIndustries()).toHaveLength(101)
  expect(await listAllAudienceTypes()).toHaveLength(101)
  const paths = requests.map(url => url.pathname)
  expect(paths.filter(path => path === '/api/v1/industries')).toHaveLength(2)
  expect(paths.filter(path => path === '/api/v1/audience-types')).toHaveLength(2)
})
