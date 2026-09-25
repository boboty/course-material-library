import { expect, test } from '@playwright/test'

test('quick create, search, open detail and survive refresh', async ({ page }) => {
  const title = `虚构素材 ${crypto.randomUUID()}`
  await page.goto('/materials/new')
  await page.getByLabel('标题').fill(title)
  await page.getByLabel('类型').selectOption('故事')
  await page.getByLabel('正文').fill('这是一条虚构的测试正文。')
  await page.getByRole('button', { name: '保存草稿' }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await page.goto('/materials')
  await page.getByLabel('搜索标题').fill(title)
  await page.getByRole('button', { name: '搜索' }).click()
  await expect(page.getByText('共 1 条素材')).toBeVisible()
  await page.getByRole('link', { name: new RegExp(title) }).click()
  await expect(page.getByText('这是一条虚构的测试正文。')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
})

test('same title warns but still allows saving another material', async ({ page }) => {
  const title = `虚构同标题 ${crypto.randomUUID()}`
  await page.goto('/materials/new')
  await page.getByLabel('标题').fill(title)
  await page.getByLabel('类型').selectOption('案例')
  await page.getByLabel('正文').fill('第一条虚构正文。')
  await page.getByRole('button', { name: '保存草稿' }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  await page.goto('/materials/new')
  await page.getByLabel('标题').fill(title)
  await expect(page.getByText('已有同标题素材，仍可继续保存。')).toBeVisible()
  await page.getByLabel('类型').selectOption('故事')
  await page.getByLabel('正文').fill('第二条虚构正文。')
  await page.getByRole('button', { name: '保存草稿' }).click()
  await expect(page.getByText('第二条虚构正文。')).toBeVisible()

  await page.goto('/materials')
  await page.getByLabel('搜索标题').fill(title)
  await page.getByRole('button', { name: '搜索' }).click()
  await expect(page.getByText('共 2 条素材')).toBeVisible()
})

for (const width of [1280, 375]) {
  test(`material status filter combines with search and resets page at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    const marker = crypto.randomUUID()
    const title = `虚构状态筛选 ${marker}`
    const response = await page.request.post('/api/v1/materials', {
      data: { title, type: '故事', body: '虚构筛选正文' },
    })
    expect(response.ok()).toBe(true)

    await page.goto(`/materials?q=${encodeURIComponent(marker)}&page=2`)
    await expect(page.getByText('共 1 条素材')).toBeVisible()
    await expect(page.getByText('第 2 页')).toBeVisible()
    await page.getByLabel('状态').selectOption('草稿')
    await expect(page).toHaveURL(/status=%E8%8D%89%E7%A8%BF.*page=1/)
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await page.getByLabel('状态').selectOption('可用')
    await expect(page.getByText('共 0 条素材')).toBeVisible()
    await page.getByLabel('状态').selectOption('')
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await page.getByLabel('搜索标题').fill(`${marker} missing`)
    await page.getByRole('button', { name: '搜索' }).click()
    await expect(page.getByText('共 0 条素材')).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}
