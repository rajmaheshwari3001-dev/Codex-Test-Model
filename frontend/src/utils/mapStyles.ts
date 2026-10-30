export type MapStyle =
  | 'hot'
  | 'gray'
  | 'dark'
  | 'streets'
  | 'satellite'
  | 'topo'
  | 'cyclosm'
  | 'natgeo'
  | 'osm'
  | 'opentopo'
  | 'voyager'    // Legacy alias mapped to 'hot'
  | 'sandstone'  // Legacy alias mapped to 'hot'
  | 'positron'   // Legacy alias mapped to 'gray'
  | 'dark_gray'  // Legacy alias mapped to 'dark'

export interface MapStyleConfig {
  id: MapStyle
  name: string
  engine: string
  category: 'apple' | 'satellite' | 'transit'
  tagline: string
  badge: string
  swatchBg: string
  url: string
  attribution: string
  maxZoom: number
  subdomains: string
}

export const MAP_STYLES_CATALOG: MapStyleConfig[] = [
  {
    id: 'hot',
    name: 'Apple Pastel (Humanitarian)',
    engine: 'OSM Humanitarian CDN',
    category: 'apple',
    tagline: 'Apple Maps pastel aesthetic with soft green parks, warm cream roads & zero watermarks.',
    badge: 'Apple Style',
    swatchBg: 'from-[#E0F2FE] via-[#BAE6FD] to-[#38BDF8]',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors, Humanitarian OSM Team',
    maxZoom: 19,
    subdomains: 'abc',
  },
  {
    id: 'gray',
    name: 'Apple Minimal (Light Gray)',
    engine: 'Esri Canvas Light',
    category: 'apple',
    tagline: 'Ultra-clean Apple monochrome light canvas with maximum transit route contrast.',
    badge: 'Clean Vector',
    swatchBg: 'from-[#F8FAFC] via-[#E2E8F0] to-[#CBD5E1]',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, HERE, Garmin',
    maxZoom: 16,
    subdomains: 'abc',
  },
  {
    id: 'dark',
    name: 'Apple Midnight (Dark Slate)',
    engine: 'Esri Canvas Dark',
    category: 'apple',
    tagline: 'Pure obsidian dark mode where neon Delhi Metro lines glow with zero watermarks.',
    badge: 'Night Mode',
    swatchBg: 'from-[#0F172A] via-[#1E293B] to-[#334155]',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, DeLorme, NAVTEQ',
    maxZoom: 16,
    subdomains: 'abc',
  },
  {
    id: 'streets',
    name: 'World Street Navigation',
    engine: 'Esri World Streets',
    category: 'satellite',
    tagline: 'High-detail turn-by-turn arterial clarity, flyovers, and highways.',
    badge: 'Navigation',
    swatchBg: 'from-[#FEF3C7] via-[#FDE68A] to-[#F59E0B]',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, HERE, Garmin',
    maxZoom: 19,
    subdomains: 'abc',
  },
  {
    id: 'satellite',
    name: 'Photoreal Aerial Satellite',
    engine: 'Esri World Imagery',
    category: 'satellite',
    tagline: 'High-resolution aerial satellite photography across Delhi NCR & Yamuna.',
    badge: 'Photoreal',
    swatchBg: 'from-[#064E3B] via-[#047857] to-[#10B981]',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
    subdomains: 'abc',
  },
  {
    id: 'topo',
    name: 'Delhi Topographic',
    engine: 'Esri World Topo',
    category: 'satellite',
    tagline: 'Contour elevations, Delhi Ridge green belt, and terrain relief.',
    badge: 'Topographic',
    swatchBg: 'from-[#DCFCE7] via-[#BBF7D0] to-[#22C55E]',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, USGS, FAO',
    maxZoom: 19,
    subdomains: 'abc',
  },
  {
    id: 'cyclosm',
    name: 'Urban Transit & Mobility',
    engine: 'CyclOSM Fast CDN',
    category: 'transit',
    tagline: 'Dedicated urban mobility, bus priority corridors, and pedestrian paths.',
    badge: 'Mobility',
    swatchBg: 'from-[#DCFCE7] via-[#86EFAC] to-[#16A34A]',
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors, CyclOSM',
    maxZoom: 19,
    subdomains: 'abc',
  },
  {
    id: 'natgeo',
    name: 'National Geographic',
    engine: 'Esri NatGeo',
    category: 'transit',
    tagline: 'Classic warm parchment cartography with landmark typography.',
    badge: 'Vintage',
    swatchBg: 'from-[#FEF3C7] via-[#FDE68A] to-[#D97706]',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; National Geographic, Esri',
    maxZoom: 16,
    subdomains: 'abc',
  },
  {
    id: 'osm',
    name: 'OpenStreetMap Standard',
    engine: 'OpenStreetMap Community',
    category: 'transit',
    tagline: 'Global crowdsourced base cartography with landmark labels.',
    badge: 'Community',
    swatchBg: 'from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8]',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    subdomains: 'abc',
  },
  {
    id: 'opentopo',
    name: 'OpenTopoMap Contours',
    engine: 'OpenTopoMap Global',
    category: 'transit',
    tagline: 'Crisp European topographic contours, hillshading, and rail corridors.',
    badge: 'Contours',
    swatchBg: 'from-[#FEF3C7] via-[#FDE68A] to-[#B45309]',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors, SRTM',
    maxZoom: 17,
    subdomains: 'abc',
  },
]
