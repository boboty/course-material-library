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
    await page.getByLabel('搜索标题或正文').fill(`${marker} missing`)
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
    await page.getByRole('checkbox', { name: firstName }).uncheck()
    await page.getByRole('checkbox', { name: secondName }).uncheck()
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
