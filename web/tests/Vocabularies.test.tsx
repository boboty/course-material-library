import { afterEach, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { VocabularyMaintenance } from '../src/pages/Vocabularies'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

type FakeResponse = { ok: true; json: () => Promise<unknown> }

function json(body: unknown): FakeResponse {
  return { ok: true, json: async () => body }
}

test('a slower initial load cannot clobber a newly created vocabulary item', async () => {
  let releaseInitialIndustries = () => {}
  const initialIndustriesGate = new Promise<void>(resolve => { releaseInitialIndustries = resolve })
  let industryGets = 0

  vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input, 'http://localhost')
    if (url.pathname === '/api/v1/audience-types') {
      return json({ items: [], page: 1, page_size: 100, total: 0 })
    }
    if (url.pathname === '/api/v1/industries' && init?.method === 'POST') {
      return json({ id: 'new', name: '虚构新行业' })
    }
    if (url.pathname === '/api/v1/industries') {
      industryGets += 1
      if (industryGets === 1) {
        // 首次加载很慢，且返回的是新增之前的结果
        await initialIndustriesGate
        return json({ items: [{ id: 'stale', name: '虚构旧行业' }], page: 1, page_size: 100, total: 1 })
      }
      return json({ items: [{ id: 'new', name: '虚构新行业' }], page: 1, page_size: 100, total: 1 })
    }
    throw new Error(`unexpected request: ${input}`)
  }))

  render(<MemoryRouter><VocabularyMaintenance /></MemoryRouter>)
  fireEvent.change(screen.getByLabelText('行业名称'), { target: { value: '虚构新行业' } })
  fireEvent.click(screen.getByRole('button', { name: '新增行业' }))

  // 新增项立即出现
  expect(await screen.findByText('虚构新行业')).toBeTruthy()

  // 释放最初的在途加载：它返回的是不含新增项的旧结果，必须与新增项合并而不是覆盖
  releaseInitialIndustries()
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)) })
  expect(screen.getAllByText('虚构新行业')).toHaveLength(1)
  expect(screen.getByText('虚构旧行业')).toBeTruthy()
})
