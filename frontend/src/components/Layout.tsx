import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AppHeader from './layout/AppHeader'
import Sidebar from './Sidebar'

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF7F2] text-[#1A202C] relative">
      {/* Top Application Header matching Figma */}
      <AppHeader onOpenMobileMenu={() => setMobileOpen(true)} />

      {/* Slide-over Mobile/Navigation Drawer */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Content Viewport */}
      <main className="flex-1 px-3 sm:px-6 lg:px-8 py-5 max-w-[1760px] mx-auto w-full relative z-10">
        <Outlet />
      </main>

      {/* Clean Editorial Footer Matching Figma */}
      <footer className="border-t border-[#EBE5DC] bg-[#FAF7F2] px-4 sm:px-6 lg:px-8 py-4 text-center text-[11px] font-bold tracking-widest text-[#7A7269] uppercase relative z-10">
        AAROH-SAARTHI • DESIGNED FOR THE CITIZENS OF DELHI NCR
      </footer>
    </div>
  )
}
