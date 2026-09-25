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
  await page.getByLabel('搜索标题、正文或标签').fill(title)
  await page.getByRole('button', { name: '搜索' }).click()
  await expect(page.getByText('共 1 条素材')).toBeVisible()
  await page.getByRole('link', { name: new RegExp(title) }).click()
  await expect(page.getByText('这是一条虚构的测试正文。')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
})

for (const width of [1280, 375]) {
  test(`draft inbox filters, summarizes, edits and paginates at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    const title = `虚构待补全 ${crypto.randomUUID()}`
    const created = await page.request.post('/api/v1/materials', {
      data: { title, type: '故事', body: '虚构草稿正文摘要。' },
    })
    expect(created.ok()).toBe(true)
    const material = await created.json() as { id: string }
    const enriched = await page.request.put(`/api/v1/materials/${material.id}`, {
      data: {
        title, type: '故事', body: '虚构草稿正文摘要。', status: '草稿',
        supporting_judgment: '支撑虚构判断。', speaking_notes: '先提问，再归纳。',
        source_note: '虚构内部来源备注。', tags: ['虚构标签'],
      },
    })
    expect(enriched.ok()).toBe(true)
    const publishedTitle = `虚构非草稿 ${crypto.randomUUID()}`
    const published = await page.request.post('/api/v1/materials', {
      data: { title: publishedTitle, type: '案例', body: '虚构可用素材正文' },
    })
    expect(published.ok()).toBe(true)
    const publishedMaterial = await published.json() as { id: string }
    const publishedUpdate = await page.request.put(`/api/v1/materials/${publishedMaterial.id}`, {
      data: { title: publishedTitle, type: '案例', body: '虚构可用素材正文', status: '可用' },
    })
    expect(publishedUpdate.ok()).toBe(true)

    await page.goto('/materials')
    await page.getByRole('link', { name: '草稿待补全' }).click()
    await expect(page).toHaveURL('/materials/drafts')
    await expect(page.getByRole('link', { name: '草稿待补全' })).toHaveClass(/app-nav__link--active/)
    await expect(page.getByRole('link', { name: '素材', exact: true })).not.toHaveClass(/app-nav__link--active/)
    const card = page.locator('.draft-card').filter({ has: page.getByRole('heading', { name: title }) })
    await expect(card).toBeVisible()
    await expect(card.getByText('故事', { exact: true })).toBeVisible()
    await expect(card.getByText('虚构草稿正文摘要。')).toBeVisible()
    await expect(card.getByText('支撑虚构判断。')).toBeVisible()
    await expect(card.getByText('先提问，再归纳。')).toBeVisible()
    await expect(card.getByText('虚构内部来源备注。')).toBeVisible()
    await expect(card.getByText('标签：虚构标签')).toBeVisible()
    await expect(page.getByRole('heading', { name: publishedTitle })).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    await card.getByRole('link', { name: '直接编辑' }).click()
    await expect(page).toHaveURL(`/materials/${material.id}/edit`)
    await expect(page.getByLabel('状态')).toHaveValue('草稿')
    await page.getByLabel('状态').selectOption('可用')
    await page.getByRole('button', { name: '保存修改' }).click()
    await expect(page).toHaveURL(`/materials/${material.id}`)
    await page.goto('/materials/drafts')
    await expect(page.getByRole('heading', { name: title })).toHaveCount(0)

    for (let index = 0; index < 21; index += 1) {
      const draftResponse = await page.request.post('/api/v1/materials', {
        data: { title: `虚构待补全分页 ${index} ${crypto.randomUUID()}`, type: '金句', body: '虚构分页正文' },
      })
      expect(draftResponse.ok()).toBe(true)
    }
    await page.goto('/materials/drafts')
    const pageOne = await page.request.get('/api/v1/materials?status=%E8%8D%89%E7%A8%BF&page=1&page_size=20')
    const pageTwo = await page.request.get('/api/v1/materials?status=%E8%8D%89%E7%A8%BF&page=2&page_size=20')
    const one = await pageOne.json() as { items: Array<{ title: string }>; total: number }
    const two = await pageTwo.json() as { items: Array<{ title: string }> }
    expect(one.total).toBeGreaterThan(20)
    await expect(page.locator('.draft-card h2')).toHaveText(one.items.map(item => item.title))
    await page.getByRole('button', { name: '下一页' }).click()
    await expect(page).toHaveURL('/materials/drafts?page=2')
    await expect(page.locator('.draft-card h2')).toHaveText(two.items.map(item => item.title))
  })
}

test('draft inbox shows an empty state when there are no drafts', async ({ page }) => {
  await page.route('**/api/v1/materials?*', async route => {
    const url = new URL(route.request().url())
    if (url.searchParams.get('status') === '草稿') {
      await route.fulfill({ json: { items: [], page: 1, page_size: 20, total: 0 } })
    } else {
      await route.continue()
    }
  })
  await page.goto('/materials/drafts')
  await expect(page.getByText('当前没有待补全的草稿。新素材保存后会出现在这里。')).toBeVisible()
  await expect(page.getByRole('link', { name: '快速录入' })).toBeVisible()
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
  await page.getByLabel('搜索标题、正文或标签').fill(title)
  await page.getByRole('button', { name: '搜索' }).click()
  await expect(page.getByText('共 2 条素材')).toBeVisible()
})

for (const width of [1280, 375]) {
  test(`review alerts filter and show the two actual-use sessions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    const title = `虚构连续差提示 ${crypto.randomUUID()}`
    const created = await page.request.post('/api/v1/materials', {
      data: { title, type: '故事', body: '虚构提示列表正文' },
    })
    expect(created.ok()).toBe(true)
    const material = await created.json() as { id: string }
    const updated = await page.request.put(`/api/v1/materials/${material.id}`, {
      data: { title, type: '故事', body: '虚构提示列表正文', status: '可用', review_date: '2000-01-01' },
    })
    expect(updated.ok()).toBe(true)

    async function record(day: string, effect: string) {
      const customer = await (await page.request.post('/api/v1/customers', {
        data: { name: `虚构提示客户 ${crypto.randomUUID()}` },
      })).json() as { id: string; name: string }
      const course = await (await page.request.post('/api/v1/courses', {
        data: { name: `虚构提示课程 ${crypto.randomUUID()}` },
      })).json() as { id: string; name: string }
      const audience = await (await page.request.post('/api/v1/audience-types', {
        data: { name: `虚构提示人群 ${crypto.randomUUID()}` },
      })).json() as { id: string; name: string }
      const sessionResponse = await page.request.post('/api/v1/sessions', {
        data: { customer_id: customer.id, course_id: course.id, session_date: day,
          audience_type_ids: [audience.id], duration: '一天' },
      })
      expect(sessionResponse.ok()).toBe(true)
      const session = await sessionResponse.json() as { id: string }
      const plannedResponse = await page.request.post(`/api/v1/sessions/${session.id}/usages`, {
        data: { material_id: material.id },
      })
      expect(plannedResponse.ok()).toBe(true)
      const usage = await plannedResponse.json() as { id: string }
      const saved = await page.request.put(`/api/v1/sessions/${session.id}/post-class`, {
        data: { usages: [{ id: usage.id, status: '已用', effect }] },
      })
      expect(saved.ok()).toBe(true)
      return { day, customer: customer.name, course: course.name, audience: audience.name }
    }

    const older = await record('2026-09-20', '差')
    const newer = await record('2026-09-21', '差')
    await page.goto('/materials')
    await page.getByLabel('系统提示').selectOption('review_overdue')
    const warningCard = page.getByRole('link', { name: new RegExp(title) })
    await expect(warningCard).toBeVisible()
    await expect(warningCard.getByText('复核已过期（2000-01-01）')).toBeVisible()
    await expect(page.getByText('建议复核')).toHaveCount(0)
    await page.getByLabel('系统提示').selectOption('consecutive_bad')
    await expect(warningCard.getByText('建议复核')).toBeVisible()
    for (const details of [older, newer]) {
      await expect(warningCard.getByText(new RegExp(`${details.day}.*${details.audience}.*${details.customer}.*${details.course}`))).toBeVisible()
    }
    const savedMaterial = await (await page.request.get(`/api/v1/materials/${material.id}`)).json() as { status: string }
    expect(savedMaterial.status).toBe('可用')
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}

for (const width of [1280, 375]) {
  test(`review, demo verification, case category and retirement fields edit and display at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    async function createMaterial(title: string, type: string, status: string, extra: object) {
      const name = `${title} ${crypto.randomUUID()}`
      const created = await page.request.post('/api/v1/materials', {
        data: { title: name, type, body: '虚构字段测试正文' },
      })
      expect(created.ok()).toBe(true)
      const material = await created.json() as { id: string; title: string }
      const updated = await page.request.put(`/api/v1/materials/${material.id}`, {
        data: { title: name, type, body: '虚构字段测试正文', status, ...extra },
      })
      expect(updated.ok()).toBe(true)
      return material
    }

    const caseMaterial = await createMaterial('虚构案例字段', '案例', '退役', {
      review_date: '2026-09-01', case_category: 'B 情境案例', retirement_reason: '虚构退役原因',
    })
    await page.goto(`/materials/${caseMaterial.id}`)
    await expect(page.getByText('2026-09-01')).toBeVisible()
    await expect(page.getByText('B 情境案例')).toBeVisible()
    await expect(page.getByText('虚构退役原因')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Demo 最后验证可用日期' })).toHaveCount(0)

    await page.goto(`/materials/${caseMaterial.id}/edit`)
    await expect(page.getByLabel('案例类别')).toBeVisible()
    await expect(page.getByLabel('退役原因')).toBeVisible()
    await page.getByLabel('复核日期').fill('')
    await page.getByLabel('复核日期').press('Tab')
    await expect(page.getByLabel('复核日期')).toHaveValue('')
    await page.getByLabel('案例类别').selectOption('')
    await page.getByLabel('退役原因').fill('')
    await expect(page.getByLabel('复核日期')).toHaveValue('')
    const clearedCaseResponse = page.waitForResponse(response =>
      response.url().endsWith(`/api/v1/materials/${caseMaterial.id}`)
      && response.request().method() === 'PUT'
      && response.status() === 200)
    await page.getByRole('button', { name: '保存修改' }).click()
    const caseResponse = await clearedCaseResponse
    expect(caseResponse.request().postDataJSON()).toMatchObject({
      review_date: null, case_category: null, retirement_reason: null,
    })
    await expect(page.getByRole('heading', { name: caseMaterial.title })).toBeVisible()
    const clearedCase = await (await page.request.get(`/api/v1/materials/${caseMaterial.id}`)).json() as {
      review_date: string | null; case_category: string | null; retirement_reason: string | null
    }
    expect(clearedCase).toMatchObject({ review_date: null, case_category: null, retirement_reason: null })
    await expect(page.getByRole('heading', { name: '复核日期' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: '案例类别' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: '退役原因' })).toHaveCount(0)

    const demoMaterial = await createMaterial('虚构 Demo 字段', 'Demo', '可用', {
      review_date: '2026-09-10', demo_verified_on: '2026-09-20',
    })
    await page.goto(`/materials/${demoMaterial.id}`)
    await expect(page.getByText('2026-09-10')).toBeVisible()
    await expect(page.getByText('2026-09-20')).toBeVisible()
    await expect(page.getByRole('heading', { name: '案例类别' })).toHaveCount(0)
    await page.goto(`/materials/${demoMaterial.id}/edit`)
    await expect(page.getByLabel('Demo 最后验证可用日期')).toBeVisible()
    await expect(page.getByLabel('案例类别')).toHaveCount(0)
    await page.getByLabel('Demo 最后验证可用日期').fill('')
    await page.getByLabel('Demo 最后验证可用日期').press('Tab')
    const clearedDemoResponse = page.waitForResponse(response =>
      response.url().endsWith(`/api/v1/materials/${demoMaterial.id}`)
      && response.request().method() === 'PUT'
      && response.status() === 200)
    await page.getByRole('button', { name: '保存修改' }).click()
    const demoResponse = await clearedDemoResponse
    expect(demoResponse.request().postDataJSON().demo_verified_on).toBeNull()
    await expect(page.getByRole('heading', { name: demoMaterial.title })).toBeVisible()
    const clearedDemoDate = await (await page.request.get(`/api/v1/materials/${demoMaterial.id}`)).json() as {
      demo_verified_on: string | null
    }
    expect(clearedDemoDate.demo_verified_on).toBeNull()

    await page.goto(`/materials/${demoMaterial.id}/edit`)
    await page.getByLabel('类型').selectOption('故事')
    await expect(page.getByLabel('类型')).toHaveValue('故事')
    await expect(page.getByLabel('Demo 最后验证可用日期')).toHaveCount(0)
    const switchedResponse = page.waitForResponse(response =>
      response.url().endsWith(`/api/v1/materials/${demoMaterial.id}`)
      && response.request().method() === 'PUT'
      && response.status() === 200)
    await page.getByRole('button', { name: '保存修改' }).click()
    const switchResponse = await switchedResponse
    expect(switchResponse.request().postDataJSON()).toMatchObject({ type: '故事', demo_verified_on: null })
    await expect(page.getByRole('heading', { name: demoMaterial.title })).toBeVisible()
    const switched = await (await page.request.get(`/api/v1/materials/${demoMaterial.id}`)).json() as {
      type: string; demo_verified_on: string | null
    }
    expect(switched.type).toBe('故事')
    expect(switched.demo_verified_on).toBeNull()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}

for (const width of [1280, 375]) {
  test(`source materials form a flat family and can be cleared at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    async function createMaterial(title: string) {
      const response = await page.request.post('/api/v1/materials', {
        data: { title: `${title} ${crypto.randomUUID()}`, type: '故事', body: '虚构家族正文' },
      })
      expect(response.ok()).toBe(true)
      return response.json() as Promise<{ id: string; title: string }>
    }
    async function saveSource(material: { id: string; title: string }, sourceId: string,
      expectedSourceRoot: string) {
      await page.goto(`/materials/${material.id}/edit`)
      await page.getByLabel('源素材').selectOption(sourceId)
      await expect(page.getByLabel('源素材')).toHaveValue(sourceId)
      const saved = page.waitForResponse(response =>
        response.url().endsWith(`/api/v1/materials/${material.id}`)
        && response.request().method() === 'PUT'
        && response.status() === 200)
      await page.getByRole('button', { name: '保存修改' }).click()
      const response = await saved
      expect(response.request().postDataJSON().source_material_id).toBe(sourceId)
      expect((await response.json()).source_material_id).toBe(expectedSourceRoot)
      await expect(page.getByRole('heading', { name: material.title })).toBeVisible()
    }

    const root = await createMaterial('虚构家族根')
    const child = await createMaterial('虚构家族子素材')
    const variant = await createMaterial('虚构家族变体')
    await saveSource(child, root.id, root.id)
    await saveSource(variant, child.id, root.id)

    const variantData = await (await page.request.get(`/api/v1/materials/${variant.id}`)).json() as {
      source_material_id: string; source_material: { id: string }; family_members: Array<{ id: string }>
    }
    expect(variantData.source_material_id).toBe(root.id)
    expect(variantData.source_material.id).toBe(root.id)
    expect(new Set(variantData.family_members.map(member => member.id))).toEqual(new Set([root.id, child.id]))
    await page.goto(`/materials/${root.id}`)
    await expect(page.getByRole('heading', { name: '素材家族' })).toBeVisible()
    await expect(page.getByRole('link', { name: child.title })).toBeVisible()
    await expect(page.getByRole('link', { name: variant.title })).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    await page.goto(`/materials/${variant.id}/edit`)
    await page.getByLabel('源素材').selectOption('')
    await expect(page.getByLabel('源素材')).toHaveValue('')
    const clearedSource = page.waitForResponse(response =>
      response.url().endsWith(`/api/v1/materials/${variant.id}`)
      && response.request().method() === 'PUT'
      && response.status() === 200)
    await page.getByRole('button', { name: '保存修改' }).click()
    const clearedResponse = await clearedSource
    expect(clearedResponse.request().postDataJSON().source_material_id).toBeNull()
    expect((await clearedResponse.json()).source_material_id).toBeNull()
    await expect(page.getByText('无（当前素材为家族根）')).toBeVisible()
    const cleared = await (await page.request.get(`/api/v1/materials/${variant.id}`)).json() as {
      source_material_id: string | null; family_members: Array<{ id: string }>
    }
    expect(cleared.source_material_id).toBeNull()
    expect(cleared.family_members).toEqual([])
  })
}

