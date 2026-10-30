import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AppHeader from './layout/AppHeader'
import Sidebar from './Sidebar'

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F0E6] text-[#29343A]">
      {/* Top Application Header matching Reference */}
      <AppHeader onOpenMobileMenu={() => setMobileOpen(true)} />

      {/* Slide-over Mobile/Navigation Drawer */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Content Viewport */}
      <main className="flex-1 px-3 sm:px-6 lg:px-8 py-4 sm:py-5 max-w-[1720px] mx-auto w-full">
        <Outlet />
      </main>

      {/* Clean Editorial Footer */}
      <footer className="border-t border-[#DAD3C6] bg-[#FBF8F1] px-4 sm:px-6 lg:px-8 py-3 text-xs text-[#73766F]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1720px] mx-auto">
          <span className="font-semibold text-[#172D3B]">
            Aaroh-Saarthi • Delhi Multimodal Transit Assistant & Intelligent Fleet Coordination
          </span>
          <span className="text-[11px] text-[#73766F]">
            Delhi Transport Stack GTFS • DMRC Metro Tariff • DTC Bus Stages • PoochhO Feeder
          </span>
        </div>
      </footer>
    </div>
  )
}
