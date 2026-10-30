import { useState } from 'react'
import type { JourneyOption, Stop } from '../../types'
import {
  SearchIcon,
  XIcon,
  TrainIcon,
  BusIcon,
  ZapIcon,
  CheckIcon,
  ChevronDownIcon,
  NavigationIcon,
  LayersIcon,
  PlaneIcon,
  HospitalIcon,
} from '../common/Icons'

interface Props {
  stops?: Stop[]
  selectedJourney?: JourneyOption | null
  originStopId?: string
  destinationStopId?: string
  onSelectOrigin?: (stopId: string) => void
  onSelectDestination?: (stopId: string) => void
  onSwitchToLive?: () => void
}

export default function StaticDelhiMap({
  originStopId = 'S13',
  destinationStopId = 'S19',
  onSelectOrigin,
  onSelectDestination,
  onSwitchToLive,
}: Props) {
  const [activeFilter, setActiveFilter] = useState<'both' | 'metro' | 'bus' | 'ev'>('both')
  const [searchQuery, setSearchQuery] = useState('')
  const [mapStyle, setMapStyle] = useState<'sandstone' | 'satellite'>('sandstone')
  const [selectedStation, setSelectedStation] = useState<string | null>(null)

  const isOriginDwarka = originStopId === 'S13'
  const isDestNoida = destinationStopId === 'S19'

  const handleStationClick = (stationId: string, stationName: string) => {
    setSelectedStation(stationName)
    if (onSelectDestination && stationId !== originStopId) {
      onSelectDestination(stationId)
    }
  }

  return (
    <figure
      role="region"
      aria-label="Target Delhi Multimodal Transit Map"
      className="relative flex flex-col h-full min-h-[560px] lg:min-h-[660px] rounded-3xl border border-[#EDE8E1] bg-[#F4F1EA] shadow-xs overflow-hidden select-none animate-fade-in"
    >
      <figcaption className="sr-only">
        Target Delhi Transit multimodal route map showing Blue Line Metro and City Bus 764
      </figcaption>

      {/* Floating Top HUD Bar (Search + Mode Filter Chips + Quick Station Pills matching Target Mockup) */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-30 flex flex-col gap-2 pointer-events-none">
        {/* Row 1: Search Bar & Mode Filter Chips */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-xs sm:max-w-sm pointer-events-auto">
            <div className="flex items-center rounded-2xl border border-[#EDE8E1] bg-white/95 px-3.5 py-2 shadow-md backdrop-blur-md transition-colors focus-within:border-[#C49A43] focus-within:ring-2 focus-within:ring-[#C49A43]/20">
              <SearchIcon className="w-4 h-4 text-[#7A7269] mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search station or landmark..."
                aria-label="Search station or landmark"
                className="w-full bg-transparent text-xs sm:text-[13px] font-semibold text-[#1A202C] placeholder-[#7A7269] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#7A7269] hover:text-[#1A202C] p-0.5 cursor-pointer text-xs"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Mode Filter Chips matching Target (Metro pink, Bus blue, Both green, EV purple) */}
          <div className="flex items-center gap-1.5 pointer-events-auto flex-wrap">
            <button
              type="button"
              onClick={() => setActiveFilter('metro')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                activeFilter === 'metro'
                  ? 'bg-[#E11D48] text-white border-[#E11D48]'
                  : 'bg-[#FCE7F3] text-[#BE185D] border-[#FBCFE8] hover:bg-[#FBCFE8]'
              }`}
            >
              <TrainIcon className="w-3.5 h-3.5" />
              <span>Metro</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('bus')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                activeFilter === 'bus'
                  ? 'bg-[#0284C7] text-white border-[#0284C7]'
                  : 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD] hover:bg-[#BAE6FD]'
              }`}
            >
              <BusIcon className="w-3.5 h-3.5" />
              <span>Bus</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('both')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                activeFilter === 'both'
                  ? 'bg-[#1E4D2B] text-white border-[#1E4D2B] shadow-sm'
                  : 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]'
              }`}
            >
              <CheckIcon className="w-3.5 h-3.5" />
              <span>Both</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('ev')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                activeFilter === 'ev'
                  ? 'bg-[#7E22CE] text-white border-[#7E22CE]'
                  : 'bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF] hover:bg-[#E9D5FF]'
              }`}
            >
              <ZapIcon className="w-3.5 h-3.5" />
              <span>EV/Shared</span>
            </button>

            <button
              type="button"
              onClick={onSwitchToLive}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-white text-[#1A2E3B] border border-[#EDE8E1] hover:bg-[#FAF7F2] transition-colors cursor-pointer shadow-xs"
              title="Switch to full interactive Leaflet radar"
            >
              <span>Live</span>
              <ChevronDownIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Station Quick Pills Strip matching Target */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 pointer-events-auto">
          {[
            { id: 'S01', name: 'Rajiv Chowk', color: '#EA580C', type: 'dot' },
            { id: 'S04', name: 'New Delhi', color: '#EA580C', type: 'dot' },
            { id: 'S13', name: 'IGI Airport', color: '#0284C7', type: 'plane' },
            { id: 'S02', name: 'Kashmere Gate', color: '#166534', type: 'dot' },
            { id: 'S10', name: 'AIIMS', color: '#0284C7', type: 'hospital' },
            { id: 'S19', name: 'Noida City Centre', color: '#0284C7', type: 'dot' },
          ].map(hub => (
            <button
              key={hub.id}
              type="button"
              onClick={() => handleStationClick(hub.id, hub.name)}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/95 hover:bg-[#FAF7F2] border border-[#EDE8E1] text-xs font-bold text-[#1A2E3B] shadow-2xs transition-all cursor-pointer shrink-0 active:scale-95"
            >
              {hub.type === 'plane' ? (
                <PlaneIcon className="w-3 h-3 text-[#0284C7]" />
              ) : hub.type === 'hospital' ? (
                <HospitalIcon className="w-3 h-3 text-[#0284C7]" />
              ) : (
                <span style={{ color: hub.color }}>•</span>
              )}
              <span>{hub.name}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={onSwitchToLive}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 hover:bg-[#FAF7F2] border border-[#EDE8E1] text-xs font-bold text-[#7A7269] shadow-2xs transition-all cursor-pointer shrink-0"
          >
            + More
          </button>
        </div>
      </div>

      {/* Main Static Map Visual (Matching Mockup with 100% Fidelity, Zero Clutter) */}
      <div className="relative w-full h-full flex-1 overflow-hidden">
        <svg
          viewBox="0 0 1000 700"
          className="w-full h-full transition-transform duration-500"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {/* Defs for gradients and shadow filters */}
          <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={mapStyle === 'satellite' ? '#1E293B' : '#EDF4E8'} />
              <stop offset="50%" stopColor={mapStyle === 'satellite' ? '#0F172A' : '#F6F3EB'} />
              <stop offset="100%" stopColor={mapStyle === 'satellite' ? '#1E293B' : '#E8EFE5'} />
            </linearGradient>

            {/* Yamuna River Gradient */}
            <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#93C5FD" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>

            {/* Metro Blue Line Gradient */}
            <linearGradient id="blueMetroGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>

            {/* Bus 764 Gradient */}
            <linearGradient id="busGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>

            {/* Drop Shadow for Route Casing */}
            <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* 1. Base Map Background Terrain */}
          <rect width="1000" height="700" fill="url(#bgGrad)" />

          {/* Regional District Outlines (Delicate Muted Boundaries) */}
          <path
            d="M 120 80 Q 300 60 500 100 T 880 70 L 920 620 Q 600 650 350 630 Z"
            fill="none"
            stroke="#DCD6C8"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />

          {/* Subtle Road Grids (Ring Roads and Radial Corridors) */}
          <g stroke="#E5DEC9" strokeWidth="2.5" fill="none" opacity="0.8">
            {/* Outer Ring Road */}
            <path d="M 220 280 C 260 160, 680 140, 780 260 C 850 360, 760 550, 620 580 C 420 620, 240 500, 220 380 Z" />
            {/* Inner Ring Road */}
            <path d="M 330 310 C 370 230, 610 220, 680 300 C 730 380, 670 490, 560 510 C 440 530, 340 440, 330 350 Z" />
            {/* Radials */}
            <line x1="150" y1="460" x2="490" y2="350" />
            <line x1="490" y1="350" x2="850" y2="280" />
            <line x1="490" y1="160" x2="490" y2="580" />
            <line x1="490" y1="350" x2="880" y2="500" />
          </g>

          {/* 2. Yamuna River (Majestic Blue Winding Path East of City Center) */}
          <path
            d="M 520 40 Q 510 130 505 190 T 520 300 T 580 430 Q 640 530 680 660"
            fill="none"
            stroke="url(#riverGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            opacity="0.9"
          />
          {/* River Label */}
          <text
            x="600"
            y="520"
            transform="rotate(62 600 520)"
            fill="#3B82F6"
            fontSize="11"
            fontWeight="700"
            letterSpacing="2"
            opacity="0.75"
          >
            YAMUNA RIVER
          </text>

          {/* District & Region Watermarks */}
          <g fill="#94A3B8" fontSize="12" fontWeight="700" letterSpacing="1" opacity="0.6">
            <text x="440" y="110">NORTH DELHI</text>
            <text x="210" y="270">WEST DELHI</text>
            <text x="360" y="325">NEW DELHI</text>
            <text x="320" y="580">GURGAON</text>
            <text x="640" y="240">GHAZIABAD</text>
            <text x="660" y="440">OKHLA</text>
            <text x="680" y="525">NOIDA</text>
          </g>

          {/* Centered Large Serif Watermark: DELHI */}
          <text
            x="500"
            y="370"
            textAnchor="middle"
            fontFamily="'Playfair Display', serif"
            fontSize="88"
            letterSpacing="28"
            fill="#1A2E3B"
            opacity="0.05"
            fontWeight="bold"
          >
            DELHI
          </text>

          {/* 3. Metro Background Lines (Pink, Green, Yellow Corridors) */}
          {(activeFilter === 'both' || activeFilter === 'metro') && (
            <g filter="url(#shadowFilter)">
              {/* Yellow Line (North to South: Kashmere Gate -> Rajiv Chowk -> AIIMS -> Saket) */}
              <path
                d="M 490 190 L 490 350 L 480 470 L 460 550"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 490 190 L 490 350 L 480 470 L 460 550"
                fill="none"
                stroke="#EAB308"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Pink Line (Orbital Link) */}
              <path
                d="M 330 290 Q 420 260 520 280 T 630 380 T 570 490"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 330 290 Q 420 260 520 280 T 630 380 T 570 490"
                fill="none"
                stroke="#EC4899"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Green Line Corridor */}
              <path
                d="M 280 230 L 360 270 L 490 350"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M 280 230 L 360 270 L 490 350"
                fill="none"
                stroke="#22C55E"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* 4. Active Primary Transit Corridors matching Target Mockup */}
          <g filter="url(#shadowFilter)">
            {/* Metro Leg 1: Blue Line (Dwarka Sec 21 -> Janakpuri -> Rajiv Chowk) */}
            {(activeFilter === 'both' || activeFilter === 'metro') && (
              <>
                {/* White casing */}
                <path
                  d="M 220 460 Q 300 440 350 370 T 490 350"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Inner Vibrant Gold/Blue Line 3 */}
                <path
                  d="M 220 460 Q 300 440 350 370 T 490 350"
                  fill="none"
                  stroke="#D97706"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Dashed Pulse */}
                <path
                  d="M 220 460 Q 300 440 350 370 T 490 350"
                  fill="none"
                  stroke="#FEF3C7"
                  strokeWidth="2"
                  strokeDasharray="6 8"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* Bus Leg 2: City Bus 764 (Rajiv Chowk -> Mandi House -> Mayur Vihar -> Noida City Centre) */}
            {(activeFilter === 'both' || activeFilter === 'bus') && (
              <>
                {/* White casing */}
                <path
                  d="M 490 350 Q 560 360 620 410 T 730 470"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Inner Royal Blue Bus Line */}
                <path
                  d="M 490 350 Q 560 360 620 410 T 730 470"
                  fill="none"
                  stroke="#1D4ED8"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Dashed Flow */}
                <path
                  d="M 490 350 Q 560 360 620 410 T 730 470"
                  fill="none"
                  stroke="#BFDBFE"
                  strokeWidth="2"
                  strokeDasharray="6 8"
                  strokeLinecap="round"
                />
              </>
            )}
          </g>

          {/* 5. Key Network Station Dots */}
          <g>
            {/* Kashmere Gate (490, 190) */}
            <circle cx="490" cy="190" r="6" fill="#166534" stroke="#FFF" strokeWidth="2.5" />

            {/* Anand Vihar ISBT (680, 270) */}
            <circle cx="680" cy="270" r="5" fill="#475569" stroke="#FFF" strokeWidth="2" />
            <text x="692" y="274" fontSize="10" fontWeight="700" fill="#1A2E3B">Anand Vihar ISBT</text>

            {/* Saket (460, 550) */}
            <circle cx="460" cy="550" r="5" fill="#EA580C" stroke="#FFF" strokeWidth="2" />
            <text x="472" y="554" fontSize="10" fontWeight="700" fill="#1A2E3B">Saket</text>

            {/* AIIMS (480, 470) */}
            <circle cx="480" cy="470" r="5" fill="#0284C7" stroke="#FFF" strokeWidth="2" />
            <text x="492" y="474" fontSize="10" fontWeight="700" fill="#1A2E3B">AIIMS</text>
          </g>
        </svg>

        {/* 6. High-Contrast Overlay Badges (Matching Mockup Geometry & Typography) */}

        {/* Origin Hero Marker: DWARKA SEC 21 (Warm Gold Rounded Pill) */}
        <div
          style={{ left: '22%', top: '65.7%' }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto cursor-pointer group"
          onClick={() => onSelectOrigin && onSelectOrigin('S13')}
          title="Click to select Dwarka Sector 21 as origin"
        >
          <div className="flex items-center gap-1.5 rounded-full bg-[#B45309] border-2 border-white px-3.5 py-1 text-white shadow-lg group-hover:scale-105 transition-transform">
            <span className="h-2 w-2 rounded-full bg-white/40 border border-white" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider">
              DWARKA SEC 21
            </span>
          </div>
        </div>

        {/* Transfer Hero Marker: RAJIV CHOWK • 5m transfer (Target Blue Pill) */}
        <div
          style={{ left: '49%', top: '50%' }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto cursor-pointer group"
          onClick={() => handleStationClick('S01', 'Rajiv Chowk')}
          title="Rajiv Chowk Multimodal Interchange"
        >
          <div className="flex items-center gap-1.5 rounded-full bg-[#0284C7] border-2 border-white px-3.5 py-1 text-white shadow-lg group-hover:scale-105 transition-transform">
            <span className="text-xs font-bold">⇄</span>
            <span className="text-[11px] font-extrabold tracking-tight">
              RAJIV CHOWK • 5m transfer
            </span>
          </div>
        </div>

        {/* Destination Hero Marker: NOIDA CITY CENTRE (Dark Navy Pill with Red Dot) */}
        <div
          style={{ left: '73%', top: '67%' }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto cursor-pointer group"
          onClick={() => onSelectDestination && onSelectDestination('S19')}
          title="Click to set Noida City Centre as destination"
        >
          <div className="flex items-center gap-1.5 rounded-full bg-[#1A2E3B] border-2 border-white px-3.5 py-1 text-white shadow-lg group-hover:scale-105 transition-transform">
            <span className="h-2 w-2 rounded-full bg-[#E11D48]" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider">
              NOIDA CITY CENTRE
            </span>
          </div>
        </div>

        {/* Kashmere Gate Status Box (North Delhi matching mockup) */}
        <div
          style={{ left: '49%', top: '27%' }}
          className="absolute translate-x-3 -translate-y-1/2 z-20 pointer-events-auto"
        >
          <div className="flex items-center gap-2 rounded-2xl bg-white/95 border border-[#EDE8E1] px-3.5 py-2 shadow-md backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#166534] animate-pulse" />
            <div className="text-left">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#1A2E3B]">
                KASHMERE GATE
              </div>
              <div className="text-[9.5px] font-semibold text-[#166534]">
                Operating normally • Next in 2 min
              </div>
            </div>
          </div>
        </div>

        {/* Live Train Indicator Tag: Line 3 • 54 km/h */}
        <div
          style={{ left: '33%', top: '53%' }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
        >
          <div className="flex items-center gap-1.5 rounded-full bg-[#D97706] border-2 border-white px-2.5 py-0.5 text-white shadow-md text-[10px] font-extrabold">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            <span>Line 3 • 54 km/h</span>
          </div>
        </div>

        {/* Poochh-O Auto Indicator Tag: POOCHH-O AUTO */}
        <div
          style={{ left: '49%', top: '70%' }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
        >
          <div className="flex items-center gap-1.5 rounded-full bg-[#15803D] border-2 border-white px-2.5 py-0.5 text-white shadow-md text-[10px] font-extrabold">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span>POOCHH-O AUTO</span>
          </div>
        </div>
      </div>

      {/* Floating Bottom-Left Official Single-Row Legend (Matching Target Exactly) */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3 rounded-full border border-[#EDE8E1] bg-white/95 px-3.5 py-1.5 shadow-md backdrop-blur-md pointer-events-auto text-[11px] font-bold text-[#1A2E3B] flex-wrap max-w-[85%] sm:max-w-none">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#EC4899] inline-block" />
          <span>Metro Line</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#0284C7] inline-block" />
          <span>Bus Route</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#1E293B] inline-block" />
          <span>Airport</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#E11D48] inline-block" />
          <span>Key Station</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#D97706] inline-block" />
          <span>Your Route</span>
        </div>
      </div>

      {/* Floating Bottom-Right Map Controls matching Target */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
        {/* Map / Satellite Toggle Pill */}
        <div className="flex rounded-full bg-white border border-[#EDE8E1] p-0.5 shadow-md">
          <button
            type="button"
            onClick={() => setMapStyle('sandstone')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              mapStyle === 'sandstone'
                ? 'bg-[#1A2E3B] text-white shadow-2xs'
                : 'text-[#6E665D] hover:text-[#1A2E3B]'
            }`}
          >
            Map
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('satellite')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              mapStyle === 'satellite'
                ? 'bg-[#1A2E3B] text-white shadow-2xs'
                : 'text-[#6E665D] hover:text-[#1A2E3B]'
            }`}
          >
            Satellite
          </button>
        </div>

        {/* Locate button */}
        <button
          type="button"
          onClick={() => {
            if (onSwitchToLive) onSwitchToLive()
          }}
          title="Switch to Interactive Live Radar"
          aria-label="Switch to Live Radar"
          className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#EDE8E1] bg-white text-[#1A2E3B] hover:bg-[#FAF7F2] shadow-md transition-all cursor-pointer active:scale-95"
        >
          <NavigationIcon className="w-4 h-4 text-[#1A2E3B]" />
        </button>

        {/* Layers toggle */}
        <button
          type="button"
          onClick={() => setMapStyle(prev => (prev === 'satellite' ? 'sandstone' : 'satellite'))}
          title="Toggle Map Style"
          aria-label="Toggle Map Style"
          className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#EDE8E1] bg-white text-[#1A2E3B] shadow-md transition-all cursor-pointer hover:border-[#C49A43] active:scale-95"
        >
          <LayersIcon className="w-4 h-4 text-[#1A2E3B]" />
        </button>
      </div>
    </figure>
  )
}

