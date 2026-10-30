import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AppHeader from './layout/AppHeader'
import Sidebar from './Sidebar'

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      {/* Top Application Header matching Reference */}
      <AppHeader onOpenMobileMenu={() => setMobileOpen(true)} />

      {/* Slide-over Mobile/Navigation Drawer */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Content Viewport */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1720px] mx-auto w-full">
        <Outlet />
      </main>

      {/* Clean Editorial Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-3.5 text-xs text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1720px] mx-auto">
          <span className="font-semibold text-slate-800">
            Aaroh-Saarthi • Delhi Multimodal Transit Assistant & Intelligent Fleet Coordination
          </span>
          <span className="text-[11px] text-slate-400">
            Delhi Transport Stack GTFS • DMRC Metro Tariff • DTC Bus Stages • Poochh-O Feeder
          </span>
        </div>
      </footer>
    </div>
  )
}
