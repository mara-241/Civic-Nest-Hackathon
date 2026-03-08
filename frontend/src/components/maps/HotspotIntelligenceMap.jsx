import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
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

const normalizeZoneToken = (value = '') => String(value || '').trim().toLowerCase();

const createCustomIcon = (priority) => {
  const colors = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#6B7280'
  };

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${colors[priority] || colors.medium};
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

const HeatmapLayer = ({ points, show }) => {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!show || !points.length) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }

    const heatData = points.map((p) => [p.lat, p.lon, p.intensity]);

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

const FitToDataBounds = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lon], 14);
      return;
    }

    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, points]);

  return null;
};

const extractZoneFromHotspotArea = (hotspot) => {
  const area = String(hotspot?.area || hotspot?.name || '').trim();
  const maybeZone = area.split('·')[0]?.trim();
  return maybeZone || area;
};

export const HotspotIntelligenceMap = ({
  incidents = [],
  hotspots = [],
  center = [32.366, -86.299],
  zoom = 13,
  showHeatmap = false,
  showHotspots = true,
  showEmergingRisks = true,
  onIncidentClick,
  onIncidentAction,
  onHotspotAction
}) => {
  const [mapReady, setMapReady] = useState(false);

  const validIncidents = useMemo(
    () => incidents.filter((i) => Number.isFinite(i?.lat) && Number.isFinite(i?.lon)),
    [incidents]
  );

  const validHotspots = useMemo(
    () => hotspots.filter((h) => Number.isFinite(h?.lat) && Number.isFinite(h?.lon)),
    [hotspots]
  );

  const heatmapPoints = useMemo(
    () => validIncidents.map((i) => ({ lat: i.lat, lon: i.lon, intensity: i.recurrence_score || 0.5 })),
    [validIncidents]
  );

  const hotspotsWithContext = useMemo(() => {
    return validHotspots.map((hotspot) => {
      const zoneToken = normalizeZoneToken(extractZoneFromHotspotArea(hotspot));
      const linkedIncidents = validIncidents
        .filter((incident) => normalizeZoneToken(incident.zone) === zoneToken)
        .sort((a, b) => (b.recurrence_score || 0) - (a.recurrence_score || 0));

      return {
        ...hotspot,
        linkedIncidents,
        topIncident: linkedIncidents[0] || null
      };
    });
  }, [validHotspots, validIncidents]);

  const emergingRisks = useMemo(
    () => hotspotsWithContext
      .filter((h) => Number(h.recurrence_score || 0) >= 0.55)
      .sort((a, b) => (b.recurrence_score || 0) - (a.recurrence_score || 0))
      .slice(0, 4),
    [hotspotsWithContext]
  );

  const dataBoundsPoints = useMemo(
    () => [...validIncidents, ...validHotspots],
    [validIncidents, validHotspots]
  );

  const initialCenter = useMemo(() => {
    if (dataBoundsPoints.length) return [dataBoundsPoints[0].lat, dataBoundsPoints[0].lon];
    return center;
  }, [center, dataBoundsPoints]);

  return (
    <div className="w-full h-full relative" data-testid="hotspot-intelligence-map">
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg border border-slate-200 p-4" data-testid="map-legend">
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

      <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200" data-testid="worker-hotspot-map-canvas">
        <MapContainer
          center={initialCenter}
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
              <FitToDataBounds points={dataBoundsPoints} />
              <HeatmapLayer points={heatmapPoints} show={showHeatmap} />

              <MarkerClusterGroup
                chunkedLoading
                iconCreateFunction={(cluster) => {
                  const count = cluster.getChildCount();
                  let size = 'small';
                  if (count > 10) size = 'large';
                  else if (count > 5) size = 'medium';

                  const sizes = { small: 30, medium: 40, large: 50 };

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
                {validIncidents.map((incident) => (
                  <Marker
                    key={incident.incident_id}
                    position={[incident.lat, incident.lon]}
                    icon={createCustomIcon(incident.priority)}
                    eventHandlers={{
                      click: () => onIncidentClick?.(incident)
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[240px]" data-testid={`map-incident-popup-${incident.incident_id}`}>
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
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            className="px-2 py-1 text-xs rounded border border-slate-200 hover:bg-slate-50"
                            onClick={() => onIncidentAction?.('open_detail', incident)}
                            data-testid={`map-open-incident-${incident.incident_id}`}
                          >
                            Open detail
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 text-xs rounded border border-civic-blue/30 text-civic-blue hover:bg-civic-blue/5"
                            onClick={() => onIncidentAction?.('focus_queue', incident)}
                            data-testid={`map-focus-incident-${incident.incident_id}`}
                          >
                            Focus in queue
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>

              {showHotspots && hotspotsWithContext.map((hotspot, idx) => (
                <Marker
                  key={`hotspot-${idx}`}
                  position={[hotspot.lat, hotspot.lon]}
                  icon={createHotspotIcon()}
                >
                  <Popup>
                    <div className="p-2 min-w-[220px]" data-testid={`map-hotspot-popup-${idx}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🔥</span>
                        <span className="font-semibold text-sm text-red-600">Active Hotspot</span>
                      </div>
                      <p className="text-sm font-medium text-slate-700">{hotspot.area || hotspot.name || 'Hotspot'}</p>
                      <p className="text-xs text-slate-500 mt-1">{hotspot.incidents || hotspot.linkedIncidents.length || 0} active incidents</p>
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500 block mb-1">Risk Intensity</span>
                        <RecurrenceBar score={hotspot.recurrence_score || 0.4} size="sm" />
                      </div>
                      {hotspot.topIncident && (
                        <div className="mt-3">
                          <p className="text-xs text-slate-500 mb-1">Top linked incident</p>
                          <button
                            type="button"
                            className="w-full px-2 py-1 text-xs rounded border border-civic-blue/30 text-civic-blue hover:bg-civic-blue/5"
                            onClick={() => onHotspotAction?.('focus_top_incident', hotspot, hotspot.topIncident)}
                            data-testid={`map-hotspot-focus-top-${hotspot.topIncident.incident_id || idx}`}
                          >
                            Open {hotspot.topIncident.incident_id}
                          </button>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}

              {showHotspots && hotspotsWithContext.map((hotspot, idx) => (
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

              {showEmergingRisks && emergingRisks.map((risk, idx) => (
                <Marker
                  key={`risk-${idx}`}
                  position={[risk.lat, risk.lon]}
                  icon={createEmergingRiskIcon()}
                >
                  <Popup>
                    <div className="p-2 min-w-[190px]" data-testid={`map-emerging-risk-popup-${idx}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">⚠️</span>
                        <span className="font-semibold text-sm text-amber-600">Emerging Risk</span>
                      </div>
                      <p className="text-sm font-medium text-slate-700">{risk.area || risk.name || 'Risk Zone'}</p>
                      <p className="text-xs text-amber-600 font-medium mt-1">
                        Recurrence {(Number(risk.recurrence_score || 0) * 100).toFixed(0)}% • {risk.incidents || risk.linkedIncidents.length || 0} incidents
                      </p>
                      {risk.topIncident && (
                        <button
                          type="button"
                          className="mt-3 w-full px-2 py-1 text-xs rounded border border-amber-300 text-amber-700 hover:bg-amber-50"
                          onClick={() => onHotspotAction?.('open_emerging_incident', risk, risk.topIncident)}
                          data-testid={`map-emerging-open-incident-${risk.topIncident.incident_id || idx}`}
                        >
                          Open {risk.topIncident.incident_id}
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}

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

export { HotspotIntelligenceMap as IncidentMap };
