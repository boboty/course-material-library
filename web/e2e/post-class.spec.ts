import { expect, test, type Page } from '@playwright/test'

function unique(prefix: string) {
  return `${prefix} ${crypto.randomUUID().slice(0, 8)}`
}

async function createMaterial(page: Page, title: string) {
  await page.goto('/materials/new')
  await page.getByLabel('标题').fill(title)
  await page.getByLabel('类型').selectOption('故事')
  await page.getByLabel('正文').fill('虚构素材正文。')
  await page.getByRole('button', { name: '保存草稿' }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
}

async function createSession(page: Page, customer: string) {
  await page.goto('/customers/new')
  await page.getByLabel('标准名称').fill(customer)
  await page.getByRole('button', { name: '保存客户' }).click()
  await expect(page.getByRole('heading', { name: '编辑客户' })).toBeVisible()

  const course = unique('虚构课程')
  await page.goto('/courses/new')
  await page.getByLabel('课程名称').fill(course)
  await page.getByRole('button', { name: '保存课程' }).click()
  await expect(page.getByRole('heading', { name: '编辑课程' })).toBeVisible()

  const audience = unique('虚构人群')
  await page.goto('/vocabularies')
  await page.getByLabel('人群类型名称').fill(audience)
  await page.getByRole('button', { name: '新增人群类型' }).click()
  await expect(page.getByRole('listitem').filter({ hasText: audience })).toBeVisible()

  await page.goto('/sessions/new')
  await page.getByLabel('日期').fill('2026-07-01')
  await page.getByLabel('客户').selectOption({ label: customer })
  await page.getByLabel('主课程').selectOption({ label: course })
  await page.getByLabel(audience).check()
  await page.getByRole('button', { name: '保存场次' }).click()
  await expect(page.getByRole('heading', { name: customer })).toBeVisible()
  // 等待 SPA 路由真正落到场次详情，再从 URL 取 id
  await page.waitForURL(/\/sessions\/[0-9a-f-]{36}$/)
  return page.url().split('/sessions/')[1]
}

async function searchAndPlan(page: Page, sessionId: string, title: string) {
  await page.goto(`/sessions/${sessionId}/materials`)
  await page.getByLabel('搜索素材标题').fill(title)
  await page.getByRole('button', { name: '搜索' }).click()
  const row = page.getByRole('listitem').filter({ hasText: title }).first()
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: '加入计划' }).click()
  // “已加入”徽标是 <li> 的直接文本子节点，使用全局定位（场景中只有一个匹配）
  await expect(page.getByText('已加入本场计划')).toHaveCount(1)
  await expect(page.getByRole('button', { name: '加入计划' })).toHaveCount(0)
}

