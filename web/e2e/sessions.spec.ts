import { expect, test, type Page } from '@playwright/test'

function unique(prefix: string) {
  return `${prefix} ${crypto.randomUUID().slice(0, 8)}`
}

async function createCustomer(page: Page, name: string) {
  await page.goto('/customers/new')
  await page.getByLabel('标准名称').fill(name)
  await page.getByLabel('常用简称').fill('虚构简称')
  await page.getByLabel('所属集团').fill('虚构集团')
  await page.getByRole('button', { name: '保存客户' }).click()
  await expect(page.getByRole('heading', { name: '编辑客户' })).toBeVisible()
  await expect(page.getByLabel('标准名称')).toHaveValue(name)
}

async function createCourse(page: Page, name: string, status: '启用' | '停用' = '启用') {
  await page.goto('/courses/new')
  await page.getByLabel('课程名称').fill(name)
  await page.getByLabel('别名').fill('虚构别名')
  await page.getByLabel('状态').selectOption(status)
  await page.getByRole('button', { name: '保存课程' }).click()
  await expect(page.getByRole('heading', { name: '编辑课程' })).toBeVisible()
  await expect(page.getByLabel('状态')).toHaveValue(status)
}

async function createAudienceType(page: Page, name: string) {
  await page.goto('/vocabularies')
  await page.getByLabel('人群类型名称').fill(name)
  await page.getByRole('button', { name: '新增人群类型' }).click()
  await expect(page.getByRole('listitem').filter({ hasText: name })).toBeVisible()
}

async function createSession(page: Page, options: {
  customer: string
  course: string
  audienceTypes: string[]
  date?: string
  duration?: string
  description?: string
  notes?: string
}) {
  await page.goto('/sessions/new')
  await page.getByLabel('日期').fill(options.date ?? '2026-03-09')
  await page.getByLabel('客户').selectOption({ label: options.customer })
  await page.getByLabel('主课程').selectOption({ label: options.course })
  for (const audience of options.audienceTypes) await page.getByLabel(audience).check()
  if (options.description) await page.getByLabel('人群描述').fill(options.description)
  await page.getByLabel('时长').selectOption(options.duration ?? '一天')
  if (options.notes) await page.getByLabel('备注').fill(options.notes)
  await page.getByRole('button', { name: '保存场次' }).click()
  await expect(page.getByRole('heading', { name: options.customer })).toBeVisible()
}

test('customer create, edit, reopen and business conflict', async ({ page }) => {
  const name = unique('虚构客户')
  await createCustomer(page, name)

  await page.goto('/customers')
  await expect(page.getByText(name)).toBeVisible()
  await page.getByRole('link', { name: new RegExp(name) }).first().click()
  await expect(page.getByLabel('标准名称')).toHaveValue(name)
  await page.getByLabel('常用简称').fill('虚构新简称')
  await page.getByRole('button', { name: '保存客户' }).click()
  await expect(page.getByLabel('常用简称')).toHaveValue('虚构新简称')
  await page.reload()
  await expect(page.getByLabel('常用简称')).toHaveValue('虚构新简称')

  await page.goto('/customers/new')
  await page.getByLabel('标准名称').fill(name)
  await page.getByRole('button', { name: '保存客户' }).click()
  await expect(page.getByText(`客户标准名称“${name}”已存在`)).toBeVisible()
})

test('course create, disable and reload keeps status', async ({ page }) => {
  const name = unique('虚构课程')
  await createCourse(page, name)

  await page.goto('/courses')
  await expect(page.getByText(name)).toBeVisible()
  await page.getByRole('link', { name: new RegExp(name) }).first().click()
  await page.getByLabel('状态').selectOption('停用')
  await page.getByRole('button', { name: '保存课程' }).click()
  await expect(page.getByLabel('状态')).toHaveValue('停用')
  await page.reload()
  await expect(page.getByLabel('状态')).toHaveValue('停用')
})

test('create session and read every field back after reload', async ({ page }) => {
  const customer = unique('虚构客户')
  const course = unique('虚构课程')
  const audienceA = unique('虚构人群')
  const audienceB = unique('虚构人群')
  // 人群类型按名称排序读回，断言与顺序无关
  const audienceText = [audienceA, audienceB].sort().join('、')
  const description = '虚构人群描述：一线主管 20 人，含两名新任经理。'
  const notes = '虚构备注：需要提前准备投影。'

  await createCustomer(page, customer)
  await createCourse(page, course)
  await createAudienceType(page, audienceA)
  await createAudienceType(page, audienceB)
  await createSession(page, {
    customer, course, audienceTypes: [audienceA, audienceB],
    date: '2026-03-09', duration: '两天', description, notes,
  })

  const details = page.locator('.record-list')
  await expect(details.getByText('2026-03-09').first()).toBeVisible()
  await expect(details.getByText('两天', { exact: true })).toBeVisible()
  await expect(details.getByText(audienceText, { exact: true })).toBeVisible()
  await expect(details.getByText(description, { exact: true })).toBeVisible()
  await expect(details.getByText(notes, { exact: true })).toBeVisible()

  // 重新打开场次后仍能完整读回
  await page.reload()
  await expect(page.getByRole('heading', { name: customer })).toBeVisible()
  await expect(page.getByText(`${course} · 2026-03-09`, { exact: true })).toBeVisible()
  await expect(details.getByText('两天', { exact: true })).toBeVisible()
  await expect(details.getByText(audienceText, { exact: true })).toBeVisible()
  await expect(details.getByText(description, { exact: true })).toBeVisible()
  await expect(details.getByText(notes, { exact: true })).toBeVisible()

  // 从列表重新进入详情
  await page.goto('/sessions')
  await page.getByRole('link', { name: new RegExp(customer) }).first().click()
  await expect(page.locator('.record-list').getByText(description, { exact: true })).toBeVisible()
  await expect(page.locator('.record-list').getByText(notes, { exact: true })).toBeVisible()
})

test('session requires at least one audience type', async ({ page }) => {
  const customer = unique('虚构客户')
  const course = unique('虚构课程')
  const audience = unique('虚构人群')
  await createCustomer(page, customer)
  await createCourse(page, course)
  await createAudienceType(page, audience)

  await page.goto('/sessions/new')
  await page.getByLabel('客户').selectOption({ label: customer })
  await page.getByLabel('主课程').selectOption({ label: course })
  await page.getByRole('button', { name: '保存场次' }).click()
  await expect(page.getByText('请至少选择一个人群类型')).toBeVisible()

  await page.getByLabel(audience).check()
  await page.getByRole('button', { name: '保存场次' }).click()
  await expect(page.getByRole('heading', { name: customer })).toBeVisible()
})
