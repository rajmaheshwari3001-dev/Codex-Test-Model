import { Outlet } from 'react-router-dom'
import Navigation from './Navigation'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f2f0e8] font-sans text-[#1c2925] antialiased">
      <Navigation />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <Outlet />
      </main>
      <footer className="border-t border-[#d6d2c7] bg-[#eae7dd] py-4 text-center text-xs text-[#66726a]">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-1 px-4 sm:flex-row sm:px-6 lg:px-8">
          <span className="font-semibold text-[#3d4d45]">Aaroh-Saarthi / Delhi transit field guide</span>
          <span className="text-[11px] text-[#7d867b]">
            Delhi transit sample data • Fleet and disruption states are simulated
          </span>
        </div>
      </footer>
    </div>
  )
}
