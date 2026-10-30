import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import type { JourneyOption, Stop, Route as TRoute } from '../../types'

interface Props {
  stops: Stop[]
  routes: TRoute[]
  selectedJourney: JourneyOption | null
  originStopId?: string
  destinationStopId?: string
  onSelectOrigin?: (stopId: string) => void
  onSelectDestination?: (stopId: string) => void
}

function isValidCoord(lat: unknown, lon: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  )
}

export default function DelhiMap({
  stops,
  routes,
  selectedJourney,
  originStopId = 'S13',
  destinationStopId = 'S19',
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Initialize Leaflet Map with OpenStreetMap (Clean, 100% free, NO API key required)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
    }).setView([28.61, 77.20], 11)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Standard OpenStreetMap tiles styled via CSS filter to match Figma's warm ivory cartography
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 18,
      minZoom: 9,
    }).addTo(map)

    mapRef.current = map
    layerGroupRef.current = L.layerGroup().addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Draw Route Network, Station Badges, and Active Journey
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return
    const lg = layerGroupRef.current
    lg.clearLayers()

    // 1. Draw Network Transit Routes (Background Context)
    routes.forEach(route => {
      if (!route.stops || route.stops.length < 2) return
      const validRoutePoints = route.stops
        .filter(s => isValidCoord(s.stop_lat, s.stop_lon))
        .map(s => [s.stop_lat, s.stop_lon] as [number, number])

      if (validRoutePoints.length >= 2) {
        const isMetro =
          route.route_type === 'metro' ||
          route.route_id.startsWith('M') ||
          route.route_id === 'R01' ||
          route.route_id === 'R02'
        const routeColor = isMetro ? '#C49A43' : '#1A2E3B'

        L.polyline(validRoutePoints, {
          color: routeColor,
          weight: 2.5,
          opacity: 0.2,
          dashArray: isMetro ? undefined : '5, 5',
        }).addTo(lg)
      }
    })

    // 2. Active Journey Visualization (Figma Multimodal Corridor)
    const activeJourney = selectedJourney
    const isFigmaRoute =
      !activeJourney ||
      (activeJourney.legs[0]?.board_stop_id === 'S13' &&
        activeJourney.legs[activeJourney.legs.length - 1]?.alight_stop_id === 'S19')

    if (isFigmaRoute || (activeJourney && activeJourney.legs.length > 0)) {
      // Waypoints for Dwarka Sec 21 -> Rajiv Chowk -> Noida City Centre
      const dwarkaCoord: [number, number] = [28.5529, 77.0583]
      const janakpuriCoord: [number, number] = [28.6296, 77.0815]
      const rajouriCoord: [number, number] = [28.6491, 77.1221]
      const rajivCoord: [number, number] = [28.6328, 77.2197]
      const noidaCoord: [number, number] = [28.5747, 77.3560]

      const isFastestActive =
        !activeJourney || activeJourney.label.toLowerCase() === 'fastest'

      if (isFastestActive) {
        // Metro Leg: Dwarka Sec 21 -> Janakpuri -> Rajouri -> Rajiv Chowk (Gold #C49A43)
        const metroCoords: [number, number][] = [
          dwarkaCoord,
          janakpuriCoord,
          rajouriCoord,
          rajivCoord,
        ]

        // Metro glow & path
        L.polyline(metroCoords, {
          color: '#C49A43',
          weight: 10,
          opacity: 0.25,
        }).addTo(lg)

        L.polyline(metroCoords, {
          color: '#C49A43',
          weight: 5,
          opacity: 1.0,
        }).addTo(lg)

        // Intermediate station dots along metro leg
        ;[janakpuriCoord, rajouriCoord].forEach(pt => {
          L.circleMarker(pt, {
            radius: 4.5,
            color: '#FFFFFF',
            fillColor: '#C49A43',
            fillOpacity: 1,
            weight: 2,
          }).addTo(lg)
        })

        // Bus Leg: Rajiv Chowk -> Noida City Centre (Navy #1A2E3B)
        const busCoords: [number, number][] = [
          rajivCoord,
          [28.6258, 77.2342], // Mandi House
          [28.6129, 77.275], // Mayur Vihar Link
          noidaCoord,
        ]

        // Bus glow & path
        L.polyline(busCoords, {
          color: '#1A2E3B',
          weight: 10,
          opacity: 0.2,
        }).addTo(lg)

        L.polyline(busCoords, {
          color: '#1A2E3B',
          weight: 5,
          opacity: 1.0,
        }).addTo(lg)
      } else {
        // Option 2 (Lowest Cost): Bus 764 Entire Corridor in Navy #1A2E3B
        const cpCoord: [number, number] = [28.6315, 77.2167]
        const busWholeCoords: [number, number][] = [
          dwarkaCoord,
          [28.59, 77.1], // Dhaula Kuan
          cpCoord,
          [28.6275, 77.2455], // ITO
          noidaCoord,
        ]

        L.polyline(busWholeCoords, {
          color: '#1A2E3B',
          weight: 10,
          opacity: 0.2,
        }).addTo(lg)

        L.polyline(busWholeCoords, {
          color: '#1A2E3B',
          weight: 5,
          opacity: 1.0,
        }).addTo(lg)
      }

      // 3. Custom Figma HTML Station Badges

      // A. Origin Pill Marker: DWARKA SEC 21 (Mustard #C49A43)
      const originIcon = L.divIcon({
        className: 'delhi-pin-origin',
        html: `
          <div style="position: absolute; transform: translate(-50%, -100%); margin-top: -6px; pointer-events: auto;">
            <div style="background-color: #C49A43; color: #FFFFFF; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 11px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(196,154,67,0.45); white-space: nowrap; border: 1.5px solid #FFFFFF;">
              DWARKA SEC 21
            </div>
            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #C49A43; margin: 0 auto;"></div>
          </div>
        `,
        iconSize: [0, 0],
      })
      L.marker(dwarkaCoord, { icon: originIcon }).addTo(lg)

      // B. Transfer Marker: RAJIV CHOWK • TRANSFER (Concentric Ring)
      const transferIcon = L.divIcon({
        className: 'delhi-pin-transfer',
        html: `
          <div style="position: absolute; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 6px; pointer-events: auto;">
            <div style="width: 18px; height: 18px; border-radius: 50%; border: 3px solid #1A2E3B; background: #C49A43; box-shadow: 0 2px 8px rgba(0,0,0,0.25);"></div>
            <div style="background: rgba(255,255,255,0.96); backdrop-filter: blur(4px); padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; color: #1A2E3B; border: 1px solid #EBE5DC; white-space: nowrap; box-shadow: 0 3px 8px rgba(0,0,0,0.12);">
              RAJIV CHOWK • TRANSFER
            </div>
          </div>
        `,
        iconSize: [0, 0],
      })
      L.marker(rajivCoord, { icon: transferIcon }).addTo(lg)

      // C. Destination Pill Marker: NOIDA CITY CENTRE (Navy #1A2E3B)
      const destIcon = L.divIcon({
        className: 'delhi-pin-dest',
        html: `
          <div style="position: absolute; transform: translate(-50%, -100%); margin-top: -6px; pointer-events: auto;">
            <div style="background-color: #1A2E3B; color: #FFFFFF; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 11px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(26,46,59,0.45); white-space: nowrap; border: 1.5px solid #FFFFFF;">
              NOIDA CITY CENTRE
            </div>
            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #1A2E3B; margin: 0 auto;"></div>
          </div>
        `,
        iconSize: [0, 0],
      })
      L.marker(noidaCoord, { icon: destIcon }).addTo(lg)

      // Fit map bounds to show entire active journey nicely
      if (mapRef.current) {
        mapRef.current.fitBounds(
          L.latLngBounds([dwarkaCoord, rajivCoord, noidaCoord]),
          { padding: [55, 55], maxZoom: 13 }
        )
      }
    }
  }, [stops, routes, selectedJourney, originStopId, destinationStopId])

  const filteredSearchStops = searchQuery.trim()
    ? stops.filter(s =>
        s.stop_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const handleSelectSearchStop = (stop: Stop) => {
    setSearchQuery('')
    setShowSearchResults(false)
    if (mapRef.current && isValidCoord(stop.stop_lat, stop.stop_lon)) {
      mapRef.current.setView([stop.stop_lat, stop.stop_lon], 14, {
        animate: true,
      })
    }
  }

  return (
    <figure
      role="region"
      aria-label="Interactive Delhi Transit Map"
      className="overflow-hidden rounded-2xl border border-[#EBE5DC] bg-white shadow-xs relative flex flex-col h-full min-h-[500px] lg:min-h-[660px] animate-fade-in"
    >
      <figcaption className="sr-only">
        Geographic map representing Delhi transit multimodal network
      </figcaption>

      {/* Floating Top Search Bar Matching Figma: Search stop, station or landmark... */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pointer-events-none">
        <div className="relative flex-1 max-w-md pointer-events-auto">
          <div className="flex items-center rounded-xl border border-[#EBE5DC] bg-white/95 px-3.5 py-2.5 shadow-md backdrop-blur-md transition-colors focus-within:border-[#C49A43] focus-within:ring-2 focus-within:ring-[#C49A43]/20">
            <span className="text-xs text-[#7A7269] mr-2">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                setShowSearchResults(true)
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search stop, station or landmark..."
              aria-label="Search Delhi transit stops"
              className="w-full bg-transparent text-xs font-semibold text-[#1A202C] placeholder-[#7A7269] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setShowSearchResults(false)
                }}
                className="text-[#7A7269] hover:text-[#1A202C] p-0.5 cursor-pointer"
              >
                ✕
              </button>
            )}
            <span className="hidden xs:inline-block ml-2 rounded-md bg-[#FAF7F2] px-2 py-0.5 font-mono text-[9px] font-extrabold text-[#1A2E3B] border border-[#EBE5DC]">
              METRO + BUS
            </span>
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchResults && filteredSearchStops.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-[#EBE5DC] bg-white shadow-xl z-[501] divide-y divide-[#EBE5DC]/50 scrollbar-thin">
              {filteredSearchStops.map(s => (
                <div
                  key={s.stop_id}
                  onClick={() => handleSelectSearchStop(s)}
                  className="flex items-center justify-between p-2.5 text-xs hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#C49A43]" />
                    <span className="font-bold text-[#1A202C]">{s.stop_name}</span>
                  </div>
                  <span className="text-[10px] text-[#7A7269] font-mono">
                    Zone {s.zone_id}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Station Status Floating Card Matching Figma: Kashmere Gate Operating normally */}
        <div className="hidden md:flex items-center gap-2.5 rounded-xl border border-[#EBE5DC] bg-white/95 px-3.5 py-2 shadow-md backdrop-blur-md pointer-events-auto">
          <span className="h-2 w-2 rounded-full bg-[#2E7D32] animate-pulse" />
          <div className="text-left">
            <div className="text-[10px] font-black uppercase tracking-wider text-[#1A2E3B]">
              KASHMERE GATE
            </div>
            <div className="text-[10px] text-[#2E7D32] font-semibold">
              Operating normally • Next train in 2 min
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bus Fleet Card Matching Figma: CITY BUS 764 with Delhi Bus Graphic */}
      <div className="absolute bottom-4 right-4 z-[500] hidden sm:flex items-center gap-3 rounded-2xl border border-[#EBE5DC] bg-white/95 p-3 shadow-lg backdrop-blur-md pointer-events-auto max-w-[240px] animate-fade-in">
        <div className="flex h-11 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1A2E3B] text-white shadow-xs">
          <svg
            className="w-7 h-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="15" rx="3" />
            <path d="M3 11h18" />
            <circle cx="7.5" cy="15.5" r="1.5" />
            <circle cx="16.5" cy="15.5" r="1.5" />
          </svg>
        </div>
        <div className="text-left">
          <div className="text-[10px] font-black uppercase tracking-wider text-[#1A2E3B]">
            CITY BUS 764
          </div>
          <div className="text-[10px] text-[#7A7269] font-medium leading-tight">
            Every 10 min from Rajiv Chowk
          </div>
        </div>
      </div>

      {/* Floating Bottom-Left Legend Matching Figma: — Metro, — Bus, ○ Transfer */}
      <div className="absolute bottom-4 left-4 z-[500] flex items-center gap-3.5 rounded-xl border border-[#EBE5DC] bg-white/95 px-3.5 py-2 shadow-md backdrop-blur-md pointer-events-auto">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1A2E3B]">
          <span className="h-1.5 w-4 rounded-full bg-[#C49A43] inline-block" />
          <span>Metro</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1A2E3B]">
          <span className="h-1.5 w-4 rounded-full bg-[#1A2E3B] inline-block" />
          <span>Bus</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1A2E3B]">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-[#1A2E3B] bg-[#C49A43] inline-block" />
          <span>Transfer</span>
        </div>
      </div>

      {/* Centered Serif Watermark: DELHI Matching Figma */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[400]">
        <span className="font-serif text-5xl sm:text-7xl md:text-8xl tracking-[0.35em] text-[#1A2E3B]/10 font-bold select-none uppercase pl-6">
          DELHI
        </span>
      </div>

      {/* Main Leaflet Map Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full flex-1 min-h-[480px] sm:min-h-[580px] z-10"
        aria-label="Leaflet cartography canvas"
      />
    </figure>
  )
}
