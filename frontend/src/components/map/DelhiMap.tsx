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

// Station coordinates for active corridor
const DWARKA_COORD: [number, number] = [28.5529, 77.0583]
const JANAKPURI_COORD: [number, number] = [28.6296, 77.0815]
const RAJOURI_COORD: [number, number] = [28.6491, 77.1221]
const RAJIV_COORD: [number, number] = [28.6328, 77.2197]
const MANDI_COORD: [number, number] = [28.6258, 77.2342]
const MAYUR_COORD: [number, number] = [28.6129, 77.275]
const NOIDA_COORD: [number, number] = [28.5747, 77.3560]
const KASHMERE_COORD: [number, number] = [28.6674, 77.2289]

export default function DelhiMap({
  stops,
  routes,
  selectedJourney,
  originStopId = 'S13',
  destinationStopId = 'S19',
  onSelectOrigin,
  onSelectDestination,
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Map Filter Toggles (Improvised Map Controls)
  const [showMetro, setShowMetro] = useState(true)
  const [showBus, setShowBus] = useState(true)
  const [showLiveVehicles, setShowLiveVehicles] = useState(true)

  // Expose origin & destination select to window for Leaflet HTML popups
  useEffect(() => {
    ;(window as unknown as { __selectOrigin?: (id: string) => void }).__selectOrigin = onSelectOrigin
    ;(window as unknown as { __selectDest?: (id: string) => void }).__selectDest = onSelectDestination

    return () => {
      delete (window as unknown as { __selectOrigin?: (id: string) => void }).__selectOrigin
      delete (window as unknown as { __selectDest?: (id: string) => void }).__selectDest
    }
  }, [onSelectOrigin, onSelectDestination])

  // Initialize Leaflet Map with OpenStreetMap (Clean, 100% free, NO API key required)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
    }).setView([28.61, 77.20], 11)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // OpenStreetMap styled via CSS filter in index.css to match warm ivory aesthetic
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

  // Draw Route Network, Station Badges, Live Vehicles, and Active Journey
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return
    const lg = layerGroupRef.current
    lg.clearLayers()

    // 1. Draw Network Transit Routes (Background Context)
    routes.forEach(route => {
      if (!route.stops || route.stops.length < 2) return
      const isMetro =
        route.route_type === 'metro' ||
        route.route_id.startsWith('M') ||
        route.route_id === 'R01' ||
        route.route_id === 'R02'

      if ((isMetro && !showMetro) || (!isMetro && !showBus)) return

      const validRoutePoints = route.stops
        .filter(s => isValidCoord(s.stop_lat, s.stop_lon))
        .map(s => [s.stop_lat, s.stop_lon] as [number, number])

      if (validRoutePoints.length >= 2) {
        const routeColor = isMetro ? '#C49A43' : '#1A2E3B'
        L.polyline(validRoutePoints, {
          color: routeColor,
          weight: isMetro ? 3 : 2,
          opacity: 0.25,
          dashArray: isMetro ? undefined : '5, 5',
        }).addTo(lg)
      }
    })

    // 2. Interactive Station Markers for ALL mapped Delhi Stops
    stops.forEach(stop => {
      if (!isValidCoord(stop.stop_lat, stop.stop_lon)) return
      const isMajorHub =
        stop.stop_id === 'S01' ||
        stop.stop_id === 'S02' ||
        stop.stop_id === 'S04' ||
        stop.stop_id === 'S10' ||
        stop.stop_id === 'S13' ||
        stop.stop_id === 'S19'

      const isCurrentOrigin = stop.stop_id === originStopId
      const isCurrentDest = stop.stop_id === destinationStopId

      // Skip origin/dest here since they get custom hero badges below
      if (isCurrentOrigin || isCurrentDest) return

      const marker = L.circleMarker([stop.stop_lat, stop.stop_lon], {
        radius: isMajorHub ? 5.5 : 4,
        color: '#FFFFFF',
        fillColor: isMajorHub ? '#C49A43' : '#1A2E3B',
        fillOpacity: 0.9,
        weight: 1.5,
      }).addTo(lg)

      // Rich interactive station popup
      const popupHtml = `
        <div style="font-family: 'Manrope', -apple-system, sans-serif; min-width: 190px;">
          <div style="font-size: 10px; font-weight: 800; color: #C49A43; text-transform: uppercase; letter-spacing: 0.5px;">
            ${isMajorHub ? 'Major Interchange Hub' : 'Delhi Transit Stop'} • Zone ${stop.zone_id}
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #1A2E3B; margin-top: 2px;">
            ${stop.stop_name}
          </div>
          <div style="font-size: 11px; color: #2E7D32; font-weight: 600; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #2E7D32;"></span>
            Operating normally • Next in 2 min
          </div>
          <div style="display: flex; gap: 6px; margin-top: 10px; border-top: 1px solid #EBE5DC; padding-top: 8px;">
            <button onclick="window.__selectOrigin && window.__selectOrigin('${stop.stop_id}')" style="flex: 1; padding: 5px 8px; font-size: 11px; font-weight: 700; background: #FAF0D9; color: #9A721C; border: 1px solid #F3E2BD; border-radius: 8px; cursor: pointer;">
              📍 Set Origin
            </button>
            <button onclick="window.__selectDest && window.__selectDest('${stop.stop_id}')" style="flex: 1; padding: 5px 8px; font-size: 11px; font-weight: 700; background: #1A2E3B; color: #FFFFFF; border: none; border-radius: 8px; cursor: pointer;">
              🎯 Set Dest
            </button>
          </div>
        </div>
      `
      marker.bindPopup(popupHtml)
    })

    // 3. Active Journey Visualization (Figma Multimodal Corridor)
    const activeJourney = selectedJourney
    const isFigmaRoute =
      !activeJourney ||
      (activeJourney.legs[0]?.board_stop_id === 'S13' &&
        activeJourney.legs[activeJourney.legs.length - 1]?.alight_stop_id === 'S19')

    if (isFigmaRoute || (activeJourney && activeJourney.legs.length > 0)) {
      const isFastestActive =
        !activeJourney || activeJourney.label.toLowerCase() === 'fastest'

      if (isFastestActive) {
        // Metro Leg: Dwarka Sec 21 -> Janakpuri -> Rajouri -> Rajiv Chowk (Gold #C49A43)
        const metroCoords: [number, number][] = [
          DWARKA_COORD,
          JANAKPURI_COORD,
          RAJOURI_COORD,
          RAJIV_COORD,
        ]

        if (showMetro) {
          // Metro glow & path
          L.polyline(metroCoords, {
            color: '#C49A43',
            weight: 12,
            opacity: 0.22,
          }).addTo(lg)

          L.polyline(metroCoords, {
            color: '#C49A43',
            weight: 5,
            opacity: 1.0,
          }).addTo(lg)

          // Animated flowing dash line indicating transit motion
          L.polyline(metroCoords, {
            color: '#FFFFFF',
            weight: 2.5,
            opacity: 0.8,
            dashArray: '8, 8',
            className: 'delhi-path-flow',
          }).addTo(lg)

          // Intermediate station dots along metro leg
          ;[JANAKPURI_COORD, RAJOURI_COORD].forEach(pt => {
            L.circleMarker(pt, {
              radius: 5,
              color: '#FFFFFF',
              fillColor: '#C49A43',
              fillOpacity: 1,
              weight: 2,
            }).addTo(lg)
          })
        }

        // Bus Leg: Rajiv Chowk -> Noida City Centre (Navy #1A2E3B)
        const busCoords: [number, number][] = [
          RAJIV_COORD,
          MANDI_COORD,
          MAYUR_COORD,
          NOIDA_COORD,
        ]

        if (showBus) {
          // Bus glow & path
          L.polyline(busCoords, {
            color: '#1A2E3B',
            weight: 12,
            opacity: 0.2,
          }).addTo(lg)

          L.polyline(busCoords, {
            color: '#1A2E3B',
            weight: 5,
            opacity: 1.0,
          }).addTo(lg)

          // Animated flowing dash line for bus
          L.polyline(busCoords, {
            color: '#C49A43',
            weight: 2,
            opacity: 0.85,
            dashArray: '8, 8',
            className: 'delhi-path-flow',
          }).addTo(lg)
        }
      } else {
        // Option 2 (Lowest Cost): Bus 764 Entire Corridor in Navy #1A2E3B
        const cpCoord: [number, number] = [28.6315, 77.2167]
        const busWholeCoords: [number, number][] = [
          DWARKA_COORD,
          [28.59, 77.1], // Dhaula Kuan
          cpCoord,
          [28.6275, 77.2455], // ITO
          NOIDA_COORD,
        ]

        if (showBus) {
          L.polyline(busWholeCoords, {
            color: '#1A2E3B',
            weight: 12,
            opacity: 0.2,
          }).addTo(lg)

          L.polyline(busWholeCoords, {
            color: '#1A2E3B',
            weight: 5,
            opacity: 1.0,
          }).addTo(lg)

          L.polyline(busWholeCoords, {
            color: '#C49A43',
            weight: 2,
            opacity: 0.85,
            dashArray: '8, 8',
            className: 'delhi-path-flow',
          }).addTo(lg)
        }
      }

      // 4. Custom Figma HTML Station Hero Badges

      // A. Origin Pill Marker: DWARKA SEC 21 (Mustard #C49A43)
      const originIcon = L.divIcon({
        className: 'delhi-pin-origin',
        html: `
          <div style="position: absolute; transform: translate(-50%, -100%); margin-top: -6px; pointer-events: auto;">
            <div style="background-color: #C49A43; color: #FFFFFF; padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 11px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(196,154,67,0.45); white-space: nowrap; border: 1.5px solid #FFFFFF; display: flex; align-items: center; gap: 4px;">
              <span>●</span>
              <span>DWARKA SEC 21</span>
            </div>
            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #C49A43; margin: 0 auto;"></div>
          </div>
        `,
        iconSize: [0, 0],
      })
      L.marker(DWARKA_COORD, { icon: originIcon }).addTo(lg)

      // B. Transfer Marker: RAJIV CHOWK • TRANSFER (Concentric Ring)
      const transferIcon = L.divIcon({
        className: 'delhi-pin-transfer',
        html: `
          <div style="position: absolute; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 6px; pointer-events: auto;">
            <div style="width: 20px; height: 20px; border-radius: 50%; border: 3px solid #1A2E3B; background: #C49A43; box-shadow: 0 2px 8px rgba(0,0,0,0.25);"></div>
            <div style="background: rgba(255,255,255,0.96); backdrop-filter: blur(4px); padding: 3px 8px; border-radius: 8px; font-size: 11px; font-weight: 800; color: #1A2E3B; border: 1px solid #EBE5DC; white-space: nowrap; box-shadow: 0 3px 8px rgba(0,0,0,0.12);">
              RAJIV CHOWK • TRANSFER
            </div>
          </div>
        `,
        iconSize: [0, 0],
      })
      L.marker(RAJIV_COORD, { icon: transferIcon }).addTo(lg)

      // C. Destination Pill Marker: NOIDA CITY CENTRE (Navy #1A2E3B)
      const destIcon = L.divIcon({
        className: 'delhi-pin-dest',
        html: `
          <div style="position: absolute; transform: translate(-50%, -100%); margin-top: -6px; pointer-events: auto;">
            <div style="background-color: #1A2E3B; color: #FFFFFF; padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 11px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(26,46,59,0.45); white-space: nowrap; border: 1.5px solid #FFFFFF; display: flex; align-items: center; gap: 4px;">
              <span>●</span>
              <span>NOIDA CITY CENTRE</span>
            </div>
            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #1A2E3B; margin: 0 auto;"></div>
          </div>
        `,
        iconSize: [0, 0],
      })
      L.marker(NOIDA_COORD, { icon: destIcon }).addTo(lg)

      // 5. LIVE ANIMATED TRANSIT VEHICLES (GPS Tracker Radar)
      if (showLiveVehicles) {
        // Vehicle 1: Blue Line Train #302 near Rajouri Garden
        const trainIcon = L.divIcon({
          className: 'delhi-vehicle-metro',
          html: `
            <div class="delhi-vehicle-live" style="position: absolute; transform: translate(-50%, -50%); background: #C49A43; color: #FFFFFF; padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 800; display: flex; align-items: center; gap: 4px; border: 2px solid #FFFFFF; box-shadow: 0 4px 12px rgba(196,154,67,0.5); cursor: pointer; white-space: nowrap;">
              <span>🚆</span>
              <span>LINE 3 • 52 km/h</span>
            </div>
          `,
          iconSize: [0, 0],
        })
        const trainMarker = L.marker(RAJOURI_COORD, { icon: trainIcon }).addTo(lg)
        trainMarker.bindPopup(`
          <div style="font-family: 'Manrope', sans-serif; min-width: 190px;">
            <div style="font-size: 10px; font-weight: 800; color: #C49A43; text-transform: uppercase;">
              Delhi Metro Rail • Blue Line
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #1A2E3B; margin-top: 2px;">
              Train #DMRC-302 (8-Coach)
            </div>
            <div style="font-size: 11px; color: #7A7269; margin-top: 4px;">
              Status: <strong style="color: #2E7D32;">On Schedule (52 km/h)</strong><br />
              Next: <strong>Rajiv Chowk in 2 min</strong><br />
              Occupancy: <strong>45% (Nominal)</strong>
            </div>
          </div>
        `)

        // Vehicle 2: City Bus 764 near Mandi House
        const busIcon = L.divIcon({
          className: 'delhi-vehicle-bus',
          html: `
            <div class="delhi-vehicle-live" style="position: absolute; transform: translate(-50%, -50%); background: #1A2E3B; color: #FFFFFF; padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 800; display: flex; align-items: center; gap: 4px; border: 2px solid #FFFFFF; box-shadow: 0 4px 12px rgba(26,46,59,0.5); cursor: pointer; white-space: nowrap;">
              <span>🚌</span>
              <span>BUS 764 • LIVE</span>
            </div>
          `,
          iconSize: [0, 0],
        })
        const busMarker = L.marker(MANDI_COORD, { icon: busIcon }).addTo(lg)
        busMarker.bindPopup(`
          <div style="font-family: 'Manrope', sans-serif; min-width: 190px;">
            <div style="font-size: 10px; font-weight: 800; color: #1A2E3B; text-transform: uppercase;">
              Delhi Transport Corporation • Electric
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #1A2E3B; margin-top: 2px;">
              Bus #DL-1PC-7640
            </div>
            <div style="font-size: 11px; color: #7A7269; margin-top: 4px;">
              Route: <strong>764 Special Express</strong><br />
              Status: <strong style="color: #2E7D32;">Live GPS (28 km/h)</strong><br />
              Next Stop: <strong>Mandi House in 1 min</strong><br />
              Crowd: <strong>Low (35% Seated)</strong>
            </div>
          </div>
        `)
      }
    }
  }, [
    stops,
    routes,
    selectedJourney,
    originStopId,
    destinationStopId,
    showMetro,
    showBus,
    showLiveVehicles,
  ])

  // Fit active journey bounds
  const handleFitRoute = () => {
    if (!mapRef.current) return
    mapRef.current.fitBounds(
      L.latLngBounds([DWARKA_COORD, RAJIV_COORD, NOIDA_COORD]),
      { padding: [60, 60], maxZoom: 13 }
    )
  }

  // Reset to full Delhi NCR overview
  const handleCenterDelhi = () => {
    if (!mapRef.current) return
    mapRef.current.setView([28.61, 77.20], 11, { animate: true })
  }

  // Jump to specific landmark
  const handleFlyToCoord = (coord: [number, number], zoom = 14) => {
    if (!mapRef.current) return
    mapRef.current.flyTo(coord, zoom, { duration: 1.2 })
  }

  const filteredSearchStops = searchQuery.trim()
    ? stops.filter(s =>
        s.stop_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const handleSelectSearchStop = (stop: Stop) => {
    setSearchQuery('')
    setShowSearchResults(false)
    if (mapRef.current && isValidCoord(stop.stop_lat, stop.stop_lon)) {
      mapRef.current.flyTo([stop.stop_lat, stop.stop_lon], 14, {
        duration: 1.2,
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

      {/* Floating Top Controls Bar (Search + Quick HUD Layer Toggles) */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pointer-events-none">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-sm pointer-events-auto">
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
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#1A202C] placeholder-[#7A7269] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setShowSearchResults(false)
                }}
                className="text-[#7A7269] hover:text-[#1A202C] p-0.5 cursor-pointer text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchResults && filteredSearchStops.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-[#EBE5DC] bg-white shadow-xl z-[501] divide-y divide-[#EBE5DC]/50 scrollbar-thin">
              {filteredSearchStops.map(s => (
                <div
                  key={s.stop_id}
                  onClick={() => handleSelectSearchStop(s)}
                  className="flex items-center justify-between p-2.5 text-xs sm:text-sm hover:bg-[#FAF7F2] transition-colors cursor-pointer"
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

        {/* Quick Map Controls HUD: Layer Toggles & Fit */}
        <div className="flex items-center gap-1.5 rounded-xl border border-[#EBE5DC] bg-white/95 p-1.5 shadow-md backdrop-blur-md pointer-events-auto">
          {/* Metro Toggle */}
          <button
            type="button"
            onClick={() => setShowMetro(prev => !prev)}
            title="Toggle Metro Lines"
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              showMetro
                ? 'bg-[#FAF0D9] text-[#9A721C] border border-[#F3E2BD]'
                : 'text-[#7A7269] hover:bg-[#FAF7F2]'
            }`}
          >
            Metro
          </button>

          {/* Bus Toggle */}
          <button
            type="button"
            onClick={() => setShowBus(prev => !prev)}
            title="Toggle Bus Lines"
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              showBus
                ? 'bg-[#E8EDF1] text-[#1A2E3B] border border-[#D3DEE6]'
                : 'text-[#7A7269] hover:bg-[#FAF7F2]'
            }`}
          >
            Bus
          </button>

          {/* Live Vehicles Toggle */}
          <button
            type="button"
            onClick={() => setShowLiveVehicles(prev => !prev)}
            title="Toggle Live GPS Transit Vehicles"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              showLiveVehicles
                ? 'bg-[#EAF5EC] text-[#2E7D32] border border-[#D1E7D5]'
                : 'text-[#7A7269] hover:bg-[#FAF7F2]'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32] animate-pulse" />
            <span>Live GPS</span>
          </button>

          {/* Fit Route */}
          <button
            type="button"
            onClick={handleFitRoute}
            title="Fit Route to Screen"
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#1A2E3B] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
          >
            Fit
          </button>

          {/* Center Delhi */}
          <button
            type="button"
            onClick={handleCenterDelhi}
            title="Center Delhi NCR"
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#1A2E3B] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
          >
            Delhi
          </button>
        </div>
      </div>

      {/* Floating Station Status Card Matching Figma: Kashmere Gate Operating normally */}
      <div
        onClick={() => handleFlyToCoord(KASHMERE_COORD)}
        className="absolute top-20 right-4 z-[500] hidden md:flex items-center gap-2.5 rounded-xl border border-[#EBE5DC] bg-white/95 px-3.5 py-2 sm:py-2.5 shadow-md backdrop-blur-md pointer-events-auto cursor-pointer hover:border-[#C49A43] transition-all"
        title="Click to view Kashmere Gate on map"
      >
        <span className="h-2 w-2 rounded-full bg-[#2E7D32] animate-pulse" />
        <div className="text-left">
          <div className="text-xs font-extrabold uppercase tracking-wider text-[#1A2E3B]">
            KASHMERE GATE
          </div>
          <div className="text-xs text-[#22702E] font-semibold">
            Operating normally • Next train in 2 min
          </div>
        </div>
      </div>

      {/* Floating Bus Fleet Card Matching Figma: CITY BUS 764 with Delhi Bus Graphic */}
      <div
        onClick={() => handleFlyToCoord(MANDI_COORD)}
        className="absolute bottom-4 right-4 z-[500] hidden sm:flex items-center gap-3 rounded-2xl border border-[#EBE5DC] bg-white/95 p-3 sm:p-3.5 shadow-lg backdrop-blur-md pointer-events-auto max-w-[260px] animate-fade-in cursor-pointer hover:border-[#C49A43] transition-all"
        title="Click to inspect City Bus 764 on map"
      >
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
          <div className="text-xs font-extrabold uppercase tracking-wider text-[#1A2E3B]">
            CITY BUS 764
          </div>
          <div className="text-xs text-[#7A7269] font-medium leading-tight">
            Every 10 min from Rajiv Chowk
          </div>
        </div>
      </div>

      {/* Floating Bottom-Left Legend Matching Figma: — Metro, — Bus, ○ Transfer */}
      <div className="absolute bottom-4 left-4 z-[500] flex items-center gap-3.5 rounded-xl border border-[#EBE5DC] bg-white/95 px-3.5 py-2 sm:py-2.5 shadow-md backdrop-blur-md pointer-events-auto">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1A2E3B]">
          <span className="h-1.5 w-4 rounded-full bg-[#C49A43] inline-block" />
          <span>Metro</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1A2E3B]">
          <span className="h-1.5 w-4 rounded-full bg-[#1A2E3B] inline-block" />
          <span>Bus</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1A2E3B]">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-[#1A2E3B] bg-[#C49A43] inline-block" />
          <span>Transfer</span>
        </div>
      </div>

      {/* Centered Serif Watermark: DELHI Matching Figma */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[400]">
        <span className="font-serif text-5xl sm:text-7xl md:text-8xl tracking-[0.35em] text-[#1A2E3B]/8 font-normal select-none uppercase pl-6">
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
