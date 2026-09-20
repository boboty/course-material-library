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
