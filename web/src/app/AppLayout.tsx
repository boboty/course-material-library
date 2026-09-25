import type { ReactNode } from 'react'
import { NavLink } from 'react-router'

const links = [
  { to: '/materials', label: '素材' },
  { to: '/materials/drafts', label: '草稿待补全' },
  { to: '/sessions', label: '场次' },
  { to: '/customers', label: '客户' },
  { to: '/courses', label: '课程' },
  { to: '/vocabularies', label: '词表' },
]

export function AppLayout({ children }: { children: ReactNode }) {
  return <>
    <header className="app-nav"><nav aria-label="主导航">
      <span className="app-nav__brand">课程素材库</span>
      {links.map(link => <NavLink key={link.to} to={link.to} end={link.to === '/materials'} className={({ isActive }) => isActive ? 'app-nav__link app-nav__link--active' : 'app-nav__link'}>{link.label}</NavLink>)}
    </nav></header>
    {children}
  </>
}
