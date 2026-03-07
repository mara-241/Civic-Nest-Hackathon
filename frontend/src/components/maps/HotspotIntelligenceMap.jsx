import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, LayersControl, LayerGroup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { PriorityBadge, StatusBadge } from '../ui/PriorityBadge';
import { RecurrenceBar } from '../ui/RecurrenceBar';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons by priority
const createCustomIcon = (priority) => {
  const colors = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#6B7280'
  };
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${colors[priority]};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Hotspot marker (fire icon)
const createHotspotIcon = () => {
  return L.divIcon({
    className: 'hotspot-marker',
    html: `<div style="
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    ">🔥</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

// Emerging risk marker
const createEmergingRiskIcon = () => {
  return L.divIcon({
    className: 'emerging-risk-marker',
    html: `<div style="
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      animation: pulse 2s infinite;
    ">⚠️</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

// Heatmap layer component
const HeatmapLayer = ({ points, show }) => {
  const map = useMap();
  const heatLayerRef = useRef(null);
  
  useEffect(() => {
    if (!show) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }
    
    const heatData = points.map(p => [p.lat, p.lon, p.intensity]);
    
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }
    
    heatLayerRef.current = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: {
        0.2: '#1F4E79',
        0.4: '#4CAF50',
        0.6: '#F59E0B',
        0.8: '#EF4444',
        1.0: '#DC2626'
      }
    }).addTo(map);
    
    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, points, show]);
  
  return null;
};

// Hotspot data for visualization
const hotspots = [
  { lat: 32.366, lon: -86.299, name: "Downtown Commercial", intensity: 0.85 },
  { lat: 32.355, lon: -86.288, name: "Riverside Park", intensity: 0.78 },
];

// Emerging risk zones
const emergingRisks = [
  { lat: 32.372, lon: -86.312, name: "Industrial District", trend: "+15% this week" },
  { lat: 32.379, lon: -86.306, name: "Old Town Square", trend: "+8% this week" },
];

export const HotspotIntelligenceMap = ({ 
  incidents = [], 
  center = [32.366, -86.299], 
  zoom = 13,
  showHeatmap = false,
  showHotspots = true,
  showEmergingRisks = true,
  onIncidentClick 
}) => {
  const [mapReady, setMapReady] = useState(false);
  
  const heatmapPoints = incidents.map(i => ({
    lat: i.lat,
    lon: i.lon,
    intensity: i.recurrence_score || 0.5
  }));

  return (
    <div className="w-full h-full relative" data-testid="hotspot-intelligence-map">
      {/* Map Legend */}
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg border border-slate-200 p-4">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Map Legend</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow" />
            <span className="text-xs text-slate-600">High Priority Incident</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow" />
            <span className="text-xs text-slate-600">Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-slate-400 border-2 border-white shadow" />
            <span className="text-xs text-slate-600">Low Priority</span>
          </div>
          <div className="border-t border-slate-100 my-2" />
          <div className="flex items-center gap-2">
            <span className="text-base">🔥</span>
            <span className="text-xs text-slate-600">Active Hotspot</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span className="text-xs text-slate-600">Emerging Risk Zone</span>
          </div>
        </div>
      </div>

      <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200">
        <MapContainer
          center={center}
          zoom={zoom}
          className="w-full h-full"
          whenReady={() => setMapReady(true)}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {mapReady && (
            <>
              <HeatmapLayer points={heatmapPoints} show={showHeatmap} />
              
              {/* Incident Markers with Clustering */}
              <MarkerClusterGroup
                chunkedLoading
                iconCreateFunction={(cluster) => {
                  const count = cluster.getChildCount();
                  let size = 'small';
                  if (count > 10) size = 'large';
                  else if (count > 5) size = 'medium';
                  
                  const sizes = {
                    small: 30,
                    medium: 40,
                    large: 50
                  };
                  
                  return L.divIcon({
                    html: `<div style="
                      background-color: #1F4E79;
                      color: white;
                      width: ${sizes[size]}px;
                      height: ${sizes[size]}px;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-weight: 600;
                      font-size: ${size === 'large' ? '14px' : '12px'};
                      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    ">${count}</div>`,
                    className: 'cluster-marker',
                    iconSize: L.point(sizes[size], sizes[size]),
                  });
                }}
              >
                {incidents.map((incident) => (
                  <Marker
                    key={incident.incident_id}
                    position={[incident.lat, incident.lon]}
                    icon={createCustomIcon(incident.priority)}
                    eventHandlers={{
                      click: () => onIncidentClick?.(incident)
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[220px]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">{incident.incident_id}</span>
                          <PriorityBadge priority={incident.priority} />
                        </div>
                        <p className="text-sm font-medium text-slate-700 mb-1">{incident.issue_category}</p>
                        <p className="text-xs text-slate-500 mb-3">{incident.description}</p>
                        <div className="flex items-center justify-between mb-2">
                          <StatusBadge status={incident.status} />
                          <span className="text-xs text-slate-500">{incident.zone}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <span className="text-xs text-slate-500 block mb-1">Recurrence Risk</span>
                          <RecurrenceBar score={incident.recurrence_score} size="sm" />
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>

              {/* Hotspot Markers */}
              {showHotspots && hotspots.map((hotspot, idx) => (
                <Marker
                  key={`hotspot-${idx}`}
                  position={[hotspot.lat, hotspot.lon]}
                  icon={createHotspotIcon()}
                >
                  <Popup>
                    <div className="p-2 min-w-[180px]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🔥</span>
                        <span className="font-semibold text-sm text-red-600">Active Hotspot</span>
                      </div>
                      <p className="text-sm font-medium text-slate-700">{hotspot.name}</p>
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500 block mb-1">Risk Intensity</span>
                        <RecurrenceBar score={hotspot.intensity} size="sm" />
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Hotspot Radius Circles */}
              {showHotspots && hotspots.map((hotspot, idx) => (
                <Circle
                  key={`hotspot-circle-${idx}`}
                  center={[hotspot.lat, hotspot.lon]}
                  radius={500}
                  pathOptions={{
                    color: '#EF4444',
                    fillColor: '#EF4444',
                    fillOpacity: 0.15,
                    weight: 2,
                    dashArray: '5, 5'
                  }}
                />
              ))}

              {/* Emerging Risk Markers */}
              {showEmergingRisks && emergingRisks.map((risk, idx) => (
                <Marker
                  key={`risk-${idx}`}
                  position={[risk.lat, risk.lon]}
                  icon={createEmergingRiskIcon()}
                >
                  <Popup>
                    <div className="p-2 min-w-[180px]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">⚠️</span>
                        <span className="font-semibold text-sm text-amber-600">Emerging Risk</span>
                      </div>
                      <p className="text-sm font-medium text-slate-700">{risk.name}</p>
                      <p className="text-xs text-amber-600 font-medium mt-1">{risk.trend}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Emerging Risk Radius Circles */}
              {showEmergingRisks && emergingRisks.map((risk, idx) => (
                <Circle
                  key={`risk-circle-${idx}`}
                  center={[risk.lat, risk.lon]}
                  radius={400}
                  pathOptions={{
                    color: '#F59E0B',
                    fillColor: '#F59E0B',
                    fillOpacity: 0.1,
                    weight: 2,
                    dashArray: '3, 3'
                  }}
                />
              ))}
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

// Re-export original for backwards compatibility
export { HotspotIntelligenceMap as IncidentMap };
