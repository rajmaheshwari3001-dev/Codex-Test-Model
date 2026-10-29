import { Outlet } from 'react-router-dom'
import Navigation from './Navigation'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-page)] font-sans text-[var(--color-text)] antialiased">
      <Navigation />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <Outlet />
      </main>
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-subtle)] py-4 text-center text-xs text-[var(--color-text-secondary)]">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-1 px-4 sm:flex-row sm:px-6 lg:px-8">
          <span className="font-semibold text-[var(--color-text)]">Aaroh-Saarthi / Delhi transit assistant</span>
          <span className="text-[11px] text-[var(--color-text-secondary)]">
            Delhi transit sample data • Fleet and disruption states are simulated
          </span>
        </div>
      </footer>
    </div>
  )
}
