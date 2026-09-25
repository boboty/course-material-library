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
  await page.getByLabel('搜索标题或正文').fill(title)
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
  await page.getByLabel('搜索标题或正文').fill(title)
  await page.getByRole('button', { name: '搜索' }).click()
  await expect(page.getByText('共 2 条素材')).toBeVisible()
})

for (const width of [1280, 375]) {
  test(`duplicate title warning follows exact backend match at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    const title = `虚构重复提示 ${crypto.randomUUID()}`
    const existing = await page.request.post('/api/v1/materials', {
      data: { title, type: '故事', body: '已有虚构正文' },
    })
    expect(existing.ok()).toBe(true)
    const warning = page.getByRole('status').filter({ hasText: '已有同标题素材，仍可继续保存。' })

    await page.goto('/materials/new')
    await page.getByLabel('标题').fill(`${title} 新`)
    await expect(page.getByRole('button', { name: '保存草稿' })).toBeEnabled()
    await page.waitForTimeout(600)
    await expect(warning).toHaveCount(0)

    await page.getByLabel('标题').fill(title)
    await expect(warning).toBeVisible()
    await expect(warning.getByRole('link', { name: '查看已有素材' })).toHaveAttribute('href', `/materials/${(await existing.json()).id}`)

    await page.getByLabel('标题').fill(`${title}x`)
    await expect(warning).toHaveCount(0)

    await page.getByLabel('标题').fill(title)
    await expect(warning).toBeVisible()
    await page.getByLabel('类型').selectOption('案例')
    await page.getByLabel('正文').fill('重复提示后继续保存的虚构正文。')
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.getByRole('button', { name: '保存草稿' }).click()
    await expect(page.getByText('重复提示后继续保存的虚构正文。')).toBeVisible()

    const saved = await page.request.get(`/api/v1/materials?${new URLSearchParams({ title })}`)
    expect((await saved.json()).total).toBe(2)
  })
}

for (const width of [1280, 375]) {
  test(`material type, body search and combined filters work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    const marker = crypto.randomUUID()
    const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

    // 每种素材类型各建一条，关键词统一放在正文中，以验证正文搜索和单选类型筛选。
    for (const [index, type] of ['故事', '案例', 'Demo', '金句', '段子', '行业素材'].entries()) {
      const response = await page.request.post('/api/v1/materials', {
        data: { title: `虚构类型筛选 ${marker} ${index}`, type, body: `正文检索 ${marker}` },
      })
      expect(response.ok()).toBe(true)
      if (type === '案例') {
        const { id } = await response.json()
        const updated = await page.request.put(`/api/v1/materials/${id}`, {
          data: { title: `虚构类型筛选 ${marker} ${index}`, type, body: `正文检索 ${marker}`, status: '可用' },
        })
        expect(updated.ok()).toBe(true)
      }
    }

    const pageItems = await page.request.get(`/api/v1/materials?${new URLSearchParams({ type: 'Demo', status: '可用', q: marker })}`)
    expect((await pageItems.json()).total).toBe(0)
    await page.goto(`/materials?q=${encodeURIComponent(marker)}&page=2`)
    await expect(page.getByText('共 6 条素材')).toBeVisible()
    await expect(page.getByText('第 2 页')).toBeVisible()
    await page.getByLabel('类型').selectOption('案例')
    await expect(page).toHaveURL(/type=%E6%A1%88%E4%BE%8B.*page=1/)
    await expect(page.getByText('共 1 条素材')).toBeVisible()
    await expect(page.getByRole('heading', { name: new RegExp(`虚构类型筛选 ${marker} 1`) })).toBeVisible()

    await page.getByLabel('状态').selectOption('可用')
    await expect(page).toHaveURL(/type=%E6%A1%88%E4%BE%8B.*status=%E5%8F%AF%E7%94%A8.*page=1/)
    await expect(page.getByText('共 1 条素材')).toBeVisible()
    await page.getByLabel('类型').selectOption('')
    await expect(page.getByLabel('状态')).toHaveValue('可用')
    await expect(page.getByText('共 1 条素材')).toBeVisible()

    await page.getByLabel('搜索标题或正文').fill(marker)
    await page.getByRole('button', { name: '搜索' }).click()
    await expect(page).toHaveURL(/q=.*type=&status=%E5%8F%AF%E7%94%A8&page=1/)
    await expect(page.getByRole('heading', { name: new RegExp(`虚构类型筛选 ${marker} 1`) })).toBeVisible()

    // 构造超过一页的同条件结果，验证 UI 翻页仍携带关键词、类型和状态。
    for (let index = 0; index < 21; index += 1) {
      const title = `虚构分页筛选 ${marker} ${index}`
      const response = await page.request.post('/api/v1/materials', {
        data: { title, type: 'Demo', body: `分页正文 ${marker}` },
      })
      expect(response.ok()).toBe(true)
      const { id } = await response.json()
      const updated = await page.request.put(`/api/v1/materials/${id}`, {
        data: { title, type: 'Demo', body: `分页正文 ${marker}`, status: '可用' },
      })
      expect(updated.ok()).toBe(true)
    }
    await page.getByLabel('类型').selectOption('Demo')
    await expect(page.getByText('共 21 条素材')).toBeVisible()
    await page.getByRole('button', { name: '下一页' }).click()
    await expect(page).toHaveURL(/q=.*type=Demo&status=%E5%8F%AF%E7%94%A8&page=2/)
    await expect(page.getByText('共 21 条素材')).toBeVisible()
    await expect(page.getByText('第 2 页')).toBeVisible()
    await expect.poll(noOverflow).toBe(true)
  })
}

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
    await page.getByLabel('搜索标题或正文').fill(`${marker} missing`)
    await page.getByRole('button', { name: '搜索' }).click()
    await expect(page.getByText('共 0 条素材')).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}

