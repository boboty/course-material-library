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
  return page.url().split('/materials/')[1]
}

async function createSession(page: Page, customer: string, groupName = '') {
  await page.goto('/customers/new')
  await page.getByLabel('标准名称').fill(customer)
  if (groupName) await page.getByLabel('所属集团').fill(groupName)
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
  return { id: page.url().split('/sessions/')[1], course, customer, audience }
}

async function recordActualUsage(page: Page, sessionId: string, materialId: string, status: '已用' | '未用') {
  const planned = await page.request.post(`/api/v1/sessions/${sessionId}/usages`, { data: { material_id: materialId } })
  expect(planned.status()).toBe(201)
  const usage = await planned.json() as { id: string }
  const saved = await page.request.put(`/api/v1/sessions/${sessionId}/post-class`, {
    data: { usages: [{ id: usage.id, status, effect: '未评' }] },
  })
  expect(saved.status()).toBe(200)
}

async function associateWithCourse(page: Page, materialId: string, courseName: string) {
  await page.goto(`/materials/${materialId}/edit`)
  const course = page.getByLabel(courseName, { exact: true })
  await course.check()
  await expect(course).toBeChecked()
  const saved = page.waitForResponse(response =>
    response.url().endsWith(`/api/v1/materials/${materialId}`)
    && response.request().method() === 'PUT'
    && response.status() === 200)
  await page.getByRole('button', { name: '保存修改' }).click()
  const response = await saved
  expect((await response.json()).courses.map((item: { name: string }) => item.name)).toContain(courseName)
  await expect(page).toHaveURL(new RegExp(`/materials/${materialId}$`))
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
  const { id: sessionId } = await createSession(page, customer)

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
  const { id: sessionId } = await createSession(page, customer)

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

for (const viewport of [{ name: 'desktop', width: 1280, height: 900 }, { name: 'mobile', width: 375, height: 812 }]) {
  test(`course-linked materials stay first while all materials remain searchable and selectable (${viewport.name})`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    const prefix = unique('课程优先素材')
    const relatedA = `${prefix} 关联甲`
    const unrelated = `${prefix} 未关联`
    const relatedB = `${prefix} 关联乙`
    const relatedAId = await createMaterial(page, relatedA)
    await createMaterial(page, unrelated)
    const relatedBId = await createMaterial(page, relatedB)
    const { id: sessionId, course } = await createSession(page, unique('虚构客户'))
    await associateWithCourse(page, relatedAId, course)
    await associateWithCourse(page, relatedBId, course)

    await page.goto(`/sessions/${sessionId}/materials`)
    const searchResults = page.locator('.detail-body').filter({ has: page.getByRole('heading', { name: '搜索全库素材' }) }).locator('ul.planned-list')
    const rows = searchResults.getByRole('listitem')
    await expect(rows.filter({ hasText: relatedA })).toHaveCount(1)
    await expect(rows.filter({ hasText: unrelated })).toHaveCount(1)
    await expect(rows.filter({ hasText: relatedB })).toHaveCount(1)
    await expect.poll(async () => {
      const titles = await rows.allTextContents()
      return titles.findIndex(text => text.includes(relatedA)) < titles.findIndex(text => text.includes(unrelated))
        && titles.findIndex(text => text.includes(relatedB)) < titles.findIndex(text => text.includes(unrelated))
    }).toBe(true)
    const defaultTitles = await rows.allTextContents()
    expect(defaultTitles.findIndex(text => text.includes(relatedA))).toBeLessThan(defaultTitles.findIndex(text => text.includes(unrelated)))
    expect(defaultTitles.findIndex(text => text.includes(relatedB))).toBeLessThan(defaultTitles.findIndex(text => text.includes(unrelated)))
    expect([relatedA, relatedB, unrelated].sort((left, right) => defaultTitles.findIndex(text => text.includes(left)) - defaultTitles.findIndex(text => text.includes(right)))
      .join('|')).toBe([relatedB, relatedA, unrelated].join('|'))

    // 搜索匹配全库中的关联与未关联素材，并继续按课程关联优先排序。
    await page.getByLabel('搜索素材标题').fill(prefix)
    await page.getByRole('button', { name: '搜索' }).click()
    await expect(rows.filter({ hasText: relatedA })).toHaveCount(1)
    await expect(rows.filter({ hasText: unrelated })).toHaveCount(1)
    await expect(rows.filter({ hasText: relatedB })).toHaveCount(1)
    await expect.poll(async () => {
      const titles = await rows.allTextContents()
      return titles.findIndex(text => text.includes(relatedA)) < titles.findIndex(text => text.includes(unrelated))
        && titles.findIndex(text => text.includes(relatedB)) < titles.findIndex(text => text.includes(unrelated))
    }).toBe(true)
    const searchedTitles = await rows.allTextContents()
    expect(searchedTitles.findIndex(text => text.includes(relatedA))).toBeLessThan(searchedTitles.findIndex(text => text.includes(unrelated)))
    expect(searchedTitles.findIndex(text => text.includes(relatedB))).toBeLessThan(searchedTitles.findIndex(text => text.includes(unrelated)))
    expect([relatedA, relatedB, unrelated].sort((left, right) => searchedTitles.findIndex(text => text.includes(left)) - searchedTitles.findIndex(text => text.includes(right)))
      .join('|')).toBe([relatedB, relatedA, unrelated].join('|'))

    const unrelatedRow = rows.filter({ hasText: unrelated })
    await unrelatedRow.getByRole('button', { name: '加入计划' }).click()
    await expect(unrelatedRow.getByText('已加入本场计划')).toBeVisible()
    await page.locator('.detail-body').filter({ has: page.getByRole('heading', { name: /^本场计划/ }) })
      .getByRole('link', { name: unrelated }).waitFor()
    await page.getByRole('button', { name: '撤销计划' }).click()
    await expect(page.locator('.detail-body').filter({ has: page.getByRole('heading', { name: /^本场计划/ }) })
      .getByRole('link', { name: unrelated })).toHaveCount(0)
    await expect(page.getByText('未用', { exact: true })).toHaveCount(0)

    // 无关联素材课程时，结果仍正常展示，既有组内顺序不受优先逻辑影响。
    const noAssociationSession = await createSession(page, unique('虚构客户'))
    await page.goto(`/sessions/${noAssociationSession.id}/materials`)
    await page.getByLabel('搜索素材标题').fill(prefix)
    await page.getByRole('button', { name: '搜索' }).click()
    await expect(page.getByRole('listitem').filter({ hasText: relatedA })).toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: unrelated })).toBeVisible()
  })

  test(`group reuse warning shows latest actual use and does not block planning (${viewport.name})`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    const materialTitle = unique('集团重复提醒素材')
    const materialId = await createMaterial(page, materialTitle)
    const group = unique('虚构集团')
    const current = await createSession(page, unique('虚构客户'), group)
    const peer = await createSession(page, unique('虚构客户'), group)
    await recordActualUsage(page, peer.id, materialId, '已用')

    await page.goto(`/sessions/${current.id}/materials`)
    await page.getByLabel('搜索素材标题').fill(materialTitle)
    await page.getByRole('button', { name: '搜索' }).click()
    const resultList = page.locator('.detail-body')
      .filter({ has: page.getByRole('heading', { name: '搜索全库素材' }) })
      .getByRole('list')
    const row = resultList.getByRole('listitem').filter({ hasText: materialTitle })
    await expect(row.getByText('同集团其他客户已用过')).toBeVisible()
    await expect(row.getByText(new RegExp(`最近一次：2026-07-01 · ${peer.course} · ${peer.audience} · ${peer.customer}`))).toBeVisible()
    const addButton = row.getByRole('button', { name: '加入计划' })
    await expect(addButton).toBeEnabled()
    await addButton.click()
    await expect(row.getByText('已加入本场计划')).toBeVisible()
  })
}

