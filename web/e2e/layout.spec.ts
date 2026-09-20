import { expect, test, type Page } from '@playwright/test'

function unique(prefix: string) {
  return `${prefix} ${crypto.randomUUID().slice(0, 8)}`
}

async function seed(page: Page) {
  const customer = await (await page.request.post('/api/v1/customers',
    { data: { name: unique('虚构布局客户') } })).json()
  const course = await (await page.request.post('/api/v1/courses',
    { data: { name: unique('虚构布局课程') } })).json()
  const audience = await (await page.request.post('/api/v1/audience-types',
    { data: { name: unique('虚构布局人群') } })).json()
  const longTitle = unique('虚构布局素材标题很长用来确认标题与状态徽标在窄屏下不会互相挤压')
  const titles = [longTitle, unique('虚构布局普通素材')]
  const materials = []
  for (const title of titles) {
    materials.push(await (await page.request.post('/api/v1/materials', {
      data: { title, type: '故事', body: '虚构正文，用于卡片两行摘要。' },
    })).json())
  }
  const session = await (await page.request.post('/api/v1/sessions', { data: {
    customer_id: customer.id, course_id: course.id, session_date: '2026-08-08',
    audience_type_ids: [audience.id], duration: '一天',
  } })).json()
  for (const material of materials) {
    await page.request.post(`/api/v1/sessions/${session.id}/usages`, { data: { material_id: material.id } })
  }
  return { sessionId: session.id as string, longTitle }
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
}

for (const viewport of [{ width: 800, height: 900 }, { width: 375, height: 812 }]) {
  test(`material and session pages have no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    const { sessionId, longTitle } = await seed(page)

    await page.goto(`/materials?q=${encodeURIComponent(longTitle)}`)
    await expect(page.getByRole('heading', { name: longTitle })).toBeVisible()
    await expect(page.getByText('尚未填写正文')).toHaveCount(0)
    await expectNoHorizontalOverflow(page)

    await page.goto(`/sessions/${sessionId}`)
    await expect(page.getByRole('heading', { name: '计划素材（2）' })).toBeVisible()
    await expect(page.getByRole('link', { name: '课后登记' })).toBeVisible()
    await expectNoHorizontalOverflow(page)

    await page.goto(`/sessions/${sessionId}/materials`)
    await expect(page.getByText('草稿').first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
}