for (const width of [1280, 375]) {
  test(`material tags can be added, normalized, removed and read back at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    const title = `虚构自由标签 ${crypto.randomUUID()}`
    const created = await page.request.post('/api/v1/materials', {
      data: { title, type: '故事', body: '虚构标签测试正文' },
    })
    expect(created.ok()).toBe(true)
    const material = await created.json() as { id: string; tags: string[] }
    expect(material.tags).toEqual([])

    await page.goto(`/materials/${material.id}/edit`)
    const tagInput = page.getByLabel('添加标签')
    await tagInput.fill('  复盘  ')
    await page.getByRole('button', { name: '添加标签' }).click()
    await tagInput.fill('复盘')
    await page.getByRole('button', { name: '添加标签' }).click()
    await expect(page.getByLabel('删除标签 复盘')).toHaveCount(1)
    await tagInput.fill('故事线索')
    await page.getByRole('button', { name: '添加标签' }).click()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.getByRole('button', { name: '保存修改' }).click()
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await expect(page.getByRole('heading', { name: '标签', exact: true })).toBeVisible()
    await expect(page.getByText('复盘、故事线索')).toBeVisible()
    expect((await (await page.request.get(`/api/v1/materials/${material.id}`)).json()).tags).toEqual(['复盘', '故事线索'])

    await page.goto(`/materials/${material.id}/edit`)
    await expect(page.getByLabel('删除标签 复盘')).toBeVisible()
    await page.getByLabel('删除标签 复盘').click()
    const updatedResponse = page.waitForResponse(response =>
      response.url().endsWith(`/api/v1/materials/${material.id}`)
      && response.request().method() === 'PUT'
      && response.status() === 200)
    await page.getByRole('button', { name: '保存修改' }).click()
    const tagResponse = await updatedResponse
    expect((await tagResponse.json()).tags).toEqual(['故事线索'])
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await expect(page.getByText('故事线索', { exact: true })).toBeVisible()
    expect((await (await page.request.get(`/api/v1/materials/${material.id}`)).json()).tags).toEqual(['故事线索'])
  })
}

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
    const savedResponse = page.waitForResponse(response =>
      response.url().endsWith('/api/v1/materials')
      && response.request().method() === 'POST'
      && response.status() === 201)
    await page.getByRole('button', { name: '保存草稿' }).click()
    await savedResponse
    await expect(page.getByText('重复提示后继续保存的虚构正文。')).toBeVisible()

    const saved = await page.request.get(`/api/v1/materials?${new URLSearchParams({ title })}`)
    expect((await saved.json()).total).toBe(2)
  })
}

for (const width of [1280, 375]) {
  test(`course filter loads all courses and combines with other filters at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    const marker = crypto.randomUUID()

    let courses = await (await page.request.get('/api/v1/courses?page=1&page_size=100')).json() as {
      items: Array<{ id: string; name: string }>; total: number
    }
    while (courses.total <= 100) {
      const batch = Math.min(100 - courses.total + 1, 25)
      const created = await Promise.all(Array.from({ length: batch }, async () => {
        const name = `虚构课程候选 ${crypto.randomUUID()}`
        const response = await page.request.post('/api/v1/courses', { data: { name } })
        expect(response.ok()).toBe(true)
        return response.json() as Promise<{ id: string; name: string }>
      }))
      courses = { ...courses, total: courses.total + created.length }
    }
    const secondPage = await (await page.request.get('/api/v1/courses?page=2&page_size=100')).json() as {
      items: Array<{ id: string; name: string }>
    }
    const selectedCourse = secondPage.items[0]
    expect(selectedCourse).toBeTruthy()
    const stopped = await page.request.put(`/api/v1/courses/${selectedCourse.id}`, {
      data: { name: selectedCourse.name, status: '停用' },
    })
    expect(stopped.ok()).toBe(true)

    const otherCourse = await page.request.post('/api/v1/courses', {
      data: { name: `虚构共享课程 ${marker}` },
    }).then(response => response.json()) as { id: string }
    for (let index = 0; index < 21; index += 1) {
      const title = `虚构课程筛选 ${marker} ${index}`
      const created = await page.request.post('/api/v1/materials', {
        data: { title, type: 'Demo', body: `课程筛选正文 ${marker}` },
      })
      expect(created.ok()).toBe(true)
      const material = await created.json() as { id: string }
      const updated = await page.request.put(`/api/v1/materials/${material.id}`, {
        data: {
          title, type: 'Demo', body: `课程筛选正文 ${marker}`, status: '可用',
          course_ids: index === 0 ? [selectedCourse.id, otherCourse.id] : [selectedCourse.id],
        },
      })
      expect(updated.ok()).toBe(true)
    }
    const unassociated = await page.request.post('/api/v1/materials', {
      data: { title: `虚构无课程 ${marker}`, type: 'Demo', body: `课程筛选正文 ${marker}` },
    })
    expect(unassociated.ok()).toBe(true)

    await page.goto(`/materials?q=${encodeURIComponent(marker)}&page=2`)
    await expect(page.getByText('共 22 条素材')).toBeVisible()
    const courseFilter = page.getByLabel('课程')
    await expect(courseFilter.locator(`option[value="${selectedCourse.id}"]`)).toHaveCount(1)
    await expect(courseFilter.locator(`option[value="${selectedCourse.id}"]`)).toContainText('（停用）')
    await courseFilter.selectOption(selectedCourse.id)
    await expect(page).toHaveURL(new RegExp(`course_id=${selectedCourse.id}.*page=1`))
    await expect(page.getByText('共 21 条素材')).toBeVisible()
    await page.getByLabel('类型').selectOption('Demo')
    await page.getByLabel('状态').selectOption('可用')
    await expect(page.getByText('共 21 条素材')).toBeVisible()
    await expect(page.getByRole('heading', { name: new RegExp(`虚构课程筛选 ${marker} `) }).first()).toBeVisible()
    await page.getByRole('button', { name: '下一页' }).click()
    await expect(page).toHaveURL(new RegExp(`q=.*course_id=${selectedCourse.id}.*type=Demo&status=%E5%8F%AF%E7%94%A8&page=2`))
    await expect(page.getByText('共 21 条素材')).toBeVisible()
    await expect(page.getByText('第 2 页')).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}

for (const width of [1280, 375]) {
  test(`material audience and industry associations load all choices at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })

    async function ensureSecondPageChoices(path: string, label: string) {
      let result = await (await page.request.get(`${path}?page=1&page_size=100`)).json() as {
        items: Array<{ id: string; name: string }>; total: number
      }
      while (result.total <= 100) {
        const batch = Math.min(100 - result.total + 1, 25)
        const created = await Promise.all(Array.from({ length: batch }, async () => {
          const response = await page.request.post(path, {
            data: { name: `虚构${label}候选 ${crypto.randomUUID()}` },
          })
          expect(response.ok()).toBe(true)
          return response.json() as Promise<{ id: string; name: string }>
        }))
        result = { ...result, total: result.total + created.length }
      }
      const pageTwo = await (await page.request.get(`${path}?page=2&page_size=100`)).json() as {
        items: Array<{ id: string; name: string }>
      }
      expect(pageTwo.items.length).toBeGreaterThan(0)
      return pageTwo.items[0]
    }

    const audience = await ensureSecondPageChoices('/api/v1/audience-types', '人群')
    const industry = await ensureSecondPageChoices('/api/v1/industries', '行业')
    const title = `虚构适用关联 ${crypto.randomUUID()}`
    const created = await page.request.post('/api/v1/materials', {
      data: { title, type: '案例', body: '虚构适用关系正文' },
    })
    expect(created.ok()).toBe(true)
    const material = await created.json() as { id: string }

    await page.goto(`/materials/${material.id}/edit`)
    await expect(page.getByRole('heading', { name: '编辑素材' })).toBeVisible()
    await expect(page.getByLabel(audience.name)).toBeVisible()
    await expect(page.getByLabel(industry.name)).toBeVisible()
    await page.getByLabel(audience.name).check()
    await page.getByLabel(industry.name).check()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.getByRole('button', { name: '保存修改' }).click()
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await expect(page.getByText(audience.name, { exact: true })).toBeVisible()
    await expect(page.getByText(industry.name, { exact: true })).toBeVisible()

    await page.goto(`/materials/${material.id}/edit`)
    await expect(page.getByLabel(audience.name)).toBeChecked()
    await expect(page.getByLabel(industry.name)).toBeChecked()
    await page.getByLabel(audience.name).uncheck()
    await page.getByLabel(industry.name).uncheck()
    await page.getByRole('button', { name: '保存修改' }).click()
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await expect(page.getByRole('heading', { name: '适用人群' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: '适用行业' })).toHaveCount(0)
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

    await page.getByLabel('搜索标题、正文或标签').fill(marker)
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
  test(`material audience, industry and tag filters combine with search and pagination at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    const marker = crypto.randomUUID()

    async function ensureSecondPageChoice(path: string, label: string) {
      let result = await (await page.request.get(`${path}?page=1&page_size=100`)).json() as {
        items: Array<{ id: string; name: string }>; total: number
      }
      while (result.total <= 100) {
        const batch = Math.min(100 - result.total + 1, 25)
        const created = await Promise.all(Array.from({ length: batch }, async () => {
          const response = await page.request.post(path, {
            data: { name: `虚构${label}列表候选 ${crypto.randomUUID()}` },
          })
          expect(response.ok()).toBe(true)
          return response.json() as Promise<{ id: string; name: string }>
        }))
        result = { ...result, total: result.total + created.length }
      }
      const secondPage = await (await page.request.get(`${path}?page=2&page_size=100`)).json() as {
        items: Array<{ id: string; name: string }>
      }
      return secondPage.items[0]
    }

    const audience = await ensureSecondPageChoice('/api/v1/audience-types', '人群')
    const industry = await ensureSecondPageChoice('/api/v1/industries', '行业')
    const course = await page.request.post('/api/v1/courses', {
      data: { name: `虚构筛选课程 ${marker}` },
    }).then(response => response.json()) as { id: string }

    for (let index = 0; index < 21; index += 1) {
      const title = `虚构组合筛选 ${marker} ${index}`
      const created = await page.request.post('/api/v1/materials', {
        data: { title, type: 'Demo', body: '虚构组合筛选正文' },
      })
      expect(created.ok()).toBe(true)
      const material = await created.json() as { id: string }
      const updated = await page.request.put(`/api/v1/materials/${material.id}`, {
        data: {
          title, type: 'Demo', body: '虚构组合筛选正文', status: '可用',
          audience_type_ids: [audience.id], industry_ids: [industry.id],
          course_ids: [course.id], tags: [marker, '组合筛选标签'],
        },
      })
      expect(updated.ok()).toBe(true)
    }

    await page.goto(`/materials?q=${encodeURIComponent(marker)}&page=2`)
    await expect(page.getByText('共 21 条素材')).toBeVisible()
    await page.getByLabel('人群').selectOption(audience.id)
    await expect(page).toHaveURL(/audience_type_id=.*page=1/)
    await expect(page.getByText('共 21 条素材')).toBeVisible()
    await page.locator('#material-industry').selectOption(industry.id)
    await page.locator('#material-tag').selectOption('组合筛选标签')
    await page.getByLabel('课程').selectOption(course.id)
    await page.getByLabel('类型').selectOption('Demo')
    await page.getByLabel('状态').selectOption('可用')
    await expect(page.getByText('共 21 条素材')).toBeVisible()
    await page.getByRole('button', { name: '下一页' }).click()
    await expect(page).toHaveURL(new RegExp(`q=${marker}.*course_id=${course.id}.*audience_type_id=${audience.id}.*industry_id=${industry.id}.*tag=.*type=Demo&status=%E5%8F%AF%E7%94%A8&page=2`))
    await expect(page.getByText('第 2 页')).toBeVisible()
    await expect(page.getByText('共 21 条素材')).toBeVisible()

    await page.locator('#material-tag').selectOption('')
    await page.getByLabel('搜索标题、正文或标签').fill('unmatched-filter-query')
    await page.getByRole('button', { name: '搜索' }).click()
    await expect(page.getByText('共 0 条素材')).toBeVisible()
    await expect(page.getByText('没有找到素材。')).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}

for (const width of [1280, 375]) {
  test(`Markdown batch import validates format and saves all drafts at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    const marker = crypto.randomUUID()
    const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    await page.goto('/materials')
    await page.getByRole('link', { name: '批量导入' }).click()
    await expect(page.getByRole('heading', { name: '导入 Markdown 素材' })).toBeVisible()
    const markdown = page.getByLabel('Markdown 内容')
    const submit = page.getByRole('button', { name: '确认导入' })

    await expect(page.getByRole('alert')).toContainText('请粘贴 Markdown 内容')
    await expect(submit).toBeDisabled()
    await markdown.fill(`## 虚构标题 ${marker}\n\n中文正文。\n\n## English ${marker}\n\n  English body.  `)
    await expect(page.getByRole('status')).toHaveText('待导入 2 条素材')
    await expect(submit).toBeEnabled()
    await expect.poll(noOverflow).toBe(true)

    await markdown.fill(`## 虚构标题 ${marker}\n\n第一条正文\n\n##  \n\n第二条正文`)
    await expect(page.getByRole('alert')).toContainText('缺少素材标题')
    await expect(submit).toBeDisabled()
    expect((await (await page.request.get(`/api/v1/materials?${new URLSearchParams({ q: marker })}`)).json()).total).toBe(0)

    await markdown.fill(`## 虚构标题 ${marker}\n\n   `)
    await expect(page.getByRole('alert')).toContainText('正文不能为空')
    await expect(submit).toBeDisabled()
    await markdown.fill(`## 虚构标题 ${marker}\n\n正文\n### 非法标题`)
    await expect(page.getByRole('alert')).toContainText('格式错误')
    await expect(submit).toBeDisabled()

    await markdown.fill(`\n##  虚构标题 ${marker}  \n\n  中文正文。  \n\n## English ${marker}\n\n  English body.  `)
    await expect(page.getByRole('status')).toHaveText('待导入 2 条素材')
    await submit.click()
    await expect(page.getByRole('heading', { name: '导入完成' })).toBeVisible()
    await expect(page.getByRole('status')).toHaveText('成功导入 2 条草稿素材。')
    const result = await page.request.get(`/api/v1/materials?${new URLSearchParams({ q: marker, page_size: '10' })}`)
    const { items, total } = await result.json()
    expect(total).toBe(2)
    expect(items).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: `虚构标题 ${marker}`, body: '中文正文。', type: null, status: '草稿' }),
      expect.objectContaining({ title: `English ${marker}`, body: 'English body.', type: null, status: '草稿' }),
    ]))
    await page.getByRole('link', { name: '返回素材列表' }).click()
    await expect(page).toHaveURL('/materials')
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
    await page.getByLabel('搜索标题、正文或标签').fill(`${marker} missing`)
    await page.getByRole('button', { name: '搜索' }).click()
    await expect(page.getByText('共 0 条素材')).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}

