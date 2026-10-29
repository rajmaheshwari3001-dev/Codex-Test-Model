import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import type { JourneyOption, Stop, Route as TRoute } from '../types'
import { getStationSubtitle, getStationIcon } from '../utils/transitData'

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

    const map = L.map(containerRef.current, {
      zoomControl: false, // Custom zoom button placement
      scrollWheelZoom: true,
    }).setView([28.6139, 77.209], 12)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

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
          color: route.route_color || '#2563eb',
          weight: isFilteredIn && selectedRouteFilter !== 'ALL' ? 6 : 3.5,
          opacity: isFilteredIn ? (selectedRouteFilter !== 'ALL' ? 1.0 : 0.45) : 0.12,
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

      let radius = 6
      let color = '#334155'
      let fillColor = '#e2e8f0'
      let fillOpacity = 0.9
      let weight = 2

      if (isSelectedOrigin) {
        radius = 10
        color = '#064e3b'
        fillColor = '#10b981'
        fillOpacity = 1
        weight = 3.5
      } else if (isSelectedDest) {
        radius = 10
        color = '#881337'
        fillColor = '#ef4444'
        fillOpacity = 1
        weight = 3.5
      }

      const marker = L.circleMarker([s.stop_lat, s.stop_lon], {
        radius,
        color,
        fillColor,
        fillOpacity,
        weight,
      })

      const icon = getStationIcon(s.stop_name)
      const subtitle = getStationSubtitle(s.stop_id)

      marker.bindTooltip(
        `<div style="font-family: inherit;"><b>${icon} ${s.stop_name}</b><br/><span style="font-size:11px;color:#2563eb;font-weight:600">${subtitle}</span><br/><span style="font-size:10px;color:#64748b">Zone ${s.zone_id} • Node ${s.stop_id}</span></div>`,
        { direction: 'top', offset: [0, -7] }
      )

      // Rich interactive Transit Stop Card in Popup
      const popupDiv = document.createElement('div')
      popupDiv.className = 'text-xs font-sans p-1 min-w-[230px]'
      popupDiv.innerHTML = `
        <div style="font-family: inherit;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 22px;">${icon}</span>
            <div>
              <div style="font-weight: 900; font-size: 15px; color: #0f172a; line-height: 1.2;">${s.stop_name}</div>
              <div style="font-size: 11px; font-weight: 700; color: #2563eb; margin-top: 2px;">${subtitle}</div>
            </div>
          </div>
          <div style="display: flex; gap: 6px; margin: 8px 0 10px 0; font-size: 11px;">
            <span style="background: #f1f5f9; color: #475569; font-weight: 700; padding: 2px 7px; border-radius: 5px;">Zone ${s.zone_id}</span>
            <span style="background: #f1f5f9; color: #475569; font-weight: 700; padding: 2px 7px; border-radius: 5px;">Node ${s.stop_id}</span>
          </div>
          <div style="font-size: 11px; margin-bottom: 10px;">
            <span style="font-weight: 700; color: #334155;">Serving Lines:</span>
            <div style="margin-top: 5px; display: flex; flex-wrap: wrap; gap: 5px;">
              ${
                servingRoutes.length > 0
                  ? servingRoutes
                      .map(
                        r =>
                          `<span style="display:inline-flex; align-items:center; gap:4px; padding: 3px 8px; border-radius: 6px; font-weight: 800; font-size: 11px; background-color: ${r.route_color || '#2563eb'}18; color: ${r.route_color || '#2563eb'}; border: 1px solid ${r.route_color || '#2563eb'}50;">
                            <span style="width:6px; height:6px; border-radius:50%; background-color:${r.route_color || '#2563eb'};"></span>
                            ${r.route_name}
                          </span>`
                      )
                      .join('')
                  : '<span style="color:#94a3b8">Delhi Transit Stop</span>'
              }
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #E8DFCE;">
            <button id="btn-orig-${s.stop_id}" type="button" style="padding: 7px 10px; font-size: 11px; font-weight: 700; color: #ffffff; background-color: #173B32; border: none; border-radius: 6px; cursor: pointer; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.1); transition: all 0.2s;">
              📍 Set Origin
            </button>
            <button id="btn-dest-${s.stop_id}" type="button" style="padding: 7px 10px; font-size: 11px; font-weight: 700; color: #ffffff; background-color: #B88A43; border: none; border-radius: 6px; cursor: pointer; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.1); transition: all 0.2s;">
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
            color: leg.route_color || '#2563eb',
            weight: 10,
            opacity: 0.35,
          }).addTo(lg)

          // Main journey polyline
          L.polyline(legCoords, {
            color: leg.route_color || '#2563eb',
            weight: 5.5,
            opacity: 0.98,
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
            radius: 10,
            color: '#064e3b',
            fillColor: '#10b981',
            fillOpacity: 1,
            weight: 4,
          })
            .bindTooltip(`🟢 <b>Origin: ${s.stop_name}</b>`, {
              permanent: true,
              direction: 'top',
              offset: [0, -12],
            })
            .addTo(lg)
        } else if (s.stop_id === finalAlightStopId) {
          L.circleMarker([s.stop_lat, s.stop_lon], {
            radius: 10,
            color: '#881337',
            fillColor: '#ef4444',
            fillOpacity: 1,
            weight: 4,
          })
            .bindTooltip(`🔴 <b>Destination: ${s.stop_name}</b>`, {
              permanent: true,
              direction: 'top',
              offset: [0, -12],
            })
            .addTo(lg)
        } else if (transferStopIds.has(s.stop_id)) {
          L.circleMarker([s.stop_lat, s.stop_lon], {
            radius: 9,
            color: '#4c1d95',
            fillColor: '#8b5cf6',
            fillOpacity: 1,
            weight: 3.5,
          })
            .bindTooltip(`🔄 <b>Interchange: ${s.stop_name}</b>`, {
              permanent: true,
              direction: 'top',
              offset: [0, -11],
            })
            .addTo(lg)
        }
      })

      // Auto-fit bounds
      if (journeyCoords.length >= 2 && selectedRouteFilter === 'ALL') {
        mapRef.current.fitBounds(L.latLngBounds(journeyCoords.map(c => L.latLng(c[0], c[1]))), {
          padding: [55, 55],
          maxZoom: 14,
        })
      }
    } else {
      setHasJourney(false)
      if (validStops.length > 0 && selectedRouteFilter === 'ALL') {
        const allCoords = validStops.map(s => L.latLng(s.stop_lat, s.stop_lon))
        mapRef.current.fitBounds(L.latLngBounds(allCoords), {
          padding: [40, 40],
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
        padding: [40, 40],
      })
    } else {
      mapRef.current.setView([28.6139, 77.209], 12)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#E8DFCE] bg-[#FFFFFF] shadow-xs relative">
      {/* Floating Mobility HUD Header */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Corridor Quick Selector */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[#E8DFCE] bg-[#FFFFFF]/95 p-1.5 text-[#25312D] shadow-sm backdrop-blur-md pointer-events-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#53645F] px-1">Corridors:</span>
          <button
            type="button"
            onClick={() => setSelectedRouteFilter('ALL')}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              selectedRouteFilter === 'ALL'
                ? 'bg-[#173B32] text-white shadow-xs'
                : 'text-[#53645F] hover:bg-[#FAF7F2] hover:text-[#25312D]'
            }`}
          >
            All
          </button>
          {routes.map(r => (
            <button
              key={r.route_id}
              type="button"
              onClick={() => setSelectedRouteFilter(r.route_id)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                selectedRouteFilter === r.route_id
                  ? 'bg-[#173B32] text-white shadow-xs'
                  : 'text-[#53645F] hover:bg-[#FAF7F2] hover:text-[#25312D]'
              }`}
            >
              <span
                className="h-2 w-2 rounded-full inline-block"
                style={{ backgroundColor: r.route_color || '#173B32' }}
              />
              <span>{r.route_name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 rounded-lg border border-[#E8DFCE] bg-[#FFFFFF]/95 p-1.5 text-[#25312D] shadow-sm backdrop-blur-md pointer-events-auto">
          <button
            type="button"
            onClick={handleResetView}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-[#53645F] hover:bg-[#FAF7F2] hover:text-[#25312D] transition-colors"
            title="Reset network view"
          >
            Reset View
          </button>
          {hasJourney && (
            <span className="flex items-center gap-1.5 rounded-md bg-[#EBF4F0] border border-[#236B56]/30 px-2 py-0.5 text-xs font-bold text-[#236B56]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#236B56]" />
              Active Route
            </span>
          )}
        </div>
      </div>

      {/* Main Leaflet Map Container */}
      <div
        ref={containerRef}
        className="w-full h-[450px] sm:h-[500px] lg:h-[550px] z-10"
        aria-label="Interactive Transit Map"
        role="region"
      />

      {/* Bottom Telemetry & Provenance Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E8DFCE] bg-[#FAF7F2] px-4 py-2.5 text-xs text-[#53645F]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-semibold text-[#173B32]">
            <span className="h-2 w-2 rounded-full bg-[#173B32]" />
            Origin Stop
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-[#B88A43]">
            <span className="h-2 w-2 rounded-full bg-[#B88A43]" />
            Destination
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-[#53645F]">
            <span className="h-2 w-2 rounded-full bg-[#53645F]" />
            Network Stop
          </span>
        </div>
        <span className="text-[#53645F] text-[11px]">
          Delhi GTFS bus coordinates • Click any stop marker to set origin or destination
        </span>
      </div>
    </div>
  )
}
