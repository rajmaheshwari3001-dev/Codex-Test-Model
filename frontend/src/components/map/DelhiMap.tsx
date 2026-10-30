import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import L from 'leaflet'
import type { JourneyOption, Stop, Route as TRoute } from '../../types'
import { DELHI_STATION_METADATA } from '../../utils/transitData'
import {
  SearchIcon,
  XIcon,
  TrainIcon,
  BusIcon,
  CheckIcon,
  NavigationIcon,
  LayersIcon,
} from '../common/Icons'

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

// Canonical Station coordinates for primary corridors & hubs
const DWARKA_COORD: [number, number] = [28.5529, 77.0583]
const JANAKPURI_COORD: [number, number] = [28.6296, 77.0815]
const RAJOURI_COORD: [number, number] = [28.6491, 77.1221]
const RAJIV_COORD: [number, number] = [28.6328, 77.2197]
const MANDI_COORD: [number, number] = [28.6258, 77.2342]
const MAYUR_COORD: [number, number] = [28.6129, 77.2750]
const NOIDA_COORD: [number, number] = [28.5641, 77.3341]
const KASHMERE_COORD: [number, number] = [28.6674, 77.2289]
const CHANDNI_COORD: [number, number] = [28.6560, 77.2300]
const NDLS_COORD: [number, number] = [28.6425, 77.2193]
const CP_COORD: [number, number] = [28.6315, 77.2167]
const INDIA_GATE_COORD: [number, number] = [28.6129, 77.2295]
const LAJPAT_COORD: [number, number] = [28.5700, 77.2400]
const SAKET_COORD: [number, number] = [28.5224, 77.2015]
const HAUZ_KHAS_COORD: [number, number] = [28.5494, 77.2001]
const AIIMS_COORD: [number, number] = [28.5672, 77.2100]
const ITO_COORD: [number, number] = [28.6275, 77.2455]
const NEHRU_COORD: [number, number] = [28.5489, 77.2533]
const INA_COORD: [number, number] = [28.5744, 77.2105]
const ANAND_VIHAR_COORD: [number, number] = [28.6469, 77.3160]
const SARAI_KALE_COORD: [number, number] = [28.5888, 77.2544]
const DHAULA_KUAN_COORD: [number, number] = [28.5910, 77.1610]
const AEROCITY_COORD: [number, number] = [28.5480, 77.1220]
const AIRPORT_T3_COORD: [number, number] = [28.5560, 77.0850]
const BOTANICAL_COORD: [number, number] = [28.5645, 77.3340]


type MapStyle = 'sandstone' | 'dark' | 'satellite'

