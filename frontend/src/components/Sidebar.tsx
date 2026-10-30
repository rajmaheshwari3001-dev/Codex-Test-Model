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
      {/* Backdrop */}
      {mobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close menu backdrop"
          onClick={onCloseMobile}
          onKeyDown={e => e.key === 'Escape' && onCloseMobile()}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Slide-over Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-[#0F1E28] bg-[#172D3B] text-[#F5F0E6] transition-transform duration-200 ease-in-out shadow-2xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="flex items-center justify-between border-b border-[#254152] px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#254152] text-[#F5F0E6] font-mono text-base font-extrabold border border-[#C49A43]/40 shadow-xs">
                AS
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif text-base font-bold tracking-tight text-[#FFFFFF]">
                    AAROH<span className="text-[#C49A43]">—</span>SAARTHI
                  </span>
                </div>
                <p className="text-[11px] font-medium text-[#EDE7DB]/75">
                  Delhi Transit & Fleet Engine
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="rounded-lg p-1.5 text-[#EDE7DB] hover:bg-[#254152]"
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5 text-xs">
            {navGroups.map(group => (
              <div key={group.title} className="space-y-1">
                <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#EDE7DB]/60">
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
                          ? 'border-l-3 border-[#C49A43] bg-[#FFFFFF]/10 font-bold text-[#FFFFFF]'
                          : 'text-[#EDE7DB]/80 hover:bg-[#FFFFFF]/5 hover:text-[#FFFFFF]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm opacity-90">{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                      {item.active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#C49A43]" />
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom System Environment Footer */}
        <div className="border-t border-[#254152] p-4 text-[11px] text-[#EDE7DB]/75 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#FFFFFF]">Delhi GTFS</span>
            <span className="rounded bg-[#254152] px-1.5 py-0.5 font-mono text-[10px] text-[#C49A43]">
              20 Stations
            </span>
          </div>
          <p className="leading-relaxed text-[#EDE7DB]/70 text-[10px]">
            Delhi Transport Stack GTFS, DMRC Metro slabs, DTC bus tariffs & PoochhO feeder integration.
          </p>
        </div>
      </aside>
    </>
  )
}
