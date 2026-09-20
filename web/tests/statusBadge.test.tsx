import { effectBadge, materialStatusBadge, usageStatusBadge } from '../src/ui/statusBadge'

test('素材状态使用全站唯一映射', () => {
  expect(materialStatusBadge('草稿')).toEqual({ tone: 'neutral' })
  expect(materialStatusBadge('可用')).toEqual({ tone: 'brand' })
  expect(materialStatusBadge('主力')).toEqual({ tone: 'success', solid: true })
  expect(materialStatusBadge('待更新')).toEqual({ tone: 'warning' })
  expect(materialStatusBadge('退役')).toEqual({ tone: 'risk' })
})

test('使用状态与使用效果使用全站唯一映射', () => {
  expect(usageStatusBadge('计划')).toEqual({ tone: 'info' })
  expect(usageStatusBadge('已用')).toEqual({ tone: 'success' })
  expect(usageStatusBadge('未用')).toEqual({ tone: 'neutral' })
  expect(effectBadge('未评')).toEqual({ tone: 'neutral' })
  expect(effectBadge('好')).toEqual({ tone: 'success' })
  expect(effectBadge('差')).toEqual({ tone: 'risk' })
})

test('未知取值回退到 neutral，不抛错', () => {
  expect(materialStatusBadge('未知')).toEqual({ tone: 'neutral' })
  expect(usageStatusBadge('未知')).toEqual({ tone: 'neutral' })
  expect(effectBadge('未知')).toEqual({ tone: 'neutral' })
})
