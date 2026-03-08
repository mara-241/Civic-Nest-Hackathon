import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { HotspotIntelligenceMap } from '../../components/maps/HotspotIntelligenceMap';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { TableSkeleton, MapSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { PriorityBadge, StatusBadge } from '../../components/ui/PriorityBadge';
import { RecurrenceBar } from '../../components/ui/RecurrenceBar';
import { getOpsQueue, updateIncidentStatus, getHotspots } from '../../services/api';
import { ListChecks, Map, ClipboardList, Search, Filter, Layers, X, UserPlus, RefreshCw, Flame, AlertTriangle as AlertTriangleIcon, CheckCircle2, Eye, ArrowRight } from 'lucide-react';
import { issueCategories, zones, statuses, priorities } from '../../mockData/incidents';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

const workerTeams = [
  'Worker Team A',
  'Worker Team B',
  'Environmental Team',
  'Road Maintenance',
  'Utilities Team'
];

const tabRouteMap = {
  queue: '/worker',
  map: '/worker/map',
  assignments: '/worker/assignments'
};

const routeTabMap = {
  '/worker': 'queue',
  '/worker/map': 'map',
  '/worker/assignments': 'assignments'
};

export default function WorkerPortal() {
  const location = useLocation();
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState([]);
  const [hotspotData, setHotspotData] = useState({ hotspots: [], incidents: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [focusedIncidentId, setFocusedIncidentId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showEmergingRisks, setShowEmergingRisks] = useState(true);
  const [activeTab, setActiveTab] = useState('queue');
  const [ownerOverrides, setOwnerOverrides] = useState({});
  const [pendingQueueFocus, setPendingQueueFocus] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    category: '',
    zone: ''
  });

  useEffect(() => {
    const normalizedPath = location.pathname.endsWith('/') && location.pathname.length > 1
      ? location.pathname.slice(0, -1)
      : location.pathname;
    setActiveTab(routeTabMap[normalizedPath] || 'queue');
  }, [location.pathname]);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const queueData = await getOpsQueue(filters);
      setIncidents(queueData.incidents || []);

      try {
        const hotspotPayload = await getHotspots();
        setHotspotData(hotspotPayload);
      } catch {
        // Keep queue usable even when hotspot service is temporarily unavailable.
        setHotspotData((prev) => prev || { hotspots: [], incidents: [] });
      }
    } catch (err) {
      setError('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pendingQueueFocus?.incidentId) return;
    if (location.pathname !== '/worker') return;

    const incident = incidents.find((i) => i.incident_id === pendingQueueFocus.incidentId) || selectedIncident;
    if (pendingQueueFocus.openDetail && incident?.incident_id) {
      setSelectedIncident(incident);
    }

    const timer = window.setTimeout(() => {
      document
        .querySelector(`[data-testid="incident-row-${pendingQueueFocus.incidentId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);

    setPendingQueueFocus(null);
    return () => window.clearTimeout(timer);
  }, [pendingQueueFocus, location.pathname, incidents, selectedIncident]);

  const handleStatusUpdate = async (incidentId, newStatus) => {
    try {
      await updateIncidentStatus(incidentId, newStatus);
      setIncidents((prev) => prev.map((i) => (i.incident_id === incidentId ? { ...i, status: newStatus } : i)));
      setSelectedIncident((prev) => (
        prev?.incident_id === incidentId ? { ...prev, status: newStatus } : prev
      ));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAssign = async (incidentId, worker, currentStatus = 'new') => {
    const canTransitionToAssigned = currentStatus === 'new';

    try {
      // Backend status endpoint is strict (new -> assigned only).
      if (canTransitionToAssigned) {
        await updateIncidentStatus(incidentId, 'assigned');
      }

      setOwnerOverrides((prev) => ({ ...prev, [incidentId]: worker }));
      setIncidents((prev) => prev.map((i) => (
        i.incident_id === incidentId
          ? { ...i, status: canTransitionToAssigned ? 'assigned' : i.status, owner: worker }
          : i
      )));
      setSelectedIncident((prev) => (
        prev?.incident_id === incidentId
          ? { ...prev, status: canTransitionToAssigned ? 'assigned' : prev.status, owner: worker }
          : prev
      ));
    } catch (err) {
      console.error('Failed to assign:', err);
    }
  };

  const focusIncidentInQueue = (incident, options = {}) => {
    const incidentId = incident?.incident_id;
    if (!incidentId) return;

    setFocusedIncidentId(incidentId);
    setPendingQueueFocus({ incidentId, openDetail: Boolean(options.openDetail) });
    navigate('/worker');
  };

  const handleMapIncidentAction = (action, incident) => {
    if (!incident) return;
    if (action === 'focus_queue') {
      focusIncidentInQueue(incident);
      return;
    }
    if (action === 'open_detail') {
      focusIncidentInQueue(incident, { openDetail: true });
      return;
    }
    setSelectedIncident(incident);
  };

  const handleMapHotspotAction = (action, _hotspot, incident) => {
    if (!incident) return;
    focusIncidentInQueue(incident, { openDetail: action === 'open_emerging_incident' });
  };

  const filteredIncidents = incidents
    .filter((incident) => {
      if (filters.search && !incident.issue_category.toLowerCase().includes(filters.search.toLowerCase()) &&
        !incident.incident_id.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.status && incident.status !== filters.status) return false;
      if (filters.priority && incident.priority !== filters.priority) return false;
      if (filters.category && incident.issue_category !== filters.category) return false;
      if (filters.zone && incident.zone !== filters.zone) return false;
      return true;
    })
    .sort((a, b) => {
      const statusRank = { new: 0, monitored: 1, assigned: 2, resolved: 3 };
      const rankDelta = (statusRank[a.status] ?? 99) - (statusRank[b.status] ?? 99);
      if (rankDelta !== 0) return rankDelta;
      return new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime();
    });

  const filteredMapHotspots = (hotspotData.hotspots || []).filter((hotspot) => {
    if (!filters.zone) return true;
    return String(hotspot.area || '').toLowerCase().includes(filters.zone.toLowerCase());
  });

  const assignmentBuckets = useMemo(() => {
    const withOwner = filteredIncidents.map((incident) => ({
      ...incident,
      owner: ownerOverrides[incident.incident_id] || incident.owner || null
    }));

    return {
      assigned: withOwner.filter((i) => i.status === 'assigned'),
      new: withOwner.filter((i) => i.status === 'new'),
      monitored: withOwner.filter((i) => i.status === 'monitored'),
      resolved: withOwner.filter((i) => i.status === 'resolved')
    };
  }, [filteredIncidents, ownerOverrides]);

  const mapQuickActions = useMemo(() => {
    const toZone = (value = '') => String(value || '').split('·')[0].trim().toLowerCase();
    return filteredMapHotspots
      .map((hotspot, idx) => {
        const zoneKey = toZone(hotspot.area || hotspot.name);
        const topIncident = filteredIncidents
          .filter((incident) => toZone(incident.zone) === zoneKey)
          .sort((a, b) => (b.recurrence_score || 0) - (a.recurrence_score || 0))[0];
        if (!topIncident) return null;
        return {
          id: `${topIncident.incident_id || 'quick'}-${idx}`,
          label: hotspot.area || hotspot.name || `Hotspot ${idx + 1}`,
          incident: topIncident
        };
      })
      .filter(Boolean)
      .slice(0, 6);
  }, [filteredMapHotspots, filteredIncidents]);

  const clearFilters = () => {
    setFilters({ search: '', status: '', priority: '', category: '', zone: '' });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
    navigate(tabRouteMap[nextTab] || '/worker');
  };

  return (
    <div className="flex h-screen bg-slate-50" data-testid="worker-portal">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Worker Console" />

        <main className="flex-1 overflow-hidden p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-white border border-slate-200">
                <TabsTrigger value="queue" className="gap-2 data-[state=active]:bg-civic-blue data-[state=active]:text-white" data-testid="worker-queue-tab-trigger">
                  <ListChecks className="w-4 h-4" strokeWidth={1.5} />
                  Queue
                </TabsTrigger>
                <TabsTrigger value="map" className="gap-2 data-[state=active]:bg-civic-blue data-[state=active]:text-white" data-testid="worker-map-tab-trigger">
                  <Map className="w-4 h-4" strokeWidth={1.5} />
                  Map View
                </TabsTrigger>
                <TabsTrigger value="assignments" className="gap-2 data-[state=active]:bg-civic-blue data-[state=active]:text-white" data-testid="tab-assignments">
                  <ClipboardList className="w-4 h-4" strokeWidth={1.5} />
                  Assignments
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
                  <Input
                    placeholder="Search incidents..."
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    className="pl-9 w-64 bg-white"
                    data-testid="search-input"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn('gap-2', showFilters && 'bg-civic-blue/5 border-civic-blue/30')}
                  data-testid="filter-btn"
                >
                  <Filter className="w-4 h-4" strokeWidth={1.5} />
                  Filters
                  {hasActiveFilters && (
                    <Badge className="ml-1 bg-civic-blue text-white h-5 w-5 p-0 flex items-center justify-center">
                      {Object.values(filters).filter((v) => v !== '').length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchIncidents}
                  className="gap-2"
                  data-testid="refresh-btn"
                >
                  <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                  Refresh
                </Button>
              </div>
            </div>

            {showFilters && (
              <Card className="mb-4 border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-slate-700">Filter Incidents</span>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 h-8">
                        <X className="w-3 h-3 mr-1" /> Clear all
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <Select value={filters.status || '__all__'} onValueChange={(v) => setFilters((prev) => ({ ...prev, status: v === '__all__' ? '' : v }))}>
                      <SelectTrigger data-testid="status-filter">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Statuses</SelectItem>
                        {statuses.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filters.priority || '__all__'} onValueChange={(v) => setFilters((prev) => ({ ...prev, priority: v === '__all__' ? '' : v }))}>
                      <SelectTrigger data-testid="priority-filter">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Priorities</SelectItem>
                        {priorities.map((p) => (
                          <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filters.category || '__all__'} onValueChange={(v) => setFilters((prev) => ({ ...prev, category: v === '__all__' ? '' : v }))}>
                      <SelectTrigger data-testid="category-filter">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Categories</SelectItem>
                        {issueCategories.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filters.zone || '__all__'} onValueChange={(v) => setFilters((prev) => ({ ...prev, zone: v === '__all__' ? '' : v }))}>
                      <SelectTrigger data-testid="zone-filter">
                        <SelectValue placeholder="Zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Zones</SelectItem>
                        {zones.map((z) => (
                          <SelectItem key={z} value={z}>{z}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            <TabsContent value="queue" className="flex-1 mt-0">
              <Card className="h-full border-slate-200">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Incident Queue</CardTitle>
                    <Badge variant="outline" className="bg-slate-50">
                      {filteredIncidents.length} incidents
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-4"><TableSkeleton rows={6} /></div>
                  ) : error ? (
                    <ErrorState message={error} onRetry={fetchIncidents} />
                  ) : filteredIncidents.length === 0 ? (
                    <div className="p-12 text-center" data-testid="queue-empty">
                      <p className="text-slate-700 font-medium">No incidents match the current filters.</p>
                      <p className="text-sm text-slate-500 mt-1">Clear filters or refresh to load the latest queue.</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[calc(100vh-320px)]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="w-[120px]">Incident ID</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Zone</TableHead>
                            <TableHead className="w-[180px]">Recurrence</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assigned</TableHead>
                            <TableHead>Updated</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredIncidents.map((incident) => (
                            <TableRow
                              key={incident.incident_id}
                              className={cn(
                                'cursor-pointer hover:bg-slate-50 transition-colors duration-150',
                                focusedIncidentId === incident.incident_id && 'bg-civic-blue/5 ring-1 ring-inset ring-civic-blue/30'
                              )}
                              onClick={() => setSelectedIncident(incident)}
                              data-testid={`incident-row-${incident.incident_id}`}
                            >
                              <TableCell className="font-medium text-civic-blue">{incident.incident_id}</TableCell>
                              <TableCell>{incident.issue_category}</TableCell>
                              <TableCell>{incident.zone}</TableCell>
                              <TableCell>
                                <RecurrenceBar score={incident.recurrence_score} showLabel={false} size="sm" />
                              </TableCell>
                              <TableCell><PriorityBadge priority={incident.priority} /></TableCell>
                              <TableCell><StatusBadge status={incident.status} /></TableCell>
                              <TableCell className="text-slate-600">{ownerOverrides[incident.incident_id] || incident.owner || '—'}</TableCell>
                              <TableCell className="text-slate-500 text-sm">
                                {format(new Date(incident.reported_at), 'MMM d, HH:mm')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="map" className="flex-1 mt-0" data-testid="worker-map-tab-content">
              <Card className="h-full border-slate-200">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Civic Hotspot Intelligence Map</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        className={cn('gap-2', showHeatmap && 'bg-civic-blue/5 border-civic-blue/30 text-civic-blue')}
                        data-testid="heatmap-toggle"
                      >
                        <Layers className="w-4 h-4" strokeWidth={1.5} />
                        Heatmap
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHotspots(!showHotspots)}
                        className={cn('gap-2', showHotspots && 'bg-red-50 border-red-200 text-red-600')}
                        data-testid="hotspots-toggle"
                      >
                        <Flame className="w-4 h-4" strokeWidth={1.5} />
                        Hotspots
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEmergingRisks(!showEmergingRisks)}
                        className={cn('gap-2', showEmergingRisks && 'bg-amber-50 border-amber-200 text-amber-600')}
                        data-testid="emerging-risks-toggle"
                      >
                        <AlertTriangleIcon className="w-4 h-4" strokeWidth={1.5} />
                        Emerging
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2" data-testid="map-hotspot-quick-actions">
                    {mapQuickActions.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        className="px-2 py-1 text-xs rounded border border-civic-blue/30 text-civic-blue hover:bg-civic-blue/5"
                        onClick={() => focusIncidentInQueue(entry.incident)}
                        data-testid={`map-hotspot-focus-top-${entry.id}`}
                      >
                        {entry.label}: open {entry.incident.incident_id}
                      </button>
                    ))}
                    {mapQuickActions.length === 0 && (
                      <span className="text-xs text-slate-500" data-testid="map-hotspot-popup-empty">No linked hotspot incidents for current filters.</span>
                    )}
                    {mapQuickActions.length > 0 && (
                      <span className="sr-only" data-testid="map-hotspot-popup-quick">hotspot quick actions ready</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 h-[calc(100vh-280px)]">
                  {loading ? (
                    <MapSkeleton />
                  ) : (
                    <HotspotIntelligenceMap
                      incidents={filteredIncidents}
                      hotspots={filteredMapHotspots}
                      showHeatmap={showHeatmap}
                      showHotspots={showHotspots}
                      showEmergingRisks={showEmergingRisks}
                      onIncidentClick={setSelectedIncident}
                      onIncidentAction={handleMapIncidentAction}
                      onHotspotAction={handleMapHotspotAction}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments" className="flex-1 mt-0" data-testid="worker-assignments-view">
              <Card className="h-full border-slate-200">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Assignments</CardTitle>
                    <Badge variant="outline" className="bg-slate-50">
                      {filteredIncidents.length} visible
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500" data-testid="assignment-owner-note">Team owner labels are session-local in this UI view.</p>
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs" data-testid="assignment-summary-assigned">
                      <div className="flex items-center gap-1 text-slate-600"><ClipboardList className="w-3 h-3" /> Assigned</div>
                      <div className="text-sm font-semibold text-slate-900">{assignmentBuckets.assigned.length}</div>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs" data-testid="assignment-summary-new">
                      <div className="flex items-center gap-1 text-slate-600"><ArrowRight className="w-3 h-3" /> New</div>
                      <div className="text-sm font-semibold text-slate-900">{assignmentBuckets.new.length}</div>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs" data-testid="assignment-summary-monitored">
                      <div className="flex items-center gap-1 text-slate-600"><Eye className="w-3 h-3" /> Monitored</div>
                      <div className="text-sm font-semibold text-slate-900">{assignmentBuckets.monitored.length}</div>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs" data-testid="assignment-summary-resolved">
                      <div className="flex items-center gap-1 text-slate-600"><CheckCircle2 className="w-3 h-3" /> Resolved</div>
                      <div className="text-sm font-semibold text-slate-900">{assignmentBuckets.resolved.length}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-4" data-testid="assignments-loading"><TableSkeleton rows={6} /></div>
                  ) : error ? (
                    <ErrorState message={error} onRetry={fetchIncidents} />
                  ) : filteredIncidents.length === 0 ? (
                    <div className="p-12 text-center" data-testid="assignments-empty">
                      <p className="text-slate-700 font-medium">No assignments match the current filters.</p>
                      <p className="text-sm text-slate-500 mt-1">Clear filters or refresh to load the latest workload.</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[calc(100vh-360px)]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="w-[120px]">Incident ID</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Zone</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead className="w-[320px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredIncidents.map((incident) => (
                            <TableRow key={incident.incident_id} data-testid={`assignment-row-${incident.incident_id}`}>
                              <TableCell className="font-medium text-civic-blue cursor-pointer" onClick={() => setSelectedIncident(incident)}>{incident.incident_id}</TableCell>
                              <TableCell>{incident.issue_category}</TableCell>
                              <TableCell>{incident.zone}</TableCell>
                              <TableCell>{ownerOverrides[incident.incident_id] || incident.owner || '—'}</TableCell>
                              <TableCell><StatusBadge status={incident.status} /></TableCell>
                              <TableCell><PriorityBadge priority={incident.priority} /></TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 flex-wrap" data-testid={`assignment-actions-${incident.incident_id}`}>
                                  {incident.status !== 'assigned' && (
                                    <Select onValueChange={(team) => handleAssign(incident.incident_id, team, incident.status)}>
                                      <SelectTrigger className="h-8 w-[170px]" data-testid={`assignment-select-${incident.incident_id}`}>
                                        <SelectValue placeholder="Assign team" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {workerTeams.map((team) => (
                                          <SelectItem key={team} value={team}>{team}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                  {incident.status !== 'monitored' && (
                                    <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(incident.incident_id, 'monitored')} data-testid={`assignment-monitor-${incident.incident_id}`}>
                                      Monitor
                                    </Button>
                                  )}
                                  {incident.status !== 'resolved' && (
                                    <Button size="sm" variant="outline" className="text-civic-green border-civic-green/30 hover:bg-civic-green/5" onClick={() => handleStatusUpdate(incident.incident_id, 'resolved')} data-testid={`assignment-resolve-${incident.incident_id}`}>
                                      Resolve
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        <IncidentDetailDialog
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onStatusUpdate={handleStatusUpdate}
          onAssign={(incidentId, worker) => handleAssign(incidentId, worker, selectedIncident?.status || 'new')}
        />
      </div>
    </div>
  );
}

const IncidentDetailDialog = ({ incident, onClose, onStatusUpdate, onAssign }) => {
  const [selectedWorker, setSelectedWorker] = useState('');

  if (!incident) return null;

  return (
    <Dialog open={!!incident} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg" data-testid="incident-detail-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-civic-blue">{incident.incident_id}</span>
            <PriorityBadge priority={incident.priority} />
            <StatusBadge status={incident.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Category</label>
            <p className="text-sm font-medium text-slate-900 mt-1">{incident.issue_category}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Description</label>
            <p className="text-sm text-slate-700 mt-1">{incident.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Zone</label>
              <p className="text-sm text-slate-700 mt-1">{incident.zone}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Source</label>
              <p className="text-sm text-slate-700 mt-1">{incident.source_dataset}</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Recurrence Risk</label>
            <RecurrenceBar score={incident.recurrence_score} />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Recommended Action</label>
            <p className="text-sm text-slate-700 mt-1 p-3 bg-slate-50 rounded-lg">{incident.recommended_action}</p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Assignment</label>
            <div className="flex gap-2">
              <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                <SelectTrigger className="flex-1" data-testid="assign-select">
                  <SelectValue placeholder="Select worker team..." />
                </SelectTrigger>
                <SelectContent>
                  {workerTeams.map((team) => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  if (!selectedWorker) return;
                  onAssign(incident.incident_id, selectedWorker);
                  onClose();
                }}
                disabled={!selectedWorker}
                className="bg-civic-blue hover:bg-civic-blue-hover text-white gap-2"
                data-testid="assign-btn"
              >
                <UserPlus className="w-4 h-4" strokeWidth={1.5} />
                Assign
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 pt-4">
          <div className="flex gap-2 w-full">
            {incident.status !== 'resolved' && (
              <Button
                variant="outline"
                className="flex-1 text-civic-green border-civic-green/30 hover:bg-civic-green/5"
                onClick={() => onStatusUpdate(incident.incident_id, 'resolved')}
                data-testid="mark-resolved-btn"
              >
                Mark Resolved
              </Button>
            )}
            {incident.status !== 'monitored' && (
              <Button
                variant="outline"
                className="flex-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                onClick={() => onStatusUpdate(incident.incident_id, 'monitored')}
                data-testid="set-monitored-btn"
              >
                Set to Monitored
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
