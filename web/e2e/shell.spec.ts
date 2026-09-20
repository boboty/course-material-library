import { expect, test } from '@playwright/test'

test('unknown route renders the 404 page instead of a blank screen', async ({ page }) => {
  await page.goto('/no-such-page')
  await expect(page.getByRole('heading', { name: '页面不存在' })).toBeVisible()
  await page.getByRole('link', { name: '返回素材列表' }).click()
  await expect(page.getByRole('heading', { name: '素材列表' })).toBeVisible()
})

test('shell declares Chinese language and the product title', async ({ page }) => {
  await page.goto('/materials')
  await expect(page).toHaveTitle('课程素材库')
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
})