for (const width of [1280, 375]) {
  test(`material course associations at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    const firstName = `虚构课程甲 ${crypto.randomUUID()}`
    const secondName = `虚构课程乙 ${crypto.randomUUID()}`
    await page.request.post('/api/v1/courses', { data: { name: firstName } })
    await page.request.post('/api/v1/courses', { data: { name: secondName } })
    const material = await (await page.request.post('/api/v1/materials', { data: {
      title: `虚构关联素材 ${crypto.randomUUID()}`, type: '故事', body: '虚构正文',
    } })).json()
    await page.goto(`/materials/${material.id}/edit`)
    await page.getByRole('checkbox', { name: firstName }).check()
    await page.getByRole('checkbox', { name: secondName }).check()
    await page.getByRole('button', { name: '保存修改' }).click()
    await expect(page).toHaveURL(`/materials/${material.id}`)
    const courseCard = page.locator('.detail-body').filter({
      has: page.getByRole('heading', { name: '关联课程' }),
    })
    await expect(courseCard).toContainText(firstName)
    await expect(courseCard).toContainText(secondName)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.goto(`/materials/${material.id}/edit`)
    const firstCourse = page.getByRole('checkbox', { name: firstName })
    const secondCourse = page.getByRole('checkbox', { name: secondName })
    await expect(firstCourse).toBeChecked()
    await expect(secondCourse).toBeChecked()
    await firstCourse.uncheck()
    await secondCourse.uncheck()
    await page.getByRole('button', { name: '保存修改' }).click()
    await expect(page.getByText('暂无关联课程')).toBeVisible()
  })

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
    await expect(page.getByLabel('支撑什么判断')).toHaveValue('')
    await expect(page.getByLabel('讲法要点')).toHaveValue('')
    await expect(page.getByLabel('来源备注（仅内部可见）')).toHaveValue('')
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
    await page.getByLabel('支撑什么判断').fill('支撑虚构判断。')
    await page.getByLabel('讲法要点').fill('先提问，再总结。')
    await page.getByLabel('来源备注（仅内部可见）').fill('虚构内部来源备注。')
    await page.getByLabel('状态').selectOption('主力')
    await expect.poll(noOverflow).toBe(true)
    await page.getByRole('button', { name: '保存修改' }).click()
    await expect(page).toHaveURL(`/materials/${id}`)
    await expect(page.getByRole('heading', { name: `${title} 新` })).toBeVisible()
    await expect(page.locator('.detail-title').getByText('主力')).toBeVisible()
    await expect(page.getByText('案例', { exact: true })).toBeVisible()
    await expect(page.getByText('编辑后虚构正文')).toBeVisible()
    await expect(page.getByRole('heading', { name: '支撑什么判断' })).toBeVisible()
    await expect(page.getByText('支撑虚构判断。')).toBeVisible()
    await expect(page.getByRole('heading', { name: '讲法要点' })).toBeVisible()
    await expect(page.getByText('先提问，再总结。')).toBeVisible()
    await expect(page.getByRole('heading', { name: '来源备注（仅内部可见）' })).toBeVisible()
    await expect(page.getByText('虚构内部来源备注。')).toBeVisible()
    await expect.poll(noOverflow).toBe(true)
    await page.reload()
    await expect(page.getByText('编辑后虚构正文')).toBeVisible()

    await page.goto(`/materials?q=${encodeURIComponent(title)}`)
    await expect(page.getByRole('heading', { name: `${title} 新` })).toBeVisible()
    await expect(page.getByText('虚构内部来源备注。')).toHaveCount(0)

    await page.goto(`/materials/${id}/edit`)
    await expect(page.getByLabel('来源备注（仅内部可见）')).toHaveValue('虚构内部来源备注。')
    await page.getByLabel('支撑什么判断').fill('')
    await page.getByLabel('讲法要点').fill('')
    await page.getByLabel('来源备注（仅内部可见）').fill('')
    await page.getByRole('button', { name: '保存修改' }).click()
    await expect(page).toHaveURL(`/materials/${id}`)
    await expect(page.getByRole('heading', { name: '支撑什么判断' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: '讲法要点' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: '来源备注（仅内部可见）' })).toHaveCount(0)
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