for (const width of [1280, 375]) {
  test(`edit material from detail and return with latest content at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    const title = `虚构编辑 ${crypto.randomUUID()}`
    const created = await page.request.post('/api/v1/materials', { data: { title, type: '故事', body: '编辑前虚构正文' } })
    const { id } = await created.json()
    const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

    await page.goto(`/materials/${id}`)
    await page.getByRole('link', { name: '编辑素材' }).click()
    await expect(page).toHaveURL(`/materials/${id}/edit`)
    await expect(page.getByLabel('标题')).toHaveValue(title)
    await expect(page.getByLabel('类型')).toHaveValue('故事')
    await expect(page.getByLabel('正文')).toHaveValue('编辑前虚构正文')
    await expect(page.getByLabel('状态')).toHaveValue('草稿')
    await expect.poll(noOverflow).toBe(true)

    await page.getByLabel('标题').fill('   ')
    await page.getByRole('button', { name: '保存修改' }).click()
    await expect(page.getByRole('alert')).toHaveText('标题不能为空')
    await expect(page).toHaveURL(`/materials/${id}/edit`)

    await page.getByLabel('标题').fill(`${title} 新`)
    await page.getByLabel('正文').fill('')
    await page.getByLabel('状态').selectOption('可用')
    await page.getByRole('button', { name: '保存修改' }).click()
    await expect(page.getByRole('alert')).toHaveText('非草稿素材必须填写类型和正文')
    expect((await (await page.request.get(`/api/v1/materials/${id}`)).json()).title).toBe(title)

    await page.getByLabel('类型').selectOption('案例')
    await page.getByLabel('正文').fill('编辑后虚构正文')
    await page.getByLabel('状态').selectOption('主力')
    await expect.poll(noOverflow).toBe(true)
    await page.getByRole('button', { name: '保存修改' }).click()
    await expect(page).toHaveURL(`/materials/${id}`)
    await expect(page.getByRole('heading', { name: `${title} 新` })).toBeVisible()
    await expect(page.locator('.detail-title').getByText('主力')).toBeVisible()
    await expect(page.getByText('案例', { exact: true })).toBeVisible()
    await expect(page.getByText('编辑后虚构正文')).toBeVisible()
    await expect.poll(noOverflow).toBe(true)
    await page.reload()
    await expect(page.getByText('编辑后虚构正文')).toBeVisible()
  })
}

test('draft may be saved without type or body, and same title is allowed', async ({ page }) => {
  const title = `虚构编辑同标题 ${crypto.randomUUID()}`
  await page.request.post('/api/v1/materials', { data: { title, type: '金句', body: '已有虚构正文' } })
  const other = await (await page.request.post('/api/v1/materials', { data: { title: `${title} 另`, type: '故事', body: '另一条' } })).json()
  await page.goto(`/materials/${other.id}/edit`)
  await page.getByLabel('标题').fill(title)
  await page.getByLabel('类型').selectOption('')
  await page.getByLabel('正文').fill('')
  await page.getByRole('button', { name: '保存修改' }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await expect(page.getByText('尚未填写正文')).toBeVisible()
  const saved = await page.request.get(`/api/v1/materials?${new URLSearchParams({ title })}`)
  expect((await saved.json()).total).toBe(2)
})

test('editing a missing material shows not found', async ({ page }) => {
  await page.goto(`/materials/${crypto.randomUUID()}/edit`)
  await expect(page.getByText('素材不存在')).toBeVisible()
  await expect(page.getByRole('button', { name: '保存修改' })).toHaveCount(0)
})
