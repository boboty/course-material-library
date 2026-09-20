/**
 * 素材状态 / 使用效果 / 使用状态的 Badge tone 唯一映射。
 * 所有页面必须复用这里的映射，只使用 Design System Badge 已有的 tone，不新增颜色体系。
 */
export type BadgeTone = 'brand' | 'neutral' | 'success' | 'warning' | 'risk' | 'info'
export type BadgeSpec = { tone: BadgeTone; solid?: boolean }

const materialStatusBadges: Record<string, BadgeSpec> = {
  草稿: { tone: 'neutral' },
  可用: { tone: 'brand' },
  主力: { tone: 'success', solid: true },
  待更新: { tone: 'warning' },
  退役: { tone: 'risk' },
}

const usageStatusBadges: Record<string, BadgeSpec> = {
  计划: { tone: 'info' },
  已用: { tone: 'success' },
  未用: { tone: 'neutral' },
}

const effectBadges: Record<string, BadgeSpec> = {
  未评: { tone: 'neutral' },
  好: { tone: 'success' },
  差: { tone: 'risk' },
}

export function materialStatusBadge(status: string): BadgeSpec {
  return materialStatusBadges[status] ?? { tone: 'neutral' }
}

export function usageStatusBadge(status: string): BadgeSpec {
  return usageStatusBadges[status] ?? { tone: 'neutral' }
}

export function effectBadge(effect: string): BadgeSpec {
  return effectBadges[effect] ?? { tone: 'neutral' }
}
