import { NavLink, useLocation } from 'react-router-dom'

interface SidebarProps {
  mobileOpen: boolean
  onCloseMobile: () => void
}

export default function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const currentTab = searchParams.get('tab')

  const navGroups = [
    {
      title: 'Passenger Transit',
      items: [
        {
          name: 'Journey Planner',
          icon: '🧭',
          to: '/',
          active: location.pathname === '/' && (!currentTab || currentTab === 'planner'),
        },
        {
          name: 'Live Map',
          icon: '🗺️',
          to: '/map',
          active: location.pathname === '/map' || (location.pathname === '/' && currentTab === 'map'),
        },
        {
          name: 'Saved Journeys',
          icon: '🔖',
          to: '/saved',
          active: location.pathname === '/saved' || (location.pathname === '/' && currentTab === 'saved'),
        },
        {
          name: 'Chat Assistant',
          icon: '💬',
          to: '/chat',
          active: location.pathname === '/chat' || (location.pathname === '/' && currentTab === 'chat'),
        },
      ],
    },
    {
      title: 'Fleet Operations',
      items: [
        {
          name: 'Fleet Dashboard',
          icon: '🚍',
          to: '/fleet',
          active: location.pathname === '/fleet' && (!currentTab || currentTab === 'roster'),
        },
        {
          name: 'Disruptions',
          icon: '⚠️',
          to: '/fleet?tab=disruptions',
          active: location.pathname === '/fleet' && currentTab === 'disruptions',
        },
        {
          name: 'Scenario Analysis',
          icon: '📊',
          to: '/fleet?tab=scenarios',
          active: location.pathname === '/fleet' && currentTab === 'scenarios',
        },
      ],
    },
    {
      title: 'Data & System',
      items: [
        {
          name: 'System Reports',
          icon: '📋',
          to: '/reports',
          active: location.pathname === '/reports',
        },
      ],
    },
  ]

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close menu backdrop"
          onClick={onCloseMobile}
          onKeyDown={e => e.key === 'Escape' && onCloseMobile()}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-[#102721] bg-[#173B32] text-[#F5F0E6] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="flex items-center justify-between border-b border-[#235246] px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#235246] text-[#F5F0E6] font-mono text-base font-extrabold border border-[#B88A43]/40 shadow-xs">
                AS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black tracking-tight text-[#FFFFFF]">
                    Aaroh<span className="text-[#B88A43]">—</span>Saarthi
                  </span>
                </div>
                <p className="text-[11px] font-medium text-[#E8DFCE]/75">
                  Delhi Transit & Fleet Engine
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="rounded-lg p-1.5 text-[#E8DFCE] hover:bg-[#235246] lg:hidden"
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5 text-xs">
            {navGroups.map(group => (
              <div key={group.title} className="space-y-1">
                <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#E8DFCE]/60">
                  {group.title}
                </div>
                <div className="space-y-0.5 pt-1">
                  {group.items.map(item => (
                    <NavLink
                      key={item.name}
                      to={item.to}
                      onClick={() => onCloseMobile()}
                      className={`group flex items-center justify-between rounded-lg px-3 py-2.5 font-medium transition-all ${
                        item.active
                          ? 'border-l-3 border-[#B88A43] bg-[#F5F0E6]/12 font-bold text-[#FFFFFF]'
                          : 'text-[#E8DFCE]/80 hover:bg-[#F5F0E6]/8 hover:text-[#FFFFFF]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm opacity-90">{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                      {item.active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#B88A43]" />
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom System Environment Footer */}
        <div className="border-t border-[#235246] p-4 text-[11px] text-[#E8DFCE]/75 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#FFFFFF]">Dataset V1</span>
            <span className="rounded bg-[#235246] px-1.5 py-0.5 font-mono text-[10px] text-[#B88A43]">
              Bus Network
            </span>
          </div>
          <p className="leading-relaxed text-[#E8DFCE]/70 text-[10px]">
            20 real-world Delhi stops across 4 routes. Tariffs are demonstration values.
          </p>
        </div>
      </aside>
    </>
  )
}
