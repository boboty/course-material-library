import { expect, test } from '@playwright/test'

test('shows status from the real backend', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'System Status' })).toBeVisible()
  await expect(page.getByText('Backend ready · ok')).toBeVisible()
})
