import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

export const IncidentMap = ({ 
  incidents = [], 
  center = [32.366, -86.299], 
  zoom = 13,
  showHeatmap = false,
  onIncidentClick 
}) => {
  const [mapReady, setMapReady] = useState(false);
  
  const heatmapPoints = incidents.map(i => ({
    lat: i.lat,
    lon: i.lon,
    intensity: i.recurrence_score || 0.5
  }));

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200" data-testid="incident-map">
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
                    <div className="p-2 min-w-[200px]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{incident.incident_id}</span>
                        <PriorityBadge priority={incident.priority} />
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{incident.issue_category}</p>
                      <p className="text-xs text-slate-500 mb-3">{incident.description}</p>
                      <div className="flex items-center justify-between mb-2">
                        <StatusBadge status={incident.status} />
                        <span className="text-xs text-slate-500">{incident.zone}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-xs text-slate-500 block mb-1">Recurrence Risk</span>
                        <RecurrenceBar score={incident.recurrence_score} size="sm" />
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </>
        )}
      </MapContainer>
    </div>
  );
};
