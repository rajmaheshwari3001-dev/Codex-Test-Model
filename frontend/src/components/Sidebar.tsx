import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  CompassIcon,
  MapIcon,
  BookmarkIcon,
  MessageSquareIcon,
  BusIcon,
  AlertTriangleIcon,
  BarChartIcon,
  FileTextIcon,
  XIcon,
} from './common/Icons'

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
          Icon: CompassIcon,
          to: '/',
          active: location.pathname === '/' && (!currentTab || currentTab === 'planner'),
        },
        {
          name: 'Live Map',
          Icon: MapIcon,
          to: '/map',
          active: location.pathname === '/map' || (location.pathname === '/' && currentTab === 'map'),
        },
        {
          name: 'Saved Journeys',
          Icon: BookmarkIcon,
          to: '/saved',
          active: location.pathname === '/saved' || (location.pathname === '/' && currentTab === 'saved'),
        },
        {
          name: 'Chat Assistant',
          Icon: MessageSquareIcon,
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
          Icon: BusIcon,
          to: '/fleet',
          active: location.pathname === '/fleet' && (!currentTab || currentTab === 'roster'),
        },
        {
          name: 'Disruptions',
          Icon: AlertTriangleIcon,
          to: '/fleet?tab=disruptions',
          active: location.pathname === '/fleet' && currentTab === 'disruptions',
        },
        {
          name: 'Scenario Analysis',
          Icon: BarChartIcon,
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
          Icon: FileTextIcon,
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
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Slide-over Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-slate-800 bg-slate-900 text-slate-100 transition-transform duration-200 ease-in-out shadow-2xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-mono text-base font-extrabold shadow-md">
                AS
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold tracking-tight text-white">
                    AAROH<span className="text-blue-400">—</span>SAARTHI
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-400">
                  Delhi Transit & Fleet Engine
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5 text-xs">
            {navGroups.map(group => (
              <div key={group.title} className="space-y-1">
                <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {group.title}
                </div>
                <div className="space-y-1 pt-1">
                  {group.items.map(item => {
                    const IconComponent = item.Icon
                    return (
                      <NavLink
                        key={item.name}
                        to={item.to}
                        onClick={() => onCloseMobile()}
                        className={`group flex items-center justify-between rounded-xl px-3 py-2.5 font-medium transition-all cursor-pointer ${
                          item.active
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className={`w-4 h-4 ${item.active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                          <span>{item.name}</span>
                        </div>
                        {item.active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom System Environment Footer */}
        <div className="border-t border-slate-800 p-4 text-[11px] text-slate-400 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Delhi GTFS</span>
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 font-mono text-[10px] text-blue-400 border border-slate-700">
              20 Stations
            </span>
          </div>
          <p className="leading-relaxed text-slate-400 text-[10px]">
            Delhi Transport Stack GTFS, DMRC Metro slabs, DTC bus tariffs & PoochhO feeder integration.
          </p>
        </div>
      </aside>
    </>
  )
}
