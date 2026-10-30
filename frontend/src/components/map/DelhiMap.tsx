import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import type { JourneyOption, Stop, Route as TRoute } from '../../types'
import { getStationSubtitle, getStationIcon } from '../../utils/transitData'

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
      zoomControl: false,
      scrollWheelZoom: true,
    }).setView([28.625, 77.215], 12)

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

  // Draw Network & Active Journey
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
        const isMetro = route.route_type === 'metro' || route.route_id.startsWith('M')
        const routeColor = isMetro ? '#C49A43' : (route.route_color || '#172D3B')

        const poly = L.polyline(validRoutePoints, {
          color: routeColor,
          weight: isFilteredIn && selectedRouteFilter !== 'ALL' ? 6 : 3,
          opacity: isFilteredIn ? (selectedRouteFilter !== 'ALL' ? 0.95 : 0.4) : 0.12,
          dashArray: isFilteredIn && selectedRouteFilter !== 'ALL' ? undefined : (isMetro ? undefined : '6, 6'),
        })

        poly.bindTooltip(
          `<div style="font-family: inherit; font-size: 11px;">
            <b>${isMetro ? '🚇 Metro:' : '🚍 Bus:'} ${route.route_name}</b>
          </div>`,
          { sticky: true }
        )
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

      let radius = 5
      let color = '#73766F'
      let fillColor = '#EDE7DB'
      let fillOpacity = 0.9
      let weight = 1.5

      if (isSelectedOrigin) {
        radius = 9
        color = '#172D3B'
        fillColor = '#547A60'
        fillOpacity = 1
        weight = 3
      } else if (isSelectedDest) {
        radius = 9
        color = '#172D3B'
        fillColor = '#A64C42'
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

      const icon = getStationIcon(s.stop_name)
      const subtitle = getStationSubtitle(s.stop_id)

      marker.bindTooltip(
        `<div style="font-family: inherit;">
          <div style="font-weight: 700; color: #172D3B; font-size: 12px;">${icon} ${s.stop_name}</div>
          <div style="font-size: 11px; color: #C49A43; font-weight: 600;">${subtitle}</div>
          <div style="font-size: 10px; color: #73766F;">Zone ${s.zone_id} • Node ${s.stop_id}</div>
        </div>`,
        { direction: 'top', offset: [0, -7] }
      )

      // Rich interactive Transit Stop Card in Popup
      const popupDiv = document.createElement('div')
      popupDiv.className = 'text-xs p-1 min-w-[220px]'
      popupDiv.innerHTML = `
        <div style="font-family: inherit;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 20px;">${icon}</span>
            <div>
              <div style="font-weight: 800; font-size: 14px; color: #172D3B; line-height: 1.2;">${s.stop_name}</div>
              <div style="font-size: 11px; font-weight: 600; color: #C49A43; margin-top: 1px;">${subtitle}</div>
            </div>
          </div>
          <div style="display: flex; gap: 6px; margin: 6px 0 8px 0; font-size: 10px;">
            <span style="background: #EDE7DB; color: #29343A; font-weight: 700; padding: 2px 6px; border-radius: 4px;">Zone ${s.zone_id}</span>
            <span style="background: #EDE7DB; color: #73766F; font-weight: 700; padding: 2px 6px; border-radius: 4px;">Node ${s.stop_id}</span>
          </div>
          <div style="font-size: 11px; margin-bottom: 8px;">
            <span style="font-weight: 700; color: #73766F; font-size: 10px; text-transform: uppercase;">Lines Served:</span>
            <div style="margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px;">
              ${
                servingRoutes.length > 0
                  ? servingRoutes
                      .map(
                        r =>
                          `<span style="display:inline-flex; align-items:center; gap:3px; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px; background-color: #EDE7DB; color: #172D3B; border: 1px solid #DAD3C6;">
                            <span style="width:5px; height:5px; border-radius:50%; background-color:${r.route_color || '#172D3B'};"></span>
                            ${r.route_name.split(' ')[0]}
                          </span>`
                      )
                      .join('')
                  : '<span style="color:#73766F; font-size: 10px;">Delhi Transit Stop</span>'
              }
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #DAD3C6;">
            <button id="btn-orig-${s.stop_id}" type="button" style="padding: 6px 8px; font-size: 11px; font-weight: 700; color: #ffffff; background-color: #172D3B; border: none; border-radius: 6px; cursor: pointer; text-align: center; transition: all 0.2s;">
              📍 Set Origin
            </button>
            <button id="btn-dest-${s.stop_id}" type="button" style="padding: 6px 8px; font-size: 11px; font-weight: 700; color: #ffffff; background-color: #C49A43; border: none; border-radius: 6px; cursor: pointer; text-align: center; transition: all 0.2s;">
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
          const isMetro = leg.route_type === 'metro' || leg.route_id.startsWith('M')
          const legColor = isMetro ? '#C49A43' : (leg.route_color || '#172D3B')

          // Glow shadow under active line
          L.polyline(legCoords, {
            color: legColor,
            weight: 9,
            opacity: 0.25,
          }).addTo(lg)

          // Main journey polyline
          L.polyline(legCoords, {
            color: legColor,
            weight: 5,
            opacity: 1.0,
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
            color: '#172D3B',
            fillColor: '#547A60',
            fillOpacity: 1,
            weight: 3.5,
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
            color: '#172D3B',
            fillColor: '#A64C42',
            fillOpacity: 1,
            weight: 3.5,
          })
            .bindTooltip(`🔴 <b>Destination: ${s.stop_name}</b>`, {
              permanent: true,
              direction: 'top',
              offset: [0, -12],
            })
            .addTo(lg)
        } else if (transferStopIds.has(s.stop_id)) {
          L.circleMarker([s.stop_lat, s.stop_lon], {
            radius: 8.5,
            color: '#172D3B',
            fillColor: '#C49A43',
            fillOpacity: 1,
            weight: 3,
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
          padding: [50, 50],
          maxZoom: 14,
        })
      }
    } else {
      setHasJourney(false)
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
      mapRef.current.setView([28.625, 77.215], 12)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#DAD3C6] bg-[#FBF8F1] shadow-xs relative flex flex-col h-full min-h-[500px]">
      {/* Floating Mobility HUD Header */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Corridor Quick Selector */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[#DAD3C6] bg-[#FBF8F1]/95 p-1 text-[#29343A] shadow-sm backdrop-blur-md pointer-events-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#73766F] px-1.5">
            Corridors:
          </span>
          <button
            type="button"
            onClick={() => setSelectedRouteFilter('ALL')}
            className={`rounded px-2 py-0.5 text-xs font-semibold transition-all ${
              selectedRouteFilter === 'ALL'
                ? 'bg-[#172D3B] text-white shadow-2xs'
                : 'text-[#73766F] hover:bg-[#EDE7DB] hover:text-[#29343A]'
            }`}
          >
            All
          </button>
          {routes.map(r => (
            <button
              key={r.route_id}
              type="button"
              onClick={() => setSelectedRouteFilter(r.route_id)}
              className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold transition-all ${
                selectedRouteFilter === r.route_id
                  ? 'bg-[#172D3B] text-white shadow-2xs'
                  : 'text-[#73766F] hover:bg-[#EDE7DB] hover:text-[#29343A]'
              }`}
            >
              <span
                className="h-2 w-2 rounded-full inline-block"
                style={{ backgroundColor: r.route_color || '#172D3B' }}
              />
              <span>{r.route_name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 rounded-lg border border-[#DAD3C6] bg-[#FBF8F1]/95 p-1 text-[#29343A] shadow-sm backdrop-blur-md pointer-events-auto">
          <button
            type="button"
            onClick={handleResetView}
            className="rounded px-2 py-0.5 text-xs font-medium text-[#73766F] hover:bg-[#EDE7DB] hover:text-[#29343A] transition-colors"
            title="Reset network view"
          >
            Reset
          </button>
          {hasJourney && (
            <span className="flex items-center gap-1 rounded bg-[#EBF4F0] border border-[#547A60]/30 px-2 py-0.5 text-[11px] font-bold text-[#547A60]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#547A60]" />
              Active Route
            </span>
          )}
        </div>
      </div>

      {/* Main Leaflet Map Container */}
      <div
        ref={containerRef}
        className="w-full flex-1 min-h-[460px] z-10"
        aria-label="Interactive Delhi Transit Map"
        role="region"
      />

      {/* Bottom Telemetry & Provenance Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DAD3C6] bg-[#F5F0E6] px-4 py-2 text-xs text-[#73766F] shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-semibold text-[#547A60]">
            <span className="h-2 w-2 rounded-full bg-[#547A60]" />
            Origin
          </span>
          <span className="flex items-center gap-1 font-semibold text-[#A64C42]">
            <span className="h-2 w-2 rounded-full bg-[#A64C42]" />
            Destination
          </span>
          <span className="flex items-center gap-1 font-semibold text-[#C49A43]">
            <span className="h-2 w-2 rounded-full bg-[#C49A43]" />
            Metro Line
          </span>
          <span className="flex items-center gap-1 font-semibold text-[#172D3B]">
            <span className="h-2 w-2 rounded-full bg-[#172D3B]" />
            Bus Route
          </span>
        </div>
        <span className="text-[11px] text-[#73766F]">
          Delhi GTFS Stops • Click marker to set endpoints
        </span>
      </div>
    </div>
  )
}
