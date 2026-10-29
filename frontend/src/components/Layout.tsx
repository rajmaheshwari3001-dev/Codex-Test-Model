import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#F5F0E6] text-[#25312D]">
      {/* Dark Forest Green Navigation Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar onOpenMobile={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>

        {/* Clean System Footer */}
        <footer className="border-t border-[#E8DFCE] bg-[#FAF7F2] px-6 py-3.5 text-xs text-[#53645F]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-semibold text-[#25312D]">
              Aaroh-Saarthi • Public Transit Route Assistant & Intelligent Fleet Coordination
            </span>
            <span className="text-[11px] text-[#53645F]">
              Dataset V1 (Bus Network) • Real-world GPS stops • Synthetic demonstration fares
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
