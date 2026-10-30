import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AppHeader from './layout/AppHeader'
import Sidebar from './Sidebar'

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF7F2]/90 text-[#1A202C] relative">
      {/* Responsive Delhi Transit Ambient Background Layer */}
      <div className="app-transit-backdrop" aria-hidden="true" />

      {/* Top Application Header matching Figma */}
      <AppHeader onOpenMobileMenu={() => setMobileOpen(true)} />

      {/* Slide-over Mobile/Navigation Drawer */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Content Viewport */}
      <main className="flex-1 px-3 sm:px-6 lg:px-8 py-5 max-w-[1760px] mx-auto w-full relative">
        <Outlet />
      </main>

      {/* Clean Minimal Editorial Footnote (Zero awkward overflow) */}
      <footer className="py-2 text-center text-[10px] font-bold tracking-widest text-[#A1988B] uppercase select-none relative z-10">
        AAROH-SAARTHI • DESIGNED FOR THE CITIZENS OF DELHI NCR
      </footer>
    </div>
  )
}
