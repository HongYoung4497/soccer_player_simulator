import { NavLink, Outlet } from 'react-router-dom'
import { GuestSaveChip } from './GuestSaveChip'

const TABS = [
  { to: '/app/season', label: '시즌' },
  { to: '/app/career', label: '커리어' },
  { to: '/app/player', label: '선수' },
  { to: '/app/history', label: '연혁' },
] as const

export function TabShell() {
  return (
    <div className="app-shell">
      <div className="app-shell__body">
        <Outlet />
      </div>
      <GuestSaveChip />
      <nav className="tab-bar" aria-label="메인 탭">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              isActive ? 'tab-bar__item is-active' : 'tab-bar__item'
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
