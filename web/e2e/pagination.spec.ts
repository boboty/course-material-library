import { expect, test, type APIRequestContext, type Locator } from '@playwright/test'

function unique(prefix: string) {
  return `${prefix} ${crypto.randomUUID().slice(0, 8)}`
}

type Entity = { id: string; name: string }

async function fetchPage(api: APIRequestContext, path: string, page: number,
                         params: Record<string, string> = {}) {
  const response = await api.get(`/api/v1/${path}`, {
    params: { ...params, page: String(page), page_size: '100' },
  })
  expect(response.ok()).toBeTruthy()
  return await response.json() as { items: Entity[]; total: number }
}

/**
 * 确保该分页集合总数超过 100，并返回一个确定落在第一页之后的实体。
 * 页面在修复前只加载第一页，该实体不可选；修复后必须可选。
 */
async function ensureBeyondFirstPage(
  api: APIRequestContext,
  path: string,
  create: (name: string) => Promise<void>,
  params: Record<string, string> = {},
): Promise<Entity> {
  const head = await fetchPage(api, path, 1, params)
  if (head.total <= 100) {
    const batch = unique('虚构分页')
    const names = Array.from({ length: 101 - head.total },
      (_, index) => `${batch} ${String(index).padStart(3, '0')}`)
    for (let start = 0; start < names.length; start += 25) {
      await Promise.all(names.slice(start, start + 25).map(name => create(name)))
    }
  }
  const first = await fetchPage(api, path, 1, params)
  expect(first.total).toBeGreaterThan(100)
  const second = await fetchPage(api, path, 2, params)
  expect(second.items.length).toBeGreaterThan(0)
  expect(first.items.some(item => item.id === second.items[0].id)).toBe(false)
  return second.items[0]
}

async function createIndustry(api: APIRequestContext, name: string) {
  const response = await api.post('/api/v1/industries', { data: { name } })
  expect(response.ok()).toBeTruthy()
}

async function createAudienceType(api: APIRequestContext, name: string) {
  const response = await api.post('/api/v1/audience-types', { data: { name } })
  expect(response.ok()).toBeTruthy()
}

async function createCustomer(api: APIRequestContext, name: string) {
  const response = await api.post('/api/v1/customers', {
    data: { name, short_name: null, industry_id: null, group_name: null, notes: null },
  })
  expect(response.ok()).toBeTruthy()
}

async function createEnabledCourse(api: APIRequestContext, name: string) {
  const response = await api.post('/api/v1/courses', { data: { name, alias: null, status: '启用' } })
  expect(response.ok()).toBeTruthy()
}

async function displayedCount(card: Locator): Promise<number> {
  const text = await card.getByText(/共 \d+ 项/).textContent()
  const matched = text?.match(/共 (\d+) 项/)
  expect(matched).not.toBeNull()
  return Number(matched?.[1])
}

test('session create page offers entities beyond the first 100', async ({ page, request }) => {
  const customer = await ensureBeyondFirstPage(request, 'customers', name => createCustomer(request, name))
  const course = await ensureBeyondFirstPage(request, 'courses', name => createEnabledCourse(request, name),
    { status: '启用' })
  const audience = await ensureBeyondFirstPage(request, 'audience-types', name => createAudienceType(request, name))

  await page.goto('/sessions/new')
  await page.getByLabel('日期').fill('2026-05-20')
  await page.getByLabel('客户').selectOption({ label: customer.name })
  await page.getByLabel('主课程').selectOption({ label: course.name })
  await page.getByLabel(audience.name).check()
  await page.getByRole('button', { name: '保存场次' }).click()

  await expect(page.getByRole('heading', { name: customer.name })).toBeVisible()
  await expect(page.locator('.record-list').getByText(audience.name, { exact: true })).toBeVisible()
})

test('customer form offers industries beyond the first 100', async ({ page, request }) => {
  const industry = await ensureBeyondFirstPage(request, 'industries', name => createIndustry(request, name))
  const name = unique('虚构分页客户')

  await page.goto('/customers/new')
  await page.getByLabel('标准名称').fill(name)
  await page.getByLabel('行业').selectOption(industry.id)
  await page.getByRole('button', { name: '保存客户' }).click()

  await expect(page.getByRole('heading', { name: '编辑客户' })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('行业')).toHaveValue(industry.id)
})

test('vocabulary maintenance lists every industry and audience type', async ({ page, request }) => {
  await ensureBeyondFirstPage(request, 'industries', name => createIndustry(request, name))
  await ensureBeyondFirstPage(request, 'audience-types', name => createAudienceType(request, name))

  // 其他 E2E 会并发新增词表，只做单调增量断言：渲染值必须落在前后两次读取之间
  const beforeIndustry = (await fetchPage(request, 'industries', 1)).total
  const beforeAudience = (await fetchPage(request, 'audience-types', 1)).total
  await page.goto('/vocabularies')
  const industryCard = page.locator('.form-card').filter({ has: page.getByRole('heading', { name: '行业' }) })
  const audienceCard = page.locator('.form-card').filter({ has: page.getByRole('heading', { name: '人群类型' }) })
  const industryCount = await displayedCount(industryCard)
  const audienceCount = await displayedCount(audienceCard)
  const afterIndustry = (await fetchPage(request, 'industries', 1)).total
  const afterAudience = (await fetchPage(request, 'audience-types', 1)).total

  expect(industryCount).toBeGreaterThanOrEqual(beforeIndustry)
  expect(industryCount).toBeLessThanOrEqual(afterIndustry)
  expect(audienceCount).toBeGreaterThanOrEqual(beforeAudience)
  expect(audienceCount).toBeLessThanOrEqual(afterAudience)
  expect(industryCount).toBeGreaterThan(100)
  expect(audienceCount).toBeGreaterThan(100)
  await expect(industryCard.getByRole('listitem')).toHaveCount(industryCount)
  await expect(audienceCard.getByRole('listitem')).toHaveCount(audienceCount)
})
