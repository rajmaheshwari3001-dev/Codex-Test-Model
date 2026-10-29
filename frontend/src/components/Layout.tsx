import { Outlet } from 'react-router-dom'
import Navigation from './Navigation'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      <Navigation />
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-5 sm:py-6">
        <Outlet />
      </main>
      <footer className="text-center text-xs text-gray-500 py-3.5 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
          <span>Aaroh-Saarthi (DEV-P05) — Intelligent Public Transit Route Assistant</span>
          <span className="text-[11px] text-gray-400">
            Delhi Transit Sample Data • All vehicle & disruption states simulated
          </span>
        </div>
      </footer>
    </div>
  )
}
