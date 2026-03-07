import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';
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
import { getOpsQueue, updateIncidentStatus } from '../../services/api';
import { ListChecks, Map, ClipboardList, Search, Filter, Layers, X, UserPlus, RefreshCw, Flame, AlertTriangle as AlertTriangleIcon } from 'lucide-react';
import { issueCategories, zones, statuses, priorities } from '../../mockData/incidents';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

const sidebarItems = [
  { id: 'queue', label: 'Incident Queue', icon: ListChecks, path: '/worker' },
  { id: 'map', label: 'Hotspot Map', icon: Map, path: '/worker/map' },
  { id: 'assignments', label: 'Assignments', icon: ClipboardList, path: '/worker/assignments' }
];

const workerTeams = [
  "Worker Team A",
  "Worker Team B",
  "Environmental Team",
  "Road Maintenance",
  "Utilities Team"
];

export default function WorkerPortal() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [activeTab, setActiveTab] = useState('queue');
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    category: '',
    zone: ''
  });

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOpsQueue(filters);
      setIncidents(data.incidents);
    } catch (err) {
      setError("Failed to load incidents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleStatusUpdate = async (incidentId, newStatus) => {
    try {
      await updateIncidentStatus(incidentId, newStatus);
      setIncidents(prev => 
        prev.map(i => i.incident_id === incidentId ? { ...i, status: newStatus } : i)
      );
      setSelectedIncident(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleAssign = async (incidentId, worker) => {
    try {
      await updateIncidentStatus(incidentId, 'assigned', worker);
      setIncidents(prev => 
        prev.map(i => i.incident_id === incidentId ? { ...i, status: 'assigned', owner: worker } : i)
      );
      setSelectedIncident(prev => prev ? { ...prev, status: 'assigned', owner: worker } : null);
    } catch (err) {
      console.error("Failed to assign:", err);
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    if (filters.search && !incident.issue_category.toLowerCase().includes(filters.search.toLowerCase()) &&
        !incident.incident_id.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && incident.status !== filters.status) return false;
    if (filters.priority && incident.priority !== filters.priority) return false;
    if (filters.category && incident.issue_category !== filters.category) return false;
    if (filters.zone && incident.zone !== filters.zone) return false;
    return true;
  });

  const clearFilters = () => {
    setFilters({ search: '', status: '', priority: '', category: '', zone: '' });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="flex h-screen bg-slate-50" data-testid="worker-portal">
      <Sidebar items={sidebarItems} persona="worker" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Worker Console" />
        
        <main className="flex-1 overflow-hidden p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-white border border-slate-200">
                <TabsTrigger value="queue" className="gap-2 data-[state=active]:bg-civic-blue data-[state=active]:text-white">
                  <ListChecks className="w-4 h-4" strokeWidth={1.5} />
                  Queue
                </TabsTrigger>
                <TabsTrigger value="map" className="gap-2 data-[state=active]:bg-civic-blue data-[state=active]:text-white">
                  <Map className="w-4 h-4" strokeWidth={1.5} />
                  Map View
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
                  <Input
                    placeholder="Search incidents..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-9 w-64 bg-white"
                    data-testid="search-input"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn("gap-2", showFilters && "bg-civic-blue/5 border-civic-blue/30")}
                  data-testid="filter-btn"
                >
                  <Filter className="w-4 h-4" strokeWidth={1.5} />
                  Filters
                  {hasActiveFilters && (
                    <Badge className="ml-1 bg-civic-blue text-white h-5 w-5 p-0 flex items-center justify-center">
                      {Object.values(filters).filter(v => v !== '').length}
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

            {/* Filters Panel */}
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
                    <Select value={filters.status} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}>
                      <SelectTrigger data-testid="status-filter">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        {statuses.map(s => (
                          <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filters.priority} onValueChange={(v) => setFilters(prev => ({ ...prev, priority: v }))}>
                      <SelectTrigger data-testid="priority-filter">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Priorities</SelectItem>
                        {priorities.map(p => (
                          <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filters.category} onValueChange={(v) => setFilters(prev => ({ ...prev, category: v }))}>
                      <SelectTrigger data-testid="category-filter">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        {issueCategories.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filters.zone} onValueChange={(v) => setFilters(prev => ({ ...prev, zone: v }))}>
                      <SelectTrigger data-testid="zone-filter">
                        <SelectValue placeholder="Zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Zones</SelectItem>
                        {zones.map(z => (
                          <SelectItem key={z} value={z}>{z}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Queue Tab */}
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
                              className="cursor-pointer hover:bg-slate-50 transition-colors duration-150"
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
                              <TableCell className="text-slate-600">{incident.owner || '—'}</TableCell>
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

            {/* Map Tab */}
            <TabsContent value="map" className="flex-1 mt-0">
              <Card className="h-full border-slate-200">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Hotspot Map</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      className={cn("gap-2", showHeatmap && "bg-civic-blue/5 border-civic-blue/30 text-civic-blue")}
                      data-testid="heatmap-toggle"
                    >
                      <Layers className="w-4 h-4" strokeWidth={1.5} />
                      {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 h-[calc(100vh-280px)]">
                  {loading ? (
                    <MapSkeleton />
                  ) : (
                    <IncidentMap 
                      incidents={filteredIncidents}
                      showHeatmap={showHeatmap}
                      onIncidentClick={setSelectedIncident}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        {/* Incident Detail Modal */}
        <IncidentDetailDialog 
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onStatusUpdate={handleStatusUpdate}
          onAssign={handleAssign}
        />
      </div>
    </div>
  );
}

// Incident Detail Dialog Component
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

          {/* Assignment Section */}
          <div className="pt-4 border-t border-slate-100">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Assignment</label>
            <div className="flex gap-2">
              <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                <SelectTrigger className="flex-1" data-testid="assign-select">
                  <SelectValue placeholder="Select worker team..." />
                </SelectTrigger>
                <SelectContent>
                  {workerTeams.map(team => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => selectedWorker && onAssign(incident.incident_id, selectedWorker)}
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