test('older course-linked material remains prioritized beyond the first 20 newest materials', async ({ page }) => {
  const prefix = unique('较旧课程关联素材')
  const olderRelated = `${prefix} 关联项`
  const olderRelatedId = await createMaterial(page, olderRelated)
  const { id: sessionId, course } = await createSession(page, unique('虚构客户'))
  await associateWithCourse(page, olderRelatedId, course)

  const newerUnrelated = Array.from({ length: 21 }, (_, index) => `${prefix} 新素材 ${String(index + 1).padStart(2, '0')}`)
  for (const title of newerUnrelated) {
    const response = await page.request.post('/api/v1/materials', {
      data: { title, type: '故事', body: '虚构素材正文。' },
    })
    expect(response.ok()).toBeTruthy()
  }

  await page.goto(`/sessions/${sessionId}/materials`)
  const resultList = page.locator('.detail-body').filter({ has: page.getByRole('heading', { name: '搜索全库素材' }) }).locator('ul.planned-list')
  const matchingRows = resultList.getByRole('listitem').filter({ hasText: prefix })
  await expect(matchingRows).toHaveCount(22)
  let matchingTitles = await matchingRows.allTextContents()
  expect(matchingTitles[0]).toContain(olderRelated)

  // The keyword result spans multiple pages too; preserve the API's newest-first order within the non-related group.
  await page.getByLabel('搜索素材标题').fill(prefix)
  await page.getByRole('button', { name: '搜索' }).click()
  await expect(matchingRows).toHaveCount(22)
  matchingTitles = await matchingRows.allTextContents()
  expect(matchingTitles[0]).toContain(olderRelated)
  expect(matchingTitles.slice(1).map(text => newerUnrelated.find(title => text.includes(title))))
    .toEqual([...newerUnrelated].reverse())

  const selectableRow = resultList.getByRole('listitem').filter({ hasText: newerUnrelated[0] })
  await selectableRow.getByRole('button', { name: '加入计划' }).click()
  await expect(selectableRow.getByText('已加入本场计划')).toBeVisible()
})
