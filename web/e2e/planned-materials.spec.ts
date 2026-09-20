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

function plannedCard(page: Page) {
  return page.locator('.detail-body').filter({ has: page.getByRole('heading', { name: /^计划素材/ }) })
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

test('plan two materials, reopen, remove one, reopen again', async ({ page }) => {
  const customer = unique('虚构客户')
  const materialA = unique('虚构素材')
  const materialB = unique('虚构素材')

  await createMaterial(page, materialA)
  await createMaterial(page, materialB)
  const sessionId = await createSession(page, customer)

  // 新场次没有计划素材
  await expect(plannedCard(page).getByText('还没有计划素材。')).toBeVisible()

  // 搜索并加入两个计划素材
  await searchAndPlan(page, sessionId, materialA)
  await searchAndPlan(page, sessionId, materialB)

  // 场次详情读回两个素材
  await page.goto(`/sessions/${sessionId}`)
  const planned = plannedCard(page)
  await expect(planned.getByRole('heading', { name: '计划素材（2）' })).toBeVisible()
  await expect(planned.getByRole('link', { name: materialA })).toBeVisible()
  await expect(planned.getByRole('link', { name: materialB })).toBeVisible()
  await expect(planned.getByText('计划', { exact: true }).first()).toBeVisible()
  await expect(planned.getByText('未评', { exact: true }).first()).toBeVisible()

  // 刷新后仍然存在
  await page.reload()
  await expect(planned.getByRole('heading', { name: '计划素材（2）' })).toBeVisible()
  await expect(planned.getByRole('link', { name: materialA })).toBeVisible()
  await expect(planned.getByRole('link', { name: materialB })).toBeVisible()

  // 撤销其中一个
  const rowA = planned.getByRole('listitem').filter({ hasText: materialA })
  await rowA.getByRole('button', { name: '撤销计划' }).click()
  await expect(planned.getByRole('heading', { name: '计划素材（1）' })).toBeVisible()
  await expect(planned.getByRole('link', { name: materialA })).toHaveCount(0)

  // 再次重新进入，只剩另一个
  await page.goto(`/sessions/${sessionId}`)
  await expect(planned.getByRole('heading', { name: '计划素材（1）' })).toBeVisible()
  await expect(planned.getByRole('link', { name: materialB })).toBeVisible()
  await expect(planned.getByRole('link', { name: materialA })).toHaveCount(0)

  // 撤销计划不会把状态改成“未用”
  await expect(planned.getByText('未用')).toHaveCount(0)
})

test('already planned material is shown as joined and not duplicated', async ({ page }) => {
  const customer = unique('虚构客户')
  const material = unique('虚构素材')

  await createMaterial(page, material)
  const sessionId = await createSession(page, customer)

  await searchAndPlan(page, sessionId, material)

  // 重新进入选择页：已加入状态可见，且不会出现第二个“加入计划”按钮
  await page.goto(`/sessions/${sessionId}/materials`)
  await page.getByLabel('搜索素材标题').fill(material)
  await page.getByRole('button', { name: '搜索' }).click()
  const row = page.getByRole('listitem').filter({ hasText: material }).first()
  await expect(row).toBeVisible()
  await expect(page.getByText('已加入本场计划')).toHaveCount(1)
  await expect(page.getByRole('button', { name: '加入计划' })).toHaveCount(0)

  await page.goto(`/sessions/${sessionId}`)
  await expect(plannedCard(page).getByRole('heading', { name: '计划素材（1）' })).toBeVisible()
  await expect(plannedCard(page).getByRole('link', { name: material })).toHaveCount(1)
})
