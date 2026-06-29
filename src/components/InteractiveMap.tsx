/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Search, 
  Compass, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  Navigation, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  LayoutGrid,
  Eye,
  Info,
  Plus,
  Trash2,
  Crosshair,
  TrendingUp
} from 'lucide-react';
import { Issue, HotspotPrediction } from '../types';

interface InteractiveMapProps {
  issues: Issue[];
  hotspots: HotspotPrediction[];
  selectedIssueId: string | null;
  onSelectIssue: (id: string) => void;
  onSelectCoordinates: (lat: number, lng: number, locationName: string) => void;
  showHotspots: boolean;
}

// Bounding box of Chandigarh coordinates for consistent vector scaling
const BOUNDS = {
  minLat: 30.715,
  maxLat: 30.755,
  minLng: 76.755,
  maxLng: 76.800
};

const MAP_WIDTH = 800;
const MAP_HEIGHT = 500;

interface Sector {
  id: string;
  name: string;
  desc: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isCustom?: boolean;
  isPath?: boolean;
  d?: string;
}

const INITIAL_SECTORS: Sector[] = [
  // ROW 1 (Y: 15 to 70)
  { id: 'sec12', name: 'Sector 12', desc: 'PEC Institutional', x: 10, y: 15, width: 110, height: 55 },
  { id: 'sec10', name: 'Sector 10', desc: 'Leisure Valley', x: 130, y: 15, width: 110, height: 55 },
  { id: 'sec3', name: 'Sector 3', desc: 'Rock Garden Dist', x: 250, y: 15, width: 110, height: 55 },
  { id: 'sec1', name: 'Sector 1', desc: 'Capitol Complex', x: 370, y: 15, width: 190, height: 55 },
  { id: 'sec2', name: 'Sector 2', desc: 'Governor House', x: 570, y: 15, width: 210, height: 55 },

  // ROW 2 (Y: 80 to 155)
  { id: 'sec11', name: 'Sector 11', desc: 'PGIMER Hospital', x: 10, y: 80, width: 110, height: 75 },
  { id: 'sec15', name: 'Sector 15', desc: 'Student Residential', x: 130, y: 80, width: 110, height: 75 },
  { id: 'sec16', name: 'Sector 16', desc: 'Rose Garden District', x: 250, y: 80, width: 110, height: 75 },
  { id: 'sukhna', name: 'Sukhna Lake', desc: 'Conservation Area', x: 370, y: 80, width: 190, height: 75, isPath: true, d: "M 370,80 Q 465,50 560,80 T 560,150 Q 465,165 370,150 Z" },
  { id: 'sec4', name: 'Sector 4', desc: 'Forest / Lake Reserve', x: 570, y: 80, width: 210, height: 75 },

  // ROW 3 (Y: 165 to 240)
  { id: 'sec14', name: 'Sector 14', desc: 'Panjab University', x: 10, y: 165, width: 110, height: 75 },
  { id: 'sec24', name: 'Sector 24', desc: 'Residential Belt', x: 130, y: 165, width: 110, height: 75 },
  { id: 'sec17', name: 'Sector 17', desc: 'City Plaza Center', x: 250, y: 165, width: 110, height: 75 },
  { id: 'sec19', name: 'Sector 19', desc: 'East Residential', x: 370, y: 165, width: 190, height: 75 },
  { id: 'sec26', name: 'Sector 26', desc: 'Industrial / College', x: 570, y: 165, width: 210, height: 75 },

  // ROW 4 (Y: 250 to 325)
  { id: 'sec25', name: 'Sector 25', desc: 'West Institutional', x: 10, y: 250, width: 110, height: 75 },
  { id: 'sec23', name: 'Sector 23', desc: 'Civic Residential', x: 130, y: 250, width: 110, height: 75 },
  { id: 'sec22', name: 'Sector 22', desc: 'Commercial Market', x: 250, y: 250, width: 110, height: 75 },
  { id: 'sec21', name: 'Sector 21', desc: 'Green Belt Area', x: 370, y: 250, width: 190, height: 75 },
  { id: 'sec20', name: 'Sector 20', desc: 'Residential Block', x: 570, y: 250, width: 210, height: 75 },

  // ROW 5 (Y: 335 to 410)
  { id: 'sec36', name: 'Sector 36', desc: 'Fragrance Garden', x: 10, y: 335, width: 110, height: 75 },
  { id: 'sec35', name: 'Sector 35', desc: 'Hotel & Retail Hub', x: 130, y: 335, width: 110, height: 75 },
  { id: 'sec34', name: 'Sector 34', desc: 'Finance & Edu Hub', x: 250, y: 335, width: 110, height: 75 },
  { id: 'sec33', name: 'Sector 33', desc: 'Residential District', x: 370, y: 335, width: 190, height: 75 },
  { id: 'sec30', name: 'Sector 30', desc: 'Commercial & Living', x: 570, y: 335, width: 210, height: 75 },

  // ROW 6 (Y: 420 to 490)
  { id: 'sec43', name: 'Sector 43', desc: 'ISBT Bus Terminal', x: 10, y: 420, width: 110, height: 70 },
  { id: 'sec44', name: 'Sector 44', desc: 'Southern Residential', x: 130, y: 420, width: 110, height: 70 },
  { id: 'sec45', name: 'Sector 45', desc: 'Burail / Market Area', x: 250, y: 420, width: 110, height: 70 },
  { id: 'sec46', name: 'Sector 46', desc: 'Southern Belt', x: 370, y: 420, width: 190, height: 70 },
  { id: 'sec47', name: 'Sector 47', desc: 'Border Residential', x: 570, y: 420, width: 210, height: 70 },
];