test('post class saves all changes together and supports corrections', async ({ page }) => {
  const a = unique('虚构 A')
  const b = unique('虚构 B')
  const c = unique('虚构 C')
  const d = unique('虚构 D')
  await createMaterial(page, a)
  await createMaterial(page, b)
  await createMaterial(page, c)
  const sessionId = await createSession(page, unique('虚构客户'))
  await searchAndPlan(page, sessionId, a)
  await searchAndPlan(page, sessionId, b)
  await page.goto(`/sessions/${sessionId}/post-class`)
  const cardA = page.locator('.post-class-card').filter({ hasText: a })
  const cardB = page.locator('.post-class-card').filter({ hasText: b })
  await expect(cardA.getByLabel('使用状态')).toHaveValue('已用')
  await expect(cardB.getByLabel('使用状态')).toHaveValue('已用')
  const before = await page.request.get(`/api/v1/sessions/${sessionId}/usages`)
  expect((await before.json()).map((row: { status: string }) => row.status)).toEqual(['计划', '计划'])
  await cardA.getByLabel('效果').selectOption('好')
  await cardA.getByLabel('现场反应').fill('虚构反应')
  await cardB.getByLabel('效果').selectOption('差')
  await cardB.getByLabel('现场反应').fill('不应保留的反应')
  await cardB.getByLabel('使用状态').selectOption('未用')
  await cardB.getByLabel('使用状态').selectOption('已用')
  await expect(cardB.getByLabel('效果')).toHaveValue('未评')
  await expect(cardB.getByLabel('现场反应')).toHaveValue('')
  await cardB.getByLabel('使用状态').selectOption('未用')
  await page.getByLabel('搜索素材标题').fill(c)
  await page.getByRole('button', { name: '搜索' }).click()
  await page.getByRole('listitem').filter({ hasText: c }).getByRole('button', { name: '加入本场' }).click()
  const cardC = page.locator('.post-class-card').filter({ hasText: c })
  await expect(cardC.getByLabel('效果')).toHaveValue('未评')
  await cardC.getByLabel('效果').selectOption('好')
  await cardC.getByLabel('现场反应').fill('虚构 C 反应')
  await page.getByLabel('素材标题', { exact: true }).fill(d)
  await page.getByRole('button', { name: '加入草稿' }).click()
  const cardD = page.locator('.post-class-card').filter({ hasText: d })
  await expect(cardD.getByLabel('效果')).toHaveValue('未评')
  await cardD.getByLabel('效果').selectOption('差')
  await cardD.getByLabel('现场反应').fill('虚构 D 反应')
  const unsaved = await page.request.get(`/api/v1/sessions/${sessionId}/usages`)
  expect((await unsaved.json())).toHaveLength(2)
  await page.getByRole('button', { name: '保存课后登记' }).click()
  await expect(page.getByText('课后登记已保存')).toBeVisible()
  await page.reload()
  const savedA = page.locator('.post-class-card').filter({ hasText: a })
  const savedB = page.locator('.post-class-card').filter({ hasText: b })
  await expect(savedA.getByLabel('效果')).toHaveValue('好')
  await expect(savedA.getByLabel('现场反应')).toHaveValue('虚构反应')
  await expect(savedB.getByLabel('使用状态')).toHaveValue('未用')
  await expect(savedB.getByLabel('效果')).toHaveCount(0)
  const persisted = await (await page.request.get(`/api/v1/sessions/${sessionId}/usages`)).json()
  const byTitle = Object.fromEntries(persisted.map((row: { material: { title: string } }) =>
    [row.material.title, row])) as Record<string, { status: string; effect: string; reaction: string | null }>
  expect([byTitle[b].status, byTitle[b].effect, byTitle[b].reaction]).toEqual(['未用', '未评', null])
  expect([byTitle[c].effect, byTitle[c].reaction]).toEqual(['好', '虚构 C 反应'])
  expect([byTitle[d].effect, byTitle[d].reaction]).toEqual(['差', '虚构 D 反应'])
  await expect(page.locator('.post-class-card')).toHaveCount(4)
  await expect(page.locator('.post-class-card').filter({ hasText: d })).toContainText(d)
  await savedA.getByLabel('效果').selectOption('差')
  await page.getByRole('button', { name: '保存课后登记' }).click()
  await page.reload()
  await expect(page.locator('.post-class-card').filter({ hasText: a }).getByLabel('效果')).toHaveValue('差')
})

test('375px registration controls remain usable without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  const customer = await (await page.request.post('/api/v1/customers',
    { data: { name: unique('虚构手机客户') } })).json()
  const course = await (await page.request.post('/api/v1/courses',
    { data: { name: unique('虚构手机课程') } })).json()
  const audience = await (await page.request.post('/api/v1/audience-types',
    { data: { name: unique('虚构手机人群') } })).json()
  const teaching = await (await page.request.post('/api/v1/sessions', { data: {
    customer_id: customer.id, course_id: course.id, session_date: '2026-07-01',
    audience_type_ids: [audience.id], duration: '一天',
  } })).json()
  const sessionId = teaching.id
  const existing = unique('虚构手机已有素材')
  await page.request.post('/api/v1/materials', { data: {
    title: existing, type: '故事', body: '虚构素材正文。',
  } })
  await page.goto(`/sessions/${sessionId}/post-class`)
  await page.getByLabel('搜索素材标题').fill(existing)
  await page.getByRole('button', { name: '搜索' }).click()
  await page.getByRole('listitem').filter({ hasText: existing })
    .getByRole('button', { name: '加入本场' }).click()
  const newTitle = unique('虚构手机素材')
  await page.getByLabel('素材标题', { exact: true }).fill(newTitle)
  await page.getByRole('button', { name: '加入草稿' }).click()
  await page.goto(`/sessions/${sessionId}`)
  expect(await (await page.request.get(`/api/v1/sessions/${sessionId}/usages`)).json()).toEqual([])
  expect((await (await page.request.get(`/api/v1/materials?title=${encodeURIComponent(newTitle)}`)).json()).total).toBe(0)
  await page.goto(`/sessions/${sessionId}/post-class`)
  await page.getByLabel('搜索素材标题').fill(existing)
  await page.getByRole('button', { name: '搜索' }).click()
  await page.getByRole('listitem').filter({ hasText: existing })
    .getByRole('button', { name: '加入本场' }).click()
  await page.getByLabel('素材标题', { exact: true }).fill(newTitle)
  await page.getByRole('button', { name: '加入草稿' }).click()
  await page.getByRole('button', { name: '保存课后登记' }).click()
  await expect(page.getByText('课后登记已保存')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