export default function DelhiMap({
  stops,
  routes: _routes,
  selectedJourney,
  originStopId = 'S13',
  destinationStopId = 'S19',
  onSelectOrigin,
  onSelectDestination,
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const mapSearchRef = useRef<HTMLDivElement>(null)
  const [mapStyle, setMapStyle] = useState<MapStyle>('sandstone')

  // Map Filter Toggles
  const [showMetro, setShowMetro] = useState(true)
  const [showBus, setShowBus] = useState(true)

  // Close map search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (mapSearchRef.current && !mapSearchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false)
      }
    }
    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSearchResults])

  // Listen to Global Station Selections and fly camera to station
  useEffect(() => {
    const handleStationSelect = (e: Event) => {
      const customEvent = e as CustomEvent<{ stopId: string }>
      const { stopId } = customEvent.detail || {}
      if (!stopId) return
      const s = stops.find(st => st.stop_id === stopId)
      if (s && mapRef.current && isValidCoord(s.stop_lat, s.stop_lon)) {
        mapRef.current.flyTo([s.stop_lat, s.stop_lon], 14, { duration: 1.2 })
      }
    }
    window.addEventListener('aaroh_station_select', handleStationSelect)
    return () => window.removeEventListener('aaroh_station_select', handleStationSelect)
  }, [stops])

  // Listen to Night / Day mode changes from Header
  useEffect(() => {
    const handleTheme = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: 'light' | 'dark' }>
      if (customEvent.detail?.theme === 'dark') {
        setMapStyle('dark')
      } else {
        setMapStyle('sandstone')
      }
    }
    try {
      const savedTheme = localStorage.getItem('aaroh_theme')
      if (savedTheme === 'dark') setMapStyle('dark')
    } catch {}
    window.addEventListener('aaroh_theme_change', handleTheme)
    return () => window.removeEventListener('aaroh_theme_change', handleTheme)
  }, [])

  // Expose origin & destination select to window for Leaflet HTML popups
  useEffect(() => {
    ;(window as unknown as { __selectOrigin?: (id: string) => void }).__selectOrigin = onSelectOrigin
    ;(window as unknown as { __selectDest?: (id: string) => void }).__selectDest = onSelectDestination

    return () => {
      delete (window as unknown as { __selectOrigin?: (id: string) => void }).__selectOrigin
      delete (window as unknown as { __selectDest?: (id: string) => void }).__selectDest
    }
  }, [onSelectOrigin, onSelectDestination])

  // Change Basemap Tiles dynamically based on mapStyle (Clean OpenStreetMap tiles, zero API key watermark)
  const updateTileLayer = useCallback((style: MapStyle, map: L.Map) => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
    }

    let url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    let maxZoom = 19
    let subdomains = 'abc'

    if (style === 'satellite') {
      // High-resolution aerial satellite imagery (Esri World Imagery)
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      attribution = '&copy; Esri, Maxar, Earthstar Geographics'
      maxZoom = 18
      subdomains = 'abc'
    } else if (style === 'dark') {
      // Clean Dark Map Tiles
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      attribution = '&copy; OpenStreetMap contributors'
      maxZoom = 19
      subdomains = 'abc'
    }

    const newLayer = L.tileLayer(url, {
      attribution,
      maxZoom,
      minZoom: 9,
      subdomains,
    }).addTo(map)

    tileLayerRef.current = newLayer
  }, [])

  // Initialize Leaflet Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
      minZoom: 11,
      maxZoom: 18,
    }).setView([28.625, 77.215], 12)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    updateTileLayer(mapStyle, map)

    mapRef.current = map
    layerGroupRef.current = L.layerGroup().addTo(map)

    // Invalidate size after layout settles and frame Delhi core transit corridor
    requestAnimationFrame(() => {
      if (!mapRef.current) return
      map.invalidateSize()
      map.setView([28.625, 77.215], 12)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [mapStyle, updateTileLayer])

  // Handle map style changes
  useEffect(() => {
    if (mapRef.current) {
      updateTileLayer(mapStyle, mapRef.current)
    }
  }, [mapStyle, updateTileLayer])

  // Draw Delhi Multi-Modal Network, Halos, Active Route, and GPS Vehicles
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return
    const lg = layerGroupRef.current
    lg.clearLayers()

    // 1. CLEAN & ELEGANT DELHI TRANSIT NETWORK CORRIDORS (Subtle background paths)
    if (showMetro) {
      const blueLineWest: [number, number][] = [
        DWARKA_COORD,
        JANAKPURI_COORD,
        RAJOURI_COORD,
        RAJIV_COORD,
        MANDI_COORD,
      ]
      const blueLineNoidaBranch: [number, number][] = [
        MANDI_COORD,
        MAYUR_COORD,
        NOIDA_COORD,
      ]
      const blueLineAnandBranch: [number, number][] = [
        MANDI_COORD,
        ITO_COORD,
        ANAND_VIHAR_COORD,
      ]

      ;[blueLineWest, blueLineNoidaBranch, blueLineAnandBranch].forEach(pts => {
        L.polyline(pts, {
          color: '#0072CE',
          weight: 2.5,
          opacity: 0.4,
        }).addTo(lg)
      })

      // Yellow Line Spine
      const yellowSpine: [number, number][] = [
        KASHMERE_COORD,
        CHANDNI_COORD,
        NDLS_COORD,
        CP_COORD,
        RAJIV_COORD,
        INA_COORD,
        AIIMS_COORD,
        HAUZ_KHAS_COORD,
        SAKET_COORD,
      ]
      L.polyline(yellowSpine, {
        color: '#E5A800',
        weight: 2.5,
        opacity: 0.4,
      }).addTo(lg)

      // Airport Express Line
      const orangeAirport: [number, number][] = [
        NDLS_COORD,
        [28.6290, 77.2130],
        DHAULA_KUAN_COORD,
        AEROCITY_COORD,
        AIRPORT_T3_COORD,
        DWARKA_COORD,
      ]
      L.polyline(orangeAirport, {
        color: '#FF6F00',
        weight: 2.5,
        opacity: 0.45,
      }).addTo(lg)

      // Magenta Line
      const magentaLine: [number, number][] = [
        JANAKPURI_COORD,
        HAUZ_KHAS_COORD,
        NEHRU_COORD,
        BOTANICAL_COORD,
      ]
      L.polyline(magentaLine, {
        color: '#C2185B',
        weight: 2.5,
        opacity: 0.35,
      }).addTo(lg)

      // Pink Line
      const pinkLine: [number, number][] = [
        RAJOURI_COORD,
        DHAULA_KUAN_COORD,
        INA_COORD,
        LAJPAT_COORD,
        MAYUR_COORD,
      ]
      L.polyline(pinkLine, {
        color: '#E91E63',
        weight: 2.5,
        opacity: 0.35,
      }).addTo(lg)

      // Green Line
      const greenLine: [number, number][] = [
        KASHMERE_COORD,
        [28.674, 77.165],
        RAJOURI_COORD,
      ]
      L.polyline(greenLine, {
        color: '#00A651',
        weight: 2.5,
        opacity: 0.35,
      }).addTo(lg)

      // Violet Line
      const violetLine: [number, number][] = [
        KASHMERE_COORD,
        ITO_COORD,
        MANDI_COORD,
        SARAI_KALE_COORD,
        LAJPAT_COORD,
        NEHRU_COORD,
      ]
      L.polyline(violetLine, {
        color: '#8A2BE2',
        weight: 2.5,
        opacity: 0.35,
      }).addTo(lg)
    }

    if (showBus) {
      // Ring Road Bus
      const ringRoadBus: [number, number][] = [
        CP_COORD,
        INDIA_GATE_COORD,
        SARAI_KALE_COORD,
        LAJPAT_COORD,
        AIIMS_COORD,
        DHAULA_KUAN_COORD,
        JANAKPURI_COORD,
      ]
      L.polyline(ringRoadBus, {
        color: '#E31B23',
        weight: 2,
        opacity: 0.35,
        dashArray: '5, 5',
      }).addTo(lg)

      // Bus 764
      const bus764Whole: [number, number][] = [
        DWARKA_COORD,
        [28.59, 77.10],
        CP_COORD,
        MANDI_COORD,
        MAYUR_COORD,
        NOIDA_COORD,
      ]
      L.polyline(bus764Whole, {
        color: '#1A2E3B',
        weight: 2,
        opacity: 0.35,
        dashArray: '5, 5',
      }).addTo(lg)
    }

    // 2. INTERACTIVE STATION STOPS WITH GLOWING HALOS
    stops.forEach(stop => {
      if (!isValidCoord(stop.stop_lat, stop.stop_lon)) return

      const isRajiv = stop.stop_id === 'S01'
      const isKashmere = stop.stop_id === 'S02'
      const isInterchange =
        isRajiv ||
        isKashmere ||
        stop.stop_id === 'S04' || // New Delhi Stn
        stop.stop_id === 'S10' || // AIIMS
        stop.stop_id === 'S13' || // Dwarka Sec 21
        stop.stop_id === 'S19' || // Noida
        stop.stop_id === 'S15' || // Rajouri
        stop.stop_id === 'S17'    // Mandi House

      const isOrigin = stop.stop_id === originStopId
      const isDest = stop.stop_id === destinationStopId

      // Highlight active origin / destination with distinct glowing hero badges
      if (isOrigin || isDest) return

      // Station Marker
      const circle = L.circleMarker([stop.stop_lat, stop.stop_lon], {
        radius: isInterchange ? 6.5 : 4.5,
        color: '#FFFFFF',
        fillColor: isRajiv ? '#C49A43' : isInterchange ? '#1A2E3B' : '#7A7269',
        fillOpacity: 0.95,
        weight: 2,
      }).addTo(lg)

      // Station Tooltip on Hover
      circle.bindTooltip(
        `<strong>${stop.stop_name}</strong><br/><span style="font-size: 10px; color: #7A7269;">Zone ${stop.zone_id} ${isInterchange ? '• Major Hub' : ''}</span>`,
        { direction: 'top', offset: [0, -6] }
      )

      // Connected line badges HTML
      const lineBadges = isRajiv
        ? '<span style="background: #0072CE; color: #FFF; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">Blue Line</span> <span style="background: #E5A800; color: #FFF; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">Yellow Line</span>'
        : isKashmere
        ? '<span style="background: #E31B23; color: #FFF; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">Red Line</span> <span style="background: #E5A800; color: #FFF; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">Yellow Line</span> <span style="background: #8A2BE2; color: #FFF; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">Violet Line</span>'
        : stop.stop_id === 'S04'
        ? '<span style="background: #E5A800; color: #FFF; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">Yellow Line</span> <span style="background: #FF6F00; color: #FFF; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">Airport Express</span>'
        : '<span style="background: #1A2E3B; color: #FFF; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">DMRC Network</span>'

      // Station Popup on Click
      const popupHtml = `
        <div style="font-family: 'Manrope', -apple-system, sans-serif; min-width: 220px;">
          <div style="font-size: 10px; font-weight: 800; color: #C49A43; text-transform: uppercase; letter-spacing: 0.5px;">
            ${isInterchange ? 'Major Interchange Hub' : 'Delhi Transit Station'} • Zone ${stop.zone_id}
          </div>
          <div style="font-size: 15px; font-weight: 800; color: #1A2E3B; margin-top: 3px;">
            ${stop.stop_name}
          </div>
          <div style="margin-top: 6px; display: flex; gap: 4px; flex-wrap: wrap;">
            ${lineBadges}
          </div>
          <div style="font-size: 11px; color: #2E7D32; font-weight: 700; margin-top: 6px; display: flex; align-items: center; gap: 4px;">
            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #2E7D32;"></span>
            Operating normally • Next train in 2 min
          </div>
          <div style="display: flex; gap: 6px; margin-top: 10px; border-top: 1px solid #EBE5DC; padding-top: 8px;">
            <button onclick="window.__selectOrigin && window.__selectOrigin('${stop.stop_id}')" style="flex: 1; padding: 6px 8px; font-size: 11px; font-weight: 800; background: #FAF0D9; color: #9A721C; border: 1px solid #E8D4AE; border-radius: 8px; cursor: pointer;">
              Set Origin
            </button>
            <button onclick="window.__selectDest && window.__selectDest('${stop.stop_id}')" style="flex: 1; padding: 6px 8px; font-size: 11px; font-weight: 800; background: #1A2E3B; color: #FFFFFF; border: none; border-radius: 8px; cursor: pointer;">
              Set Destination
            </button>
          </div>
        </div>
      `
      circle.bindPopup(popupHtml)
    })    // 3. DYNAMIC ACTIVE ROUTE & JOURNEY RENDERING
    const activeJourney = selectedJourney
    const allJourneyCoords: [number, number][] = []

    // Helper to find coords for a stop id
    const getStopCoord = (stopId?: string): [number, number] | null => {
      if (!stopId) return null
      const s = stops.find(st => st.stop_id === stopId)
      if (s && isValidCoord(s.stop_lat, s.stop_lon)) {
        return [s.stop_lat, s.stop_lon]
      }
      return null
    }

    const getStopName = (stopId?: string): string => {
      if (!stopId) return ''
      const s = stops.find(st => st.stop_id === stopId)
      return s ? s.stop_name : stopId
    }

    if (activeJourney && activeJourney.legs && activeJourney.legs.length > 0) {
      // Render each leg of the journey with matching transit colors
      activeJourney.legs.forEach((leg, index) => {
        const boardCoord = getStopCoord(leg.board_stop_id)
        const alightCoord = getStopCoord(leg.alight_stop_id)

        if (!boardCoord || !alightCoord) return

        // Build path: board -> intermediate stops -> alight
        const legPath: [number, number][] = [boardCoord]

        if (leg.intermediate_stop_ids && leg.intermediate_stop_ids.length > 0) {
          leg.intermediate_stop_ids.forEach(intId => {
            const intCoord = getStopCoord(intId)
            if (intCoord) legPath.push(intCoord)
          })
        }
        legPath.push(alightCoord)
        legPath.forEach(c => allJourneyCoords.push(c))

        const isBus = leg.route_type === 'bus' || leg.route_name.toLowerCase().includes('bus')
        const color = isBus ? '#1D4ED8' : (leg.route_color || '#0070BA')

        // Outer white casing for crisp visibility
        L.polyline(legPath, {
          color: '#FFFFFF',
          weight: 9,
          opacity: 0.95,
        }).addTo(lg)

        // Inner vibrant mode line
        L.polyline(legPath, {
          color,
          weight: 5.5,
          opacity: 1.0,
        }).addTo(lg)

        // Flow dashed inner animation
        L.polyline(legPath, {
          color: isBus ? '#BFDBFE' : '#BAE6FD',
          weight: 2,
          opacity: 0.85,
          dashArray: '8, 12',
          className: 'delhi-path-flow',
        }).addTo(lg)

        // Transfer badge between legs
        if (index > 0) {
          const transferStopName = getStopName(leg.board_stop_id)
          const transferIcon = L.divIcon({
            className: 'delhi-pin-transfer',
            html: `
              <div style="position: absolute; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 6px; pointer-events: auto;">
                <div style="background: #0284C7; color: #FFFFFF; padding: 4px 11px; border-radius: 20px; font-size: 11px; font-weight: 800; border: 2px solid #FFFFFF; white-space: nowrap; box-shadow: 0 4px 14px rgba(2,132,199,0.45); display: flex; align-items: center; gap: 5px;">
                  <span style="font-size: 11px;">⇄</span>
                  <span>${transferStopName.toUpperCase()} • transfer</span>
                </div>
              </div>
            `,
            iconSize: [0, 0],
          })
          L.marker(boardCoord, { icon: transferIcon }).addTo(lg)
        }
      })

      // Origin Hero Pin
      const firstLeg = activeJourney.legs[0]
      const originCoord = getStopCoord(firstLeg.board_stop_id) || getStopCoord(originStopId)
      const originLabel = getStopName(firstLeg.board_stop_id) || getStopName(originStopId) || 'ORIGIN'

      if (originCoord) {
        allJourneyCoords.push(originCoord)
        const originIcon = L.divIcon({
          className: 'delhi-pin-origin',
          html: `
            <div style="position: absolute; transform: translate(-50%, -100%); margin-top: -6px; pointer-events: auto;">
              <div style="background-color: #B45309; color: #FFFFFF; padding: 5px 12px; border-radius: 20px; font-weight: 800; font-size: 11px; letter-spacing: 0.5px; box-shadow: 0 4px 16px rgba(180,83,9,0.45); white-space: nowrap; border: 2px solid #FFFFFF; display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 10px; background: rgba(255,255,255,0.25); border-radius: 50%; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center;">●</span>
                <span>${originLabel.toUpperCase()}</span>
              </div>
            </div>
          `,
          iconSize: [0, 0],
        })
        L.marker(originCoord, { icon: originIcon }).addTo(lg)
      }

      // Destination Hero Pin
      const lastLeg = activeJourney.legs[activeJourney.legs.length - 1]
      const destCoord = getStopCoord(lastLeg.alight_stop_id) || getStopCoord(destinationStopId)
      const destLabel = getStopName(lastLeg.alight_stop_id) || getStopName(destinationStopId) || 'DESTINATION'

      if (destCoord) {
        allJourneyCoords.push(destCoord)
        const destIcon = L.divIcon({
          className: 'delhi-pin-dest',
          html: `
            <div style="position: absolute; transform: translate(-50%, -100%); margin-top: -6px; pointer-events: auto;">
              <div style="background-color: #1A2E3B; color: #FFFFFF; padding: 5px 12px; border-radius: 20px; font-weight: 800; font-size: 11px; letter-spacing: 0.5px; box-shadow: 0 4px 16px rgba(26,46,59,0.5); white-space: nowrap; border: 2px solid #FFFFFF; display: flex; align-items: center; gap: 6px;">
                <span style="color: #E11D48; font-size: 12px;">●</span>
                <span>${destLabel.toUpperCase()}</span>
              </div>
            </div>
          `,
          iconSize: [0, 0],
        })
        L.marker(destCoord, { icon: destIcon }).addTo(lg)
      }

      // Automatically frame map around active journey
      if (allJourneyCoords.length > 0 && mapRef.current) {
        try {
          mapRef.current.fitBounds(L.latLngBounds(allJourneyCoords), {
            padding: [60, 60],
            maxZoom: 13,
            animate: true,
            duration: 0.8,
          })
        } catch {}
      }
    }
  }, [
    stops,
    selectedJourney,
    originStopId,
    destinationStopId,
    showMetro,
    showBus,
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
    mapRef.current.setView([28.615, 77.215], 11, { animate: true })
  }

  // Jump to specific landmark
  const handleFlyToCoord = (coord: [number, number], zoom = 14) => {
    if (!mapRef.current) return
    mapRef.current.flyTo(coord, zoom, { duration: 1.2 })
  }

  const filteredSearchStops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return stops.filter(s => {
      const meta = DELHI_STATION_METADATA[s.stop_id]
      const nameMatch = s.stop_name.toLowerCase().includes(q)
      const landmarkMatch = meta?.landmark?.toLowerCase().includes(q)
      const lineMatch = meta?.interchanges?.some(i => i.toLowerCase().includes(q))
      return nameMatch || landmarkMatch || lineMatch
    }).slice(0, 8)
  }, [stops, searchQuery])

  const handleSelectSearchStop = (stop: Stop, type: 'destination' | 'origin' = 'destination') => {
    setSearchQuery('')
    setShowSearchResults(false)
    if (mapRef.current && isValidCoord(stop.stop_lat, stop.stop_lon)) {
      mapRef.current.flyTo([stop.stop_lat, stop.stop_lon], 14, {
        duration: 1.2,
      })
    }
    if (type === 'origin') {
      if (onSelectOrigin) onSelectOrigin(stop.stop_id)
      else window.dispatchEvent(new CustomEvent('aaroh_station_select', { detail: { stopId: stop.stop_id, type: 'origin' } }))
    } else {
      if (onSelectDestination) onSelectDestination(stop.stop_id)
      else window.dispatchEvent(new CustomEvent('aaroh_station_select', { detail: { stopId: stop.stop_id, type: 'destination' } }))
    }
  }

  return (
    <figure
      role="region"
      aria-label="Interactive Delhi Transit Map"
      className={`overflow-hidden rounded-2xl border border-[#EBE5DC] bg-white shadow-xs relative flex flex-col h-full min-h-[500px] lg:min-h-[660px] animate-fade-in map-tiles-${mapStyle}`}
    >
      <figcaption className="sr-only">
        Geographic map representing Delhi transit multimodal network
      </figcaption>

      {/* Floating Top HUD Bar (Search + Mode Filter Chips + Quick Station Pills matching Target) */}
      <div className="absolute top-3 left-3 right-3 z-[500] flex flex-col gap-2 pointer-events-none">
        {/* Row 1: Search Bar & Mode Filter Chips */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Search Bar */}
          <div ref={mapSearchRef} className="relative flex-1 min-w-[150px] max-w-sm pointer-events-auto">
            <div className="flex items-center rounded-2xl border border-[#EDE8E1] bg-white/95 px-3 py-1.5 sm:py-2 shadow-md backdrop-blur-md transition-colors focus-within:border-[#C49A43] focus-within:ring-2 focus-within:ring-[#C49A43]/20">
              <SearchIcon className="w-4 h-4 text-[#C49A43] mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setShowSearchResults(true)
                }}
                onFocus={() => setShowSearchResults(true)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (filteredSearchStops.length > 0) {
                      handleSelectSearchStop(filteredSearchStops[0], 'destination')
                    }
                  } else if (e.key === 'Escape') {
                    setShowSearchResults(false)
                  }
                }}
                placeholder="Search station or landmark (e.g. Dwarka, Noida)..."
                aria-label="Search Delhi transit stops"
                className="w-full bg-transparent text-xs sm:text-[13px] font-semibold text-[#1A202C] placeholder-[#7A7269] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setShowSearchResults(false)
                  }}
                  className="text-[#7A7269] hover:text-[#1A202C] p-0.5 cursor-pointer text-xs"
                  aria-label="Clear map search"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {showSearchResults && filteredSearchStops.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-[#EDE8E1] bg-white shadow-2xl z-[501] divide-y divide-[#EDE8E1]/60 scrollbar-thin p-1.5 animate-fade-in">
                <div className="px-2 py-1 text-[10px] font-bold text-[#A1988B] uppercase tracking-wider flex justify-between items-center">
                  <span>Matching Stations</span>
                  <span>{filteredSearchStops.length} Found</span>
                </div>
                {filteredSearchStops.map(s => {
                  const meta = DELHI_STATION_METADATA[s.stop_id]
                  const lines = meta?.interchanges?.slice(0, 2).join(' • ') || 'DMRC Network'

                  return (
                    <div
                      key={s.stop_id}
                      onClick={() => handleSelectSearchStop(s, 'destination')}
                      className="flex items-center justify-between p-2 rounded-xl text-xs hover:bg-[#FAF7F2] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-6 h-6 rounded-lg bg-[#FAF0D9] text-[#9A721C] flex items-center justify-center shrink-0 group-hover:bg-[#C49A43] group-hover:text-white transition-colors">
                          <TrainIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[#1A202C] truncate">{s.stop_name}</div>
                          <div className="text-[10px] text-[#7A7269] truncate">Zone {s.zone_id} • {lines}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            handleSelectSearchStop(s, 'origin')
                          }}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FAF0D9] text-[#9A721C] hover:bg-[#F2E5C9] transition-colors cursor-pointer"
                          title="Set as Origin"
                        >
                          From
                        </button>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            handleSelectSearchStop(s, 'destination')
                          }}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1A2E3B] text-white hover:bg-[#253D4E] transition-colors cursor-pointer"
                          title="Set as Destination"
                        >
                          To →
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Mode Filter Chips matching Target (Metro pink, Bus blue, Both green, EV purple) */}
          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto overflow-x-auto scrollbar-none py-0.5 shrink-0 max-w-full">
            <button
              type="button"
              onClick={() => {
                setShowMetro(true)
                setShowBus(false)
              }}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold border transition-all cursor-pointer shadow-xs shrink-0 ${
                showMetro && !showBus
                  ? 'bg-[#E11D48] text-white border-[#E11D48]'
                  : 'bg-[#FCE7F3] text-[#BE185D] border-[#FBCFE8] hover:bg-[#FBCFE8]'
              }`}
            >
              <TrainIcon className="w-3.5 h-3.5" />
              <span>Metro</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowBus(true)
                setShowMetro(false)
              }}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold border transition-all cursor-pointer shadow-xs shrink-0 ${
                showBus && !showMetro
                  ? 'bg-[#0284C7] text-white border-[#0284C7]'
                  : 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD] hover:bg-[#BAE6FD]'
              }`}
            >
              <BusIcon className="w-3.5 h-3.5" />
              <span>Bus</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowMetro(true)
                setShowBus(true)
              }}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold border transition-all cursor-pointer shadow-xs shrink-0 ${
                showMetro && showBus
                  ? 'bg-[#1E4D2B] text-white border-[#1E4D2B] shadow-sm'
                  : 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]'
              }`}
            >
              <CheckIcon className="w-3.5 h-3.5" />
              <span>Both</span>
            </button>

            <button
              type="button"
              onClick={handleFitRoute}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-white text-[#1A2E3B] border border-[#EDE8E1] hover:bg-[#FAF7F2] transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <span>Fit Route</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bottom HUD Controls (Legend & Layer Switchers - Responsive, Non-Overlapping) */}
      <div className="absolute bottom-3.5 left-3.5 right-3.5 z-[500] flex items-center justify-between gap-2 pointer-events-none flex-wrap">
        {/* Legend */}
        <div className="flex items-center gap-2.5 sm:gap-3 rounded-full border border-[#EDE8E1] bg-white/95 px-3 sm:px-4 py-1.5 shadow-md backdrop-blur-md pointer-events-auto text-[11px] sm:text-xs font-bold text-[#1A2E3B] overflow-x-auto scrollbar-none max-w-full">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="h-2.5 w-2.5 rounded-full bg-[#8B5CF6] inline-block" />
            <span>Metro Line</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0284C7] inline-block" />
            <span>Bus Route</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 hidden sm:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1E293B] inline-block" />
            <span>Airport</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="h-2.5 w-2.5 rounded-full bg-[#C49A43] inline-block" />
            <span>Your Route</span>
          </div>
        </div>

        {/* Map / Satellite & Zoom Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto shrink-0 ml-auto">
          {/* Map / Satellite Toggle Pill */}
          <div className="flex rounded-full bg-white border border-[#EDE8E1] p-0.5 sm:p-1 shadow-md">
            <button
              type="button"
              onClick={() => setMapStyle('sandstone')}
              className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
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
              className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                mapStyle === 'satellite'
                  ? 'bg-[#1A2E3B] text-white shadow-2xs'
                  : 'text-[#6E665D] hover:text-[#1A2E3B]'
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Locate / Recenter button */}
          <button
            type="button"
            onClick={handleFitRoute}
            title="Locate Route"
            aria-label="Locate active route"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-2xl border border-[#EDE8E1] bg-white text-[#1A2E3B] hover:bg-[#FAF7F2] shadow-md transition-all cursor-pointer active:scale-95"
          >
            <NavigationIcon className="w-4 h-4 text-[#1A2E3B]" />
          </button>

          {/* Zoom Out (-) Button */}
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            title="Zoom Out"
            aria-label="Zoom Out"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-2xl border border-[#EDE8E1] bg-white text-[#1A2E3B] font-bold text-base hover:bg-[#FAF7F2] shadow-md transition-all cursor-pointer active:scale-95"
          >
            <span>—</span>
          </button>

          {/* Layers Thumbnail Button */}
          <button
            type="button"
            onClick={() => setMapStyle(prev => (prev === 'satellite' ? 'sandstone' : 'satellite'))}
            title="Toggle Satellite Imagery"
            aria-label="Toggle Satellite Imagery"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-2xl border border-[#EDE8E1] bg-white overflow-hidden shadow-md transition-all cursor-pointer hover:border-[#C49A43] active:scale-95"
          >
            <LayersIcon className="w-4 h-4 text-[#1A2E3B]" />
          </button>
        </div>
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