export default function InteractiveMap({
  issues,
  hotspots,
  selectedIssueId,
  onSelectIssue,
  onSelectCoordinates,
  showHotspots
}: InteractiveMapProps) {
  const [activeTab, setActiveTab] = useState<'real' | 'blueprint'>('real');
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [geolocating, setGeolocating] = useState(false);
  const [hoveredIssue, setHoveredIssue] = useState<Issue | null>(null);
  const [hoveredHotspot, setHoveredHotspot] = useState<HotspotPrediction | null>(null);

  // --- SECTOR OBSERVATION STATS & MANAGEMENT ---
  const [sectors, setSectors] = useState<Sector[]>(INITIAL_SECTORS);
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [addingSector, setAddingSector] = useState(false);
  const [newSectorName, setNewSectorName] = useState('New Observation Zone');
  const [newSectorDesc, setNewSectorDesc] = useState('Custom monitoring sector');

  const handleDeleteSector = (id: string) => {
    setSectors(prev => prev.filter(s => s.id !== id));
    setSelectedSectorId(null);
  };

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const hotspotsLayerRef = useRef<any>(null);

  // --- COORDINATE TRANSLATORS FOR VECTOR BLUEPRINT ---
  const getSvgCoords = (lat: number, lng: number) => {
    const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * MAP_WIDTH;
    const y = (1 - (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * MAP_HEIGHT;
    return { x, y };
  };

  const getLatLngFromSvg = (x: number, y: number) => {
    const lng = BOUNDS.minLng + (x / MAP_WIDTH) * (BOUNDS.maxLng - BOUNDS.minLng);
    const lat = BOUNDS.minLat + (1 - y / MAP_HEIGHT) * (BOUNDS.maxLat - BOUNDS.minLat);
    return { lat, lng };
  };

  const isPointInSector = (lat: number, lng: number, sector: Sector) => {
    const { x, y } = getSvgCoords(lat, lng);
    return (
      x >= sector.x &&
      x <= sector.x + sector.width &&
      y >= sector.y &&
      y <= sector.y + sector.height
    );
  };

  // --- LEAFLET LOADER ---
  useEffect(() => {
    let isMounted = true;
    
    const loadLeafletResources = async () => {
      try {
        if ((window as any).L) {
          if (isMounted) setLeafletLoaded(true);
          return;
        }
        
        // Add Leaflet stylesheet
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }
        
        // Add Leaflet JS script
        if (!document.getElementById('leaflet-js')) {
          const script = document.createElement('script');
          script.id = 'leaflet-js';
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.async = true;
          script.onload = () => {
            if (isMounted) setLeafletLoaded(true);
          };
          script.onerror = () => {
            console.error('Failed to load Leaflet JS script.');
          };
          document.head.appendChild(script);
        } else {
          const checkInterval = setInterval(() => {
            if ((window as any).L) {
              clearInterval(checkInterval);
              if (isMounted) setLeafletLoaded(true);
            }
          }, 100);
        }
      } catch (err) {
        console.error('Error executing Leaflet loader', err);
      }
    };

    loadLeafletResources();
    return () => {
      isMounted = false;
    };
  }, []);

  // --- INITIALIZE REAL LEAFLET MAP ONCE ---
  useEffect(() => {
    if (!leafletLoaded || !(window as any).L || !mapRef.current) return;

    const L = (window as any).L;

    if (!mapInstanceRef.current) {
      // Create map instance centered in Chandigarh
      const map = L.map(mapRef.current, {
        center: [30.7333, 76.7794],
        zoom: 13,
        zoomControl: false
      });

      // CartoDB Voyager Tile Layer - beautiful clean street grid
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      // Custom zoom control placement
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Handle Map Clicks to drop pins
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          const addr = data.address;
          
          let road = addr?.road || addr?.suburb || addr?.neighbourhood || addr?.commercial || addr?.industrial;
          let city = addr?.city || addr?.town || addr?.village || addr?.suburb || addr?.state;
          let locationName = '';
          
          if (road && city) {
            locationName = `${road}, ${city}`;
          } else if (road) {
            locationName = road;
          } else if (city) {
            locationName = city;
          } else {
            locationName = `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          }
          
          onSelectCoordinates(Number(lat.toFixed(5)), Number(lng.toFixed(5)), locationName);
        } catch (err) {
          onSelectCoordinates(Number(lat.toFixed(5)), Number(lng.toFixed(5)), `Custom Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
      });

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
      hotspotsLayerRef.current = L.layerGroup().addTo(map);

      // Initial fit after a tiny delay for layout stabilization
      setTimeout(() => {
        map.invalidateSize();
        fitAllMarkers(map);
      }, 400);
    } else {
      // Map already exists, ensure size calculations are refreshed
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 100);
    }

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [leafletLoaded]);

  // --- INVALIDATE SIZE WHEN TAB SWITCHES TO 'REAL' ---
  useEffect(() => {
    if (activeTab === 'real' && mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 50);
    }
  }, [activeTab]);

  // --- AUTOMATICALLY FIT ALL MARKERS TO AVOID CUTTING OFF ---
  const fitAllMarkers = (mapParam?: any) => {
    const map = mapParam || mapInstanceRef.current;
    if (!map || !(window as any).L || issues.length === 0) return;

    const L = (window as any).L;
    const points: any[] = [];
    
    issues.forEach(i => {
      if (i.latitude && i.longitude) {
        points.push([i.latitude, i.longitude]);
      }
    });

    if (showHotspots) {
      hotspots.forEach(h => {
        if (h.latitude && h.longitude) {
          points.push([h.latitude, h.longitude]);
        }
      });
    }

    if (points.length > 0) {
      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      } catch (err) {
        console.warn('Could not fit bounds', err);
      }
    }
  };

  // --- INTERACTIVE PIN SYNCHRONIZER FOR LEAFLET ---
  useEffect(() => {
    if (activeTab !== 'real' || !leafletLoaded || !mapInstanceRef.current || !markersLayerRef.current || !hotspotsLayerRef.current) return;

    const L = (window as any).L;
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const hotspotsLayer = hotspotsLayerRef.current;

    markersLayer.clearLayers();
    hotspotsLayer.clearLayers();

    // 1. Plot issues as interactive pins
    issues.forEach((issue) => {
      const isSelected = selectedIssueId === issue.id;
      
      let badgeColor = 'bg-blue-500';
      if (issue.status === 'verified') badgeColor = 'bg-amber-500';
      if (issue.status === 'in_progress') badgeColor = 'bg-indigo-500';
      if (issue.status === 'resolved') badgeColor = 'bg-emerald-500';

      const markerHtml = `
        <div class="relative flex items-center justify-center">
          ${isSelected ? `
            <div class="absolute -inset-2 w-8 h-8 rounded-full bg-indigo-500/40 animate-ping"></div>
          ` : ''}
          <div class="w-7 h-7 rounded-full flex items-center justify-center border border-white text-white shadow-md ${badgeColor} hover:scale-110 transition-transform duration-150">
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([issue.latitude, issue.longitude], { icon })
        .addTo(markersLayer);

      marker.on('click', (e: any) => {
        L.DomEvent.stopPropagation(e);
        onSelectIssue(issue.id);
      });

      marker.bindTooltip(`
        <div class="px-2.5 py-1.5 text-[11px] font-sans rounded-lg bg-slate-900 text-white shadow border border-slate-800">
          <div class="font-bold leading-tight truncate">${issue.title}</div>
          <div class="text-[9px] text-slate-300 mt-0.5">${issue.locationName}</div>
        </div>
      `, { direction: 'top', offset: [0, -10], opacity: 0.95 });

      if (isSelected) {
        map.setView([issue.latitude, issue.longitude], 15, { animate: true });
      }
    });

    // 2. Plot predictive hotspots
    if (showHotspots) {
      hotspots.forEach((hs) => {
        L.circle([hs.latitude, hs.longitude], {
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.12,
          radius: 200 + hs.riskScore * 1.5,
          weight: 1.5,
          dashArray: '3, 4'
        })
        .bindTooltip(`
          <div class="px-2 py-1 text-[11px] font-sans">
            <div class="font-bold text-rose-500 uppercase tracking-wider text-[9px]">⚠️ PREDICTIVE RISK ZONE</div>
            <div class="font-semibold text-slate-900 mt-0.5">${hs.title}</div>
            <div class="text-[9px] text-slate-500 mt-0.5">Failure Risk: <strong>${hs.riskScore}%</strong></div>
          </div>
        `, { sticky: true })
        .addTo(hotspotsLayer);
      });
    }
  }, [leafletLoaded, issues, selectedIssueId, showHotspots, hotspots, activeTab]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // --- REAL MAP SEARCH FLOW ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    setSearching(true);
    setSearchError('');
    try {
      const formattedQuery = searchQuery.toLowerCase().includes('india') || searchQuery.toLowerCase().includes('chandigarh')
        ? searchQuery
        : `${searchQuery}, Chandigarh`;

      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formattedQuery)}&limit=1`);
      const results = await response.json();

      if (results && results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const latitude = Number(lat);
        const longitude = Number(lon);

        mapInstanceRef.current.setView([latitude, longitude], 15, { animate: true });
        onSelectCoordinates(latitude, longitude, display_name);
      } else {
        setSearchError('Location not found in sector bounds.');
      }
    } catch (err) {
      setSearchError('Search service offline.');
    } finally {
      setSearching(false);
    }
  };

  // --- GPS USER GEOLOCATE ---
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) {
      alert('Your browser does not support GPS Geolocation.');
      return;
    }

    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current.setView([latitude, longitude], 15, { animate: true });

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const display_name = data.display_name || `Local Coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          onSelectCoordinates(Number(latitude.toFixed(5)), Number(longitude.toFixed(5)), display_name);
        } catch (e) {
          onSelectCoordinates(Number(latitude.toFixed(5)), Number(longitude.toFixed(5)), `My Location`);
        }
        setGeolocating(false);
      },
      () => {
        setGeolocating(false);
        alert('Could not determine your GPS location.');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // --- VECTOR BLUEPRINT INTERACTIVE CLICK ---
  const handleBlueprintClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * MAP_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * MAP_HEIGHT;

    const { lat, lng } = getLatLngFromSvg(x, y);

    if (addingSector) {
      const newSec: Sector = {
        id: 'custom_' + Date.now(),
        name: newSectorName || 'Custom Zone',
        desc: newSectorDesc || 'Custom monitoring sector',
        x: Math.max(20, Math.min(MAP_WIDTH - 140, x - 60)), // center it around click
        y: Math.max(20, Math.min(MAP_HEIGHT - 110, y - 50)),
        width: 120,
        height: 100,
        isCustom: true
      };

      setSectors(prev => [...prev, newSec]);
      setSelectedSectorId(newSec.id);
      setAddingSector(false);
      setNewSectorName('New Observation Zone');
      setNewSectorDesc('Custom monitoring sector');
      return;
    }

    // Check if clicked inside a sector
    const clickedSector = sectors.find(sec => 
      x >= sec.x && x <= sec.x + sec.width &&
      y >= sec.y && y <= sec.y + sec.height
    );

    if (clickedSector) {
      setSelectedSectorId(clickedSector.id);
      const sectorCenterSvgX = clickedSector.x + clickedSector.width / 2;
      const sectorCenterSvgY = clickedSector.y + clickedSector.height / 2;
      const centerCoords = getLatLngFromSvg(sectorCenterSvgX, sectorCenterSvgY);
      onSelectCoordinates(
        Number(centerCoords.lat.toFixed(5)), 
        Number(centerCoords.lng.toFixed(5)), 
        `${clickedSector.name} (${clickedSector.desc})`
      );
      return;
    }
    
    // Categorize which sector was clicked for an elegant label
    let sectorName = 'Chandigarh City Area';

    onSelectCoordinates(Number(lat.toFixed(5)), Number(lng.toFixed(5)), `${sectorName} (Grid Node)`);
  };

  return (
    <div className="relative border border-slate-200 bg-slate-900 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[590px]" id="spatial-view-enclosure">
      
      {/* Tab Control Header */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between z-20">
        <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('real')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'real' 
                ? 'bg-slate-800 text-indigo-400 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            🌐 Live GIS Map
          </button>
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'blueprint' 
                ? 'bg-slate-800 text-teal-400 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-teal-500" />
            📐 Blueprint Grid
          </button>
        </div>

        {/* Dynamic Context Panel */}
        <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          {activeTab === 'real' ? (
            <span>Active WebGL Map Engine with auto-scaling street limits.</span>
          ) : (
            <span>Hyperlocal Vector Grid: showing offline sector layouts.</span>
          )}
        </div>
      </div>

      {/* --- TAB 1: REAL-WORLD MAP VIEW (LEAFLET) --- */}
      <div className={`relative flex-grow h-full ${activeTab === 'real' ? '' : 'hidden'}`} id="real-leaflet-panel">
          {!leafletLoaded && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900 text-slate-100 gap-2">
              <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
              <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                Loading Vector Map Framework...
              </div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full z-10" id="leaflet-map-element" />

          {/* Floating Action Bars */}
          <div className="absolute top-4 left-4 z-20 w-80 max-w-[calc(100%-2rem)]">
            <form onSubmit={handleSearch} className="flex gap-1.5 bg-white p-1.5 rounded-xl shadow-lg border border-slate-200">
              <div className="relative flex-grow">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find street, sector, location..."
                  className="w-full pl-8 pr-2 py-1.5 bg-slate-50 rounded-lg outline-none text-xs text-slate-800"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="px-3 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Find
              </button>
            </form>
            {searchError && (
              <div className="mt-1.5 bg-rose-50 border border-rose-100 text-rose-800 px-3 py-1 rounded-lg text-[9px] font-semibold flex items-center gap-1 shadow-sm">
                <AlertCircle className="w-3 h-3 text-rose-500" />
                <span>{searchError}</span>
              </div>
            )}
          </div>

          {/* Floating Control Buttons */}
          <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-2">
            <button
              onClick={() => fitAllMarkers()}
              className="p-2.5 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center gap-1 text-xs font-semibold"
              title="Fit Screen to see all issues"
            >
              <Compass className="w-4 h-4 text-indigo-500" />
              <span className="font-mono text-[10px] text-slate-800">Auto-Fit View</span>
            </button>
            <button
              onClick={handleLocateMe}
              disabled={geolocating}
              className="p-2.5 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 rounded-xl shadow-md active:scale-95 transition cursor-pointer flex items-center justify-center"
              title="Locate my GPS position"
            >
              {geolocating ? (
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
              ) : (
                <Navigation className="w-4 h-4 text-slate-800" />
              )}
            </button>
          </div>

          {/* Map Scale Legend */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-900/95 backdrop-blur-sm px-3 py-2.5 rounded-xl text-[9px] text-slate-300 font-mono border border-slate-800 shadow-md">
            <div className="flex items-center gap-1 text-white font-extrabold uppercase border-b border-slate-800 pb-1 mb-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Active GIS Map
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse"></span>
              <span>Reported</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              <span>Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>Resolved</span>
            </div>
          </div>
        </div>

      {/* --- TAB 2: OFFLINE VECTOR BLUEPRINT SNAPSHOT VIEW (SVG) --- */}
      <div className={`relative flex-grow bg-slate-950 flex flex-col lg:flex-row select-none h-full overflow-hidden ${activeTab === 'blueprint' ? '' : 'hidden'}`} id="blueprint-vector-panel">
          
          {/* Left Panel: Grid Map Visualizer */}
          <div className="flex-grow flex flex-col items-center justify-center relative p-3 min-h-[300px] lg:min-h-0 overflow-hidden">
            {/* Header Panel */}
            <div className="absolute top-4 left-4 z-10 font-mono text-slate-500 text-[9px] flex flex-col gap-0.5 pointer-events-none">
              <span className="text-teal-400 font-extrabold tracking-widest text-[10px]">CHANDIGARH DISTRICT GRID</span>
              <span>SCALE: 1:15,000 | OFF-LINE BLUEPRINT SNAPSHOT</span>
              <span>MIN LAT: {BOUNDS.minLat} | MAX LAT: {BOUNDS.maxLat}</span>
            </div>

            {/* Interactive Legend */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-1 bg-slate-900/80 border border-slate-800 p-2 rounded-lg font-mono text-[9px] text-slate-400 pointer-events-none">
              <span className="text-white font-bold mb-0.5">BLUEPRINT LEGEND</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Reported</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                <span>Verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span>Resolved</span>
              </div>
              {showHotspots && (
                <div className="flex items-center gap-1.5 text-rose-400 font-semibold border-t border-slate-800 pt-1 mt-1">
                  <span className="w-2 h-2 bg-rose-600 rounded-full animate-pulse"></span>
                  <span>AI Risk Zone</span>
                </div>
              )}
            </div>

            {/* Vector Schematic SVG Container */}
            <svg 
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} 
              className="w-full h-full max-h-[440px] border border-dashed border-slate-800/80 rounded-xl bg-slate-950/80 cursor-crosshair relative"
              onClick={handleBlueprintClick}
            >
              {/* 1. Fine Background Matrix Dots */}
              <defs>
                <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="0.75" fill="rgba(51, 65, 85, 0.2)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gridPattern)" />

              {/* 2. Grid Lines (Sectors Alignments) */}
              <g opacity="0.15" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="0.5">
                <line x1="125" y1="0" x2="125" y2="500" strokeDasharray="3, 3" />
                <line x1="245" y1="0" x2="245" y2="500" strokeDasharray="3, 3" />
                <line x1="365" y1="0" x2="365" y2="500" strokeDasharray="3, 3" />
                <line x1="565" y1="0" x2="565" y2="500" strokeDasharray="3, 3" />

                <line x1="0" y1="75" x2="800" y2="75" strokeDasharray="3, 3" />
                <line x1="0" y1="160" x2="800" y2="160" strokeDasharray="3, 3" />
                <line x1="0" y1="245" x2="800" y2="245" strokeDasharray="3, 3" />
                <line x1="0" y1="330" x2="800" y2="330" strokeDasharray="3, 3" />
                <line x1="0" y1="415" x2="800" y2="415" strokeDasharray="3, 3" />
              </g>

              {/* 3. Chandigarh Major Road Vectors */}
              <g stroke="rgba(14, 116, 144, 0.25)" strokeWidth="3" strokeLinecap="round">
                {/* Madhya Marg */}
                <line x1="10" y1="160" x2="790" y2="160" />
                {/* Dakshin Marg */}
                <line x1="10" y1="330" x2="790" y2="330" />
                {/* Jan Marg */}
                <line x1="245" y1="15" x2="245" y2="485" />
                {/* Himalaya Marg */}
                <line x1="365" y1="15" x2="365" y2="485" />
              </g>

              {/* Road Labels (Rotated) */}
              <g fill="rgba(148, 163, 184, 0.35)" fontSize="8" fontFamily="monospace">
                <text x="60" y="154">MADHYA MARG</text>
                <text x="60" y="324">DAKSHIN MARG</text>
                <text x="250" y="30" transform="rotate(90 250 30)">JAN MARG</text>
                <text x="370" y="30" transform="rotate(90 370 30)">HIMALAYA MARG</text>
              </g>

              {/* 4. Schematic City Sector Rectangles */}
              <g strokeWidth="1">
                {sectors.map((sector) => {
                  const isSelected = selectedSectorId === sector.id;
                  const activeIssuesCount = issues.filter(issue => isPointInSector(issue.latitude, issue.longitude, sector)).length;
                  const activeHotspotsCount = hotspots.filter(h => isPointInSector(h.latitude, h.longitude, sector)).length;
                  const hasIssues = activeIssuesCount > 0;
                  
                  // Color strategies based on status
                  let strokeColor = "rgba(20, 184, 166, 0.25)"; // standard teal
                  let fillColor = "rgba(15, 23, 42, 0.55)";
                  if (isSelected) {
                    strokeColor = "rgba(245, 158, 11, 0.85)"; // gold/amber
                    fillColor = "rgba(245, 158, 11, 0.08)";
                  } else if (hasIssues) {
                    strokeColor = "rgba(99, 102, 241, 0.4)"; // indigo
                    fillColor = "rgba(15, 23, 42, 0.65)";
                  }

                  if (sector.isPath && sector.d) {
                    return (
                      <g 
                        key={sector.id} 
                        className="cursor-pointer group/sec"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSectorId(sector.id);
                          const sectorCenterSvgX = sector.x + sector.width / 2;
                          const sectorCenterSvgY = sector.y + sector.height / 2;
                          const centerCoords = getLatLngFromSvg(sectorCenterSvgX, sectorCenterSvgY);
                          onSelectCoordinates(
                            Number(centerCoords.lat.toFixed(5)), 
                            Number(centerCoords.lng.toFixed(5)), 
                            `${sector.name} (${sector.desc})`
                          );
                        }}
                      >
                        <path 
                          d={sector.d} 
                          fill={fillColor} 
                          stroke={strokeColor} 
                          strokeWidth={isSelected ? 2 : 1}
                          className={`transition-all duration-200 group-hover/sec:stroke-amber-500/70 ${isSelected ? 'animate-pulse' : ''}`}
                        />
                        <text 
                          x={sector.x + 40} 
                          y={sector.y + 45} 
                          fill={isSelected ? "rgba(245, 158, 11, 1)" : "rgba(6, 182, 212, 0.75)"} 
                          fontSize="9" 
                          fontFamily="monospace" 
                          fontWeight="bold"
                        >
                          {sector.name.toUpperCase()}
                        </text>
                        <text 
                          x={sector.x + 40} 
                          y={sector.y + 60} 
                          fill="rgba(100, 116, 139, 0.8)" 
                          fontSize="8" 
                          fontFamily="monospace"
                        >
                          {sector.desc}
                        </text>

                        {/* Indicator Badges */}
                        {(activeIssuesCount > 0 || activeHotspotsCount > 0) && (
                          <g transform={`translate(${sector.x + sector.width - 60}, ${sector.y + 20})`}>
                            {activeIssuesCount > 0 && (
                              <g>
                                <circle cx="10" cy="8" r="6" fill="#3b82f6" />
                                <text x="10" y="11" fill="#ffffff" fontSize="8" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">
                                  {activeIssuesCount}
                                </text>
                              </g>
                            )}
                            {activeHotspotsCount > 0 && (
                              <g transform="translate(16, 0)">
                                <circle cx="10" cy="8" r="6" fill="#f43f5e" />
                                <text x="10" y="11" fill="#ffffff" fontSize="8" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">
                                  {activeHotspotsCount}
                                </text>
                              </g>
                            )}
                          </g>
                        )}
                      </g>
                    );
                  }

                  return (
                    <g 
                      key={sector.id} 
                      className="cursor-pointer group/sec"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSectorId(sector.id);
                        const sectorCenterSvgX = sector.x + sector.width / 2;
                        const sectorCenterSvgY = sector.y + sector.height / 2;
                        const centerCoords = getLatLngFromSvg(sectorCenterSvgX, sectorCenterSvgY);
                        onSelectCoordinates(
                          Number(centerCoords.lat.toFixed(5)), 
                          Number(centerCoords.lng.toFixed(5)), 
                          `${sector.name} (${sector.desc})`
                        );
                      }}
                    >
                      <rect 
                        x={sector.x} 
                        y={sector.y} 
                        width={sector.width} 
                        height={sector.height} 
                        fill={fillColor} 
                        stroke={strokeColor} 
                        strokeWidth={isSelected ? 2 : 1}
                        rx="4" 
                        className={`transition-all duration-200 group-hover/sec:stroke-amber-500/70 ${isSelected ? 'animate-pulse' : ''}`}
                      />
                      <text 
                        x={sector.x + 10} 
                        y={sector.y + 25} 
                        fill={isSelected ? "rgba(245, 158, 11, 1)" : "rgba(148, 163, 184, 0.85)"} 
                        fontSize="9" 
                        fontFamily="monospace" 
                        fontWeight="bold"
                      >
                        {sector.name.toUpperCase()}
                      </text>
                      <text 
                        x={sector.x + 10} 
                        y={sector.y + 40} 
                        fill="rgba(100, 116, 139, 0.8)" 
                        fontSize="8" 
                        fontFamily="monospace"
                      >
                        {sector.desc}
                      </text>

                      {/* Indicator Badges */}
                      {(activeIssuesCount > 0 || activeHotspotsCount > 0) && (
                        <g transform={`translate(${sector.x + sector.width - 45}, ${sector.y + 10})`}>
                          {activeIssuesCount > 0 && (
                            <g>
                              <circle cx="10" cy="8" r="6" fill="#3b82f6" />
                              <text x="10" y="11" fill="#ffffff" fontSize="8" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">
                                {activeIssuesCount}
                              </text>
                            </g>
                          )}
                          {activeHotspotsCount > 0 && (
                            <g transform="translate(16, 0)">
                              <circle cx="10" cy="8" r="6" fill="#f43f5e" />
                              <text x="10" y="11" fill="#ffffff" fontSize="8" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">
                                {activeHotspotsCount}
                              </text>
                            </g>
                          )}
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* 5. Render PREDICTED RISK HOTSPOTS in Vector Grid (No coordinate pollution!) */}
              {showHotspots && hotspots.map((hs) => {
                const { x, y } = getSvgCoords(hs.latitude, hs.longitude);
                // Constrain layout coordinates to avoid clipping outside SVG boundary limits
                if (x < 0 || x > MAP_WIDTH || y < 0 || y > MAP_HEIGHT) return null;

                return (
                  <g 
                    key={hs.id} 
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredHotspot(hs)}
                    onMouseLeave={() => setHoveredHotspot(null)}
                  >
                    {/* Outer pulsating risk radial aura */}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={18 + hs.riskScore * 0.15} 
                      fill="rgba(239, 68, 68, 0.15)" 
                      stroke="rgba(239, 68, 68, 0.4)" 
                      strokeWidth="1" 
                      strokeDasharray="2, 2"
                      className="animate-pulse"
                    />
                    {/* Center glowing risk core */}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="4" 
                      fill="#ef4444" 
                      className="animate-ping"
                      style={{ transformOrigin: `${x}px ${y}px` }}
                    />
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="5" 
                      fill="#ef4444" 
                      stroke="#1e293b" 
                      strokeWidth="1" 
                    />
                  </g>
                );
              })}

              {/* 6. Render ACTIVE COMMUNITY ISSUES as Vector Pins */}
              {issues.map((issue) => {
                const { x, y } = getSvgCoords(issue.latitude, issue.longitude);
                // Constrain coordinates
                if (x < 0 || x > MAP_WIDTH || y < 0 || y > MAP_HEIGHT) return null;

                const isSelected = selectedIssueId === issue.id;

                let fillColors = {
                  reported: '#3b82f6',
                  verified: '#f59e0b',
                  in_progress: '#6366f1',
                  resolved: '#10b981'
                };

                const pinColor = fillColors[issue.status] || '#3b82f6';

                return (
                  <g 
                    key={issue.id} 
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectIssue(issue.id);
                    }}
                    onMouseEnter={() => setHoveredIssue(issue)}
                    onMouseLeave={() => setHoveredIssue(null)}
                  >
                    {isSelected && (
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="14" 
                        fill="none" 
                        stroke="#818cf8" 
                        strokeWidth="1.5" 
                        className="animate-ping"
                        opacity="0.8"
                        style={{ transformOrigin: `${x}px ${y}px` }}
                      />
                    )}
                    {/* Subtle hover feedback aura */}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="10" 
                      fill="none" 
                      stroke={pinColor} 
                      strokeWidth="1" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    />
                    {/* Core Pin Element */}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="6.5" 
                      fill={pinColor} 
                      stroke="#ffffff" 
                      strokeWidth="1.5" 
                      className="transition-transform group-hover:scale-125 duration-100 shadow-lg"
                      style={{ transformOrigin: `${x}px ${y}px` }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Interactive Floating Vector Tooltips */}
            {hoveredIssue && (
              <div 
                className="absolute bottom-16 left-6 z-30 max-w-sm bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xl font-mono text-left animate-in fade-in duration-100"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1 text-indigo-400">
                  <MapPin className="w-3.5 h-3.5" /> Civic Issue Detail
                </div>
                <h4 className="text-white text-xs font-black truncate leading-tight">{hoveredIssue.title}</h4>
                <p className="text-[10px] text-slate-400 mt-1 truncate">{hoveredIssue.locationName}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase ${
                    hoveredIssue.status === 'reported' ? 'bg-blue-500' :
                    hoveredIssue.status === 'verified' ? 'bg-amber-500' :
                    hoveredIssue.status === 'in_progress' ? 'bg-indigo-500' :
                    hoveredIssue.status === 'resolved' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}>
                    {hoveredIssue.status}
                  </span>
                  <span className="text-[8px] text-slate-500">SEVERITY: <strong className="text-rose-400">{hoveredIssue.severity.toUpperCase()}</strong></span>
                </div>
              </div>
            )}

            {hoveredHotspot && (
              <div 
                className="absolute bottom-16 right-6 z-30 max-w-sm bg-slate-950 border border-rose-900/40 p-3 rounded-xl shadow-xl font-mono text-left animate-in fade-in duration-100"
              >
                <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-rose-500 uppercase tracking-widest mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> AI Predictive Risk Spot
                </div>
                <h4 className="text-white text-xs font-black truncate leading-tight">{hoveredHotspot.title}</h4>
                <p className="text-[10px] text-slate-400 mt-1 truncate">{hoveredHotspot.reasoning}</p>
                <div className="flex items-center gap-2 mt-2 text-[9px]">
                  <span className="text-rose-400">Predicted Failure Risk: <strong>{hoveredHotspot.riskScore}%</strong></span>
                </div>
              </div>
            )}

            {/* Bottom Grid Coordinates Footer HUD */}
            <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
              <p className="text-[9px] font-mono text-slate-500">
                {addingSector 
                  ? "🎯 CLICK ON THE MAP ABOVE TO PLACE THE SECTOR CENTER" 
                  : "Click inside sectors to observe, or click grid to select coordinates."
                }
              </p>
            </div>
          </div>

          {/* Right Panel: Sector Observation Hub */}
          <div className="w-full lg:w-80 h-full bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800/80 p-4 flex flex-col justify-between overflow-y-auto text-slate-300 font-mono text-xs shrink-0 select-text">
            <div>
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3 shrink-0">
                <LayoutGrid className="w-4 h-4 text-teal-400" />
                <div>
                  <h3 className="text-white font-bold text-xs uppercase tracking-wider">Sector Observation</h3>
                  <p className="text-[9px] text-slate-500">Continuous spatial intelligence</p>
                </div>
              </div>

              {/* Custom Sector Creator Form */}
              {addingSector ? (
                <div className="bg-slate-950 border border-teal-500/30 rounded-xl p-3 mb-4 animate-pulse">
                  <div className="flex items-center gap-1.5 text-teal-400 font-bold mb-2 text-[10px]">
                    <Crosshair className="w-3.5 h-3.5 animate-spin" />
                    <span>PLACING CUSTOM ZONE</span>
                  </div>
                  <div className="space-y-2 text-[10px]">
                    <div>
                      <label className="text-slate-500 block mb-0.5">Zone Name</label>
                      <input 
                        type="text" 
                        value={newSectorName} 
                        onChange={(e) => setNewSectorName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[10px]"
                        placeholder="e.g. Sector 19 North"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-0.5">Description</label>
                      <input 
                        type="text" 
                        value={newSectorDesc} 
                        onChange={(e) => setNewSectorDesc(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-[10px]"
                        placeholder="e.g. Pipeline maintenance"
                      />
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded text-[9px] text-teal-400/80 border border-teal-900/40">
                      🎯 Click any coordinate point on the blueprint grid map to deploy this zone.
                    </div>
                    <button 
                      onClick={() => setAddingSector(false)}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-[9px] cursor-pointer transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : selectedSectorId ? (
                // Selected Sector Observation Card
                (() => {
                  const selectedSector = sectors.find(s => s.id === selectedSectorId);
                  if (!selectedSector) return null;

                  const sectorIssues = issues.filter(issue => isPointInSector(issue.latitude, issue.longitude, selectedSector));
                  const sectorHotspots = hotspots.filter(h => isPointInSector(h.latitude, h.longitude, selectedSector));
                  const avgRisk = sectorHotspots.length > 0 
                    ? Math.round(sectorHotspots.reduce((sum, h) => sum + h.riskScore, 0) / sectorHotspots.length) 
                    : 0;

                  let healthStatus = 'STABLE';
                  let healthColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
                  if (sectorIssues.length > 3 || avgRisk > 70) {
                    healthStatus = 'CRITICAL';
                    healthColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse';
                  } else if (sectorIssues.length > 0 || avgRisk > 40) {
                    healthStatus = 'MODERATE';
                    healthColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
                  }

                  return (
                    <div className="space-y-3">
                      <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                        <div className="flex justify-between items-start">
                          <div className="truncate max-w-[160px]">
                            <h4 className="text-white font-bold text-xs leading-tight truncate">{selectedSector.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{selectedSector.desc}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold border shrink-0 ${healthColor}`}>
                            {healthStatus}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/60">
                          <div className="bg-slate-900/50 p-2 rounded">
                            <span className="text-[9px] text-slate-500 block">ACTIVE ISSUES</span>
                            <span className="text-sm font-bold text-blue-400">{sectorIssues.length}</span>
                          </div>
                          <div className="bg-slate-900/50 p-2 rounded">
                            <span className="text-[9px] text-slate-500 block">AI HOTSPOTS</span>
                            <span className="text-sm font-bold text-rose-400">{sectorHotspots.length}</span>
                          </div>
                          <div className="bg-slate-900/50 p-2 rounded col-span-2">
                            <span className="text-[9px] text-slate-500 block">SECTOR RISK INDEX</span>
                            <span className="text-xs font-bold text-slate-200 mt-1 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-rose-500" />
                              {avgRisk > 0 ? `${avgRisk}% (Predictive)` : 'Low Risk / Stable'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sector Issues List */}
                      <div>
                        <h5 className="text-white font-bold text-[10px] uppercase tracking-wider mb-2">Active Issues ({sectorIssues.length})</h5>
                        {sectorIssues.length > 0 ? (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {sectorIssues.map(issue => (
                              <div 
                                key={issue.id}
                                onClick={() => onSelectIssue(issue.id)}
                                className="bg-slate-950 hover:bg-slate-900 border border-slate-800/60 hover:border-slate-700/80 p-2 rounded cursor-pointer transition text-[10px]"
                              >
                                <div className="flex justify-between font-bold text-white truncate items-center gap-1">
                                  <span className="truncate max-w-[120px]">{issue.title}</span>
                                  <span className={`text-[8px] px-1 py-0.1 rounded uppercase shrink-0 ${
                                    issue.status === 'verified' ? 'text-amber-400 bg-amber-500/10' :
                                    issue.status === 'in_progress' ? 'text-indigo-400 bg-indigo-500/10' :
                                    issue.status === 'resolved' ? 'text-emerald-400 bg-emerald-500/10' : 'text-blue-400 bg-blue-500/10'
                                  }`}>
                                    {issue.status}
                                  </span>
                                </div>
                                <p className="text-[9px] text-slate-500 mt-1">{issue.category}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-slate-950/40 text-slate-500 text-[10px] py-4 text-center border border-dashed border-slate-800 rounded-xl">
                            No reports recorded in this sector bounds.
                          </div>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={() => setSelectedSectorId(null)}
                          className="flex-grow py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-[10px] cursor-pointer transition text-center"
                        >
                          Exit Observation
                        </button>
                        {selectedSector.isCustom && (
                          <button 
                            onClick={() => handleDeleteSector(selectedSector.id)}
                            className="px-2 py-1.5 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-900/30 text-rose-400 rounded transition cursor-pointer flex items-center justify-center"
                            title="Delete custom sector"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                // Sectors Directory List
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-white font-bold text-[10px] uppercase tracking-wider">Active Sectors ({sectors.length})</h4>
                    <button 
                      onClick={() => setAddingSector(true)}
                      className="flex items-center gap-1 px-2 py-1 bg-teal-950/50 hover:bg-teal-900/80 border border-teal-900/50 text-teal-400 rounded-lg text-[9px] font-bold cursor-pointer transition"
                    >
                      <Plus className="w-3 h-3" /> Custom Zone
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                    {sectors.map(sec => {
                      const secIssues = issues.filter(issue => isPointInSector(issue.latitude, issue.longitude, sec));
                      const secHotspots = hotspots.filter(h => isPointInSector(h.latitude, h.longitude, sec));
                      return (
                        <div 
                          key={sec.id}
                          onClick={() => setSelectedSectorId(sec.id)}
                          className="bg-slate-950/60 hover:bg-slate-950 border border-slate-800/40 hover:border-slate-800 p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between group"
                        >
                          <div className="truncate max-w-[180px]">
                            <div className="font-bold text-slate-200 group-hover:text-white transition text-[10px] truncate">{sec.name}</div>
                            <div className="text-[9px] text-slate-500 mt-0.5 truncate">{sec.desc}</div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {secIssues.length > 0 && (
                              <span className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded text-[9px] font-bold">
                                {secIssues.length}
                              </span>
                            )}
                            {secHotspots.length > 0 && (
                              <span className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-[9px] font-bold">
                                {secHotspots.length}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="text-[9px] text-slate-500 pt-3 border-t border-slate-800/60 shrink-0">
              💡 Select any sector directly on the blueprint grid to observe live activity.
            </div>
          </div>

      </div>

    </div>
  );
}
