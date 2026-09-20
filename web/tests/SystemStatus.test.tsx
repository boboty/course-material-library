import { afterEach, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { SystemStatus } from '../src/pages/SystemStatus'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

test('renders system status', () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
  render(<SystemStatus />)
  expect(screen.getByRole('heading', { name: 'System Status' })).toBeTruthy()
  expect(screen.getByText('Checking backend…')).toBeTruthy()
})

test('shows backend ready when API succeeds', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) }))
  render(<SystemStatus />)
  expect(await screen.findByText('Backend ready · ok')).toBeTruthy()
})

test('shows backend failure when API fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
  render(<SystemStatus />)
  expect(await screen.findByText('Backend unavailable')).toBeTruthy()
})
