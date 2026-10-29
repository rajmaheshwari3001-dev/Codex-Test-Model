import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import type { JourneyOption, Stop, Route as TRoute } from '../types'

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

export default function TransportMap({
  stops,
  routes,
  selectedJourney,
  originStopId,
  destinationStopId,
  onSelectOrigin,
  onSelectDestination,
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>('ALL')
  const [hasJourney, setHasJourney] = useState(false)

  // Initialize Leaflet Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const mapContainer = containerRef.current
    const map = L.map(mapContainer, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([28.6139, 77.209], 12)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 18,
      minZoom: 9,
    }).addTo(map)

    mapRef.current = map
    layerGroupRef.current = L.layerGroup().addTo(map)
    const resizeObserver = new ResizeObserver(() => map.invalidateSize())
    resizeObserver.observe(mapContainer)
    window.requestAnimationFrame(() => map.invalidateSize())

    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Draw Layers
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return
    const lg = layerGroupRef.current
    lg.clearLayers()

    const validStops = stops.filter(s => isValidCoord(s.stop_lat, s.stop_lon))
    const stopsById = new Map(validStops.map(s => [s.stop_id, s]))

    // Map which routes serve each stop
    const routesByStopId = new Map<string, TRoute[]>()
    routes.forEach(route => {
      route.stops?.forEach(s => {
        const arr = routesByStopId.get(s.stop_id) || []
        if (!arr.some(r => r.route_id === route.route_id)) {
          arr.push(route)
        }
        routesByStopId.set(s.stop_id, arr)
      })
    })

    // 1. Draw all transit route polylines
    routes.forEach(route => {
      if (!route.stops || route.stops.length < 2) return
      const isFilteredIn = selectedRouteFilter === 'ALL' || selectedRouteFilter === route.route_id
      const validRoutePoints = route.stops
        .filter(s => isValidCoord(s.stop_lat, s.stop_lon))
        .map(s => [s.stop_lat, s.stop_lon] as [number, number])

      if (validRoutePoints.length >= 2) {
        const poly = L.polyline(validRoutePoints, {
          color: route.route_color || '#94a3b8',
          weight: isFilteredIn && selectedRouteFilter !== 'ALL' ? 6 : 3.5,
          opacity: isFilteredIn ? (selectedRouteFilter !== 'ALL' ? 0.95 : 0.45) : 0.12,
          dashArray: isFilteredIn && selectedRouteFilter !== 'ALL' ? undefined : '5, 5',
        })

        poly.bindTooltip(`Route ${route.route_name}`, { sticky: true })
        poly.addTo(lg)

        if (selectedRouteFilter === route.route_id && mapRef.current) {
          mapRef.current.fitBounds(poly.getBounds(), { padding: [45, 45] })
        }
      }
    })

    // 2. Draw all stops as standard network node markers with interactive popup
    validStops.forEach(s => {
      const isSelectedOrigin = s.stop_id === originStopId
      const isSelectedDest = s.stop_id === destinationStopId
      const servingRoutes = routesByStopId.get(s.stop_id) || []

      // Determine marker styling
      let radius = 5.5
      let color = '#475569'
      let fillColor = '#cbd5e1'
      let fillOpacity = 0.85
      let weight = 2

      if (isSelectedOrigin) {
        radius = 9
        color = '#064e3b'
        fillColor = '#10b981'
        fillOpacity = 1
        weight = 3
      } else if (isSelectedDest) {
        radius = 9
        color = '#881337'
        fillColor = '#ef4444'
        fillOpacity = 1
        weight = 3
      }

      const marker = L.circleMarker([s.stop_lat, s.stop_lon], {
        radius,
        color,
        fillColor,
        fillOpacity,
        weight,
      })

      // Tooltip for quick hover
      marker.bindTooltip(
        `<div style="font-family: inherit;"><b>${s.stop_name}</b><br/><span style="font-size:11px;color:#64748b">Zone ${s.zone_id} • Stop ${s.stop_id}</span></div>`,
        { direction: 'top', offset: [0, -7] }
      )

      // Rich interactive Leaflet Popup on click
      const popupDiv = document.createElement('div')
      popupDiv.className = 'text-xs font-sans p-1 min-w-[200px]'
      popupDiv.innerHTML = `
        <div style="font-family: inherit;">
          <div style="font-weight: 800; font-size: 14px; color: #0f172a; margin-bottom: 2px;">${s.stop_name}</div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">Zone ${s.zone_id} • Stop ID: ${s.stop_id}</div>
          <div style="font-size: 11px; margin-bottom: 10px;">
            <span style="font-weight: 700; color: #334155;">Serving Lines:</span>
            <div style="margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px;">
              ${
                servingRoutes.length > 0
                  ? servingRoutes
                      .map(
                        r =>
                          `<span style="display:inline-block; padding: 2px 7px; border-radius: 5px; font-weight: 700; font-size: 11px; background-color: ${r.route_color || '#059669'}18; color: ${r.route_color || '#059669'}; border: 1px solid ${r.route_color || '#059669'}40;">${r.route_name}</span>`
                      )
                      .join('')
                  : '<span style="color:#94a3b8">Delhi Transit Stop</span>'
              }
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
            <button id="btn-orig-${s.stop_id}" type="button" style="padding: 6px 8px; font-size: 12px; font-weight: 700; color: #ffffff; background-color: #065f46; border: none; border-radius: 6px; cursor: pointer; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
              📍 Set Origin
            </button>
            <button id="btn-dest-${s.stop_id}" type="button" style="padding: 6px 8px; font-size: 12px; font-weight: 700; color: #ffffff; background-color: #b91c1c; border: none; border-radius: 6px; cursor: pointer; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
              🎯 Set Dest
            </button>
          </div>
        </div>
      `

      marker.bindPopup(popupDiv)

      marker.on('popupopen', () => {
        const origBtn = document.getElementById(`btn-orig-${s.stop_id}`)
        const destBtn = document.getElementById(`btn-dest-${s.stop_id}`)

        if (origBtn && onSelectOrigin) {
          origBtn.onclick = () => {
            onSelectOrigin(s.stop_id)
            marker.closePopup()
          }
        }
        if (destBtn && onSelectDestination) {
          destBtn.onclick = () => {
            onSelectDestination(s.stop_id)
            marker.closePopup()
          }
        }
      })

      marker.addTo(lg)
    })

    // 3. Highlight selected journey path and key stops
    if (selectedJourney && selectedJourney.legs.length > 0) {
      setHasJourney(true)
      const journeyCoords: [number, number][] = []
      const boardStopId = selectedJourney.legs[0]?.board_stop_id
      const finalAlightStopId = selectedJourney.legs[selectedJourney.legs.length - 1]?.alight_stop_id
      const transferStopIds = new Set(selectedJourney.transfers.map(t => t.at_stop_id))

      selectedJourney.legs.forEach(leg => {
        const legStopIds = [
          leg.board_stop_id,
          ...(leg.intermediate_stop_ids || []),
          leg.alight_stop_id,
        ]

        const legCoords: [number, number][] = []
        legStopIds.forEach(stopId => {
          const stopObj = stopsById.get(stopId)
          if (stopObj && isValidCoord(stopObj.stop_lat, stopObj.stop_lon)) {
            legCoords.push([stopObj.stop_lat, stopObj.stop_lon])
          }
        })

        if (legCoords.length >= 2) {
          // Glow shadow under active line
          L.polyline(legCoords, {
            color: leg.route_color || '#059669',
            weight: 9,
            opacity: 0.35,
          }).addTo(lg)

          // Main journey polyline
          L.polyline(legCoords, {
            color: leg.route_color || '#059669',
            weight: 5,
            opacity: 0.95,
          })
            .bindTooltip(`${leg.route_name} (${leg.departure_time} - ${leg.arrival_time})`, {
              sticky: true,
            })
            .addTo(lg)

          journeyCoords.push(...legCoords)
        }
      })

      // Key Stop Markers on Selected Journey
      validStops.forEach(s => {
        if (s.stop_id === boardStopId) {
          L.circleMarker([s.stop_lat, s.stop_lon], {
            radius: 9,
            color: '#064e3b',
            fillColor: '#10b981',
            fillOpacity: 1,
            weight: 3.5,
          })
            .bindTooltip(`🟢 <b>Origin: ${s.stop_name}</b>`, {
              permanent: true,
              direction: 'top',
              offset: [0, -11],
            })
            .addTo(lg)
        } else if (s.stop_id === finalAlightStopId) {
          L.circleMarker([s.stop_lat, s.stop_lon], {
            radius: 9,
            color: '#881337',
            fillColor: '#ef4444',
            fillOpacity: 1,
            weight: 3.5,
          })
            .bindTooltip(`🔴 <b>Destination: ${s.stop_name}</b>`, {
              permanent: true,
              direction: 'top',
              offset: [0, -11],
            })
            .addTo(lg)
        } else if (transferStopIds.has(s.stop_id)) {
          L.circleMarker([s.stop_lat, s.stop_lon], {
            radius: 8,
            color: '#4c1d95',
            fillColor: '#8b5cf6',
            fillOpacity: 1,
            weight: 3,
          })
            .bindTooltip(`🔄 <b>Transfer: ${s.stop_name}</b>`, {
              permanent: true,
              direction: 'top',
              offset: [0, -10],
            })
            .addTo(lg)
        }
      })

      // Auto-fit bounds
      if (journeyCoords.length >= 2 && selectedRouteFilter === 'ALL') {
        mapRef.current.fitBounds(L.latLngBounds(journeyCoords.map(c => L.latLng(c[0], c[1]))), {
          padding: [50, 50],
          maxZoom: 14,
        })
      }
    } else {
      setHasJourney(false)
      // Fit all stops when no journey is selected and no single corridor is filtered
      if (validStops.length > 0 && selectedRouteFilter === 'ALL') {
        const allCoords = validStops.map(s => L.latLng(s.stop_lat, s.stop_lon))
        mapRef.current.fitBounds(L.latLngBounds(allCoords), {
          padding: [35, 35],
        })
      }
    }
  }, [stops, routes, selectedJourney, selectedRouteFilter, originStopId, destinationStopId, onSelectOrigin, onSelectDestination])

  function handleResetView() {
    setSelectedRouteFilter('ALL')
    if (!mapRef.current) return
    const validStops = stops.filter(s => isValidCoord(s.stop_lat, s.stop_lon))
    if (validStops.length > 0) {
      const allCoords = validStops.map(s => L.latLng(s.stop_lat, s.stop_lon))
      mapRef.current.fitBounds(L.latLngBounds(allCoords), {
        padding: [35, 35],
      })
    } else {
      mapRef.current.setView([28.6139, 77.209], 12)
    }
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[#d8d3c7] bg-[#fffdf7] shadow-[0_18px_50px_-36px_rgba(27,39,35,0.5)]">
      <header className="flex items-center justify-between gap-3 border-b border-[#e7e3d9] bg-[#fffdf7] px-5 py-4">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#7b867b]">02 / Network map</p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-[#172421] sm:text-xl">Delhi, by line</h2>
        </div>
        <span className="rounded-full border border-[#d8d3c7] bg-[#f3f1e9] px-3 py-1.5 font-mono text-[10px] font-bold text-[#4c5c52]">
          {stops.length} STOPS
        </span>
      </header>
      <div className="relative">
      {/* Top Floating Controls: Corridor Filter & Network Reset */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Corridor Filter Badges */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-sm border border-slate-200 text-xs pointer-events-auto">
          <span className="text-xs font-bold text-slate-500 uppercase px-1">Corridors:</span>
          <button
            type="button"
            onClick={() => setSelectedRouteFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              selectedRouteFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          {routes.map(r => (
            <button
              key={r.route_id}
              type="button"
              onClick={() => setSelectedRouteFilter(r.route_id)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                selectedRouteFilter === r.route_id
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: r.route_color || '#059669' }}
              />
              <span>{r.route_name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-sm border border-slate-200 text-xs pointer-events-auto">
          <button
            type="button"
            onClick={handleResetView}
            className="px-3 py-1 text-slate-700 hover:text-emerald-800 hover:bg-slate-100 rounded-lg font-bold transition-colors"
            title="Reset network view"
          >
            Reset View
          </button>
          {hasJourney && (
            <span className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg font-bold border border-emerald-200">
              Active Path
            </span>
          )}
        </div>
      </div>

      {/* Main Leaflet Map Container */}
      <div
        ref={containerRef}
        className="z-10 h-[390px] w-full sm:h-[460px] lg:h-[500px]"
        aria-label="Interactive Transit Map"
        role="region"
      />
      </div>

      {/* Map Footer Provenance Note & Interactive Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e7e3d9] bg-[#f8f6f0] px-4 py-2.5 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-900">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 shadow-2xs" />
            Origin
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-rose-900">
            <span className="inline-block w-3 h-3 rounded-full bg-rose-500 shadow-2xs" />
            Destination
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-purple-900">
            <span className="inline-block w-3 h-3 rounded-full bg-purple-500 shadow-2xs" />
            Transfer
          </span>
          <span className="text-slate-400 font-medium">| Click any stop marker to set origin/destination</span>
        </div>
        <span className="text-slate-400 font-medium">
          OpenStreetMap tiles • Sample network • Scheduled timetable
        </span>
      </div>
    </div>
  )
}
