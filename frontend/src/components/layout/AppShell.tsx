import React from 'react'

interface Props {
  leftColumn: React.ReactNode
  centerColumn: React.ReactNode
  rightColumn: React.ReactNode
  bottomSection?: React.ReactNode
}

export default function AppShell({
  leftColumn,
  centerColumn,
  rightColumn,
  bottomSection,
}: Props) {
  return (
    <div className="w-full space-y-5">
      {/* 3-Column Main Stage (26% / 44% / 30% Proportions on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (~26%): Journey Planner & Assistant */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4 min-w-0">
          {leftColumn}
        </div>

        {/* Center Column (~44%): Centerpiece Delhi Transit Map */}
        <div className="lg:col-span-8 xl:col-span-5 space-y-4 min-w-0">
          {centerColumn}
        </div>

        {/* Right Column (~30%): Journey Comparison Cards & PoochhO feeder */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-4 min-w-0">
          {rightColumn}
        </div>
      </div>

      {/* Bottom Horizontal Section: Saved Journeys Bar */}
      {bottomSection && (
        <div className="w-full pt-1">
          {bottomSection}
        </div>
      )}
    </div>
  )
}
