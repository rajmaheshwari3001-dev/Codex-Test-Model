import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AppHeader from './layout/AppHeader'
import Sidebar from './Sidebar'

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-[#F4EBDD] text-[#29343A] relative">
      {/* Responsive Delhi Transit Background Layer (Mobile vs PC) */}
      <div className="app-transit-backdrop" aria-hidden="true" />

      {/* Top Application Header matching Reference */}
      <AppHeader onOpenMobileMenu={() => setMobileOpen(true)} />

      {/* Slide-over Mobile/Navigation Drawer */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Content Viewport */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-[1720px] mx-auto w-full relative z-10">
        <Outlet />
      </main>

      {/* Clean Editorial Footer */}
      <footer className="border-t border-[#D8C8AA] bg-[#FFFCF5]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 text-xs text-[#77766D] relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1720px] mx-auto">
          <span className="font-semibold text-[#243B4A]">
            Aaroh-Saarthi • Delhi Multimodal Transit Assistant & Intelligent Fleet Coordination
          </span>
          <span className="text-[11px] text-[#77766D]">
            Delhi Transport Stack GTFS • DMRC Metro Tariff • DTC Bus Stages • Poochh-O Feeder
          </span>
        </div>
      </footer>
    </div>
  )
}
