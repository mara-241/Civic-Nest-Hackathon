import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { TrendChart, CategoryChart, ZoneChart } from '../../components/charts/InsightCharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ChartSkeleton, TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { RecurrenceBar } from '../../components/ui/RecurrenceBar';
import { CivicHealthScore } from '../../components/ui/CivicHealthScore';
import { InterventionImpactCard } from '../../components/ui/InterventionImpactCard';
import { getInsights, getEscalations, createEscalation } from '../../services/api';
import { BarChart3, TrendingUp, AlertOctagon, Activity, CheckCircle, Clock, AlertTriangle, Plus, Rocket, RefreshCw } from 'lucide-react';
import { issueCategories, interventionTypes } from '../../mockData/incidents';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

const DEFAULT_ESCALATION_FILTERS = {
  status: 'all',
  issue_category: 'all',
  intervention_type: 'all',
  sort: 'newest',
  query: ''
};

const tabRouteMap = {
  insights: '/admin',
  trends: '/admin/trends',
  escalations: '/admin/escalations'
};

const routeTabMap = {
  '/admin': 'insights',
  '/admin/trends': 'trends',
  '/admin/escalations': 'escalations'
};

export default function AdminPortal() {
  const location = useLocation();
  const navigate = useNavigate();

  const [insights, setInsights] = useState(null);
  const [escalations, setEscalations] = useState([]);
  const [escalationMeta, setEscalationMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('insights');
  const [showNewEscalation, setShowNewEscalation] = useState(false);
  const [escalationFilters, setEscalationFilters] = useState(DEFAULT_ESCALATION_FILTERS);
  const [escalationCreateState, setEscalationCreateState] = useState({ submitting: false, error: null, success: null });
  const [newEscalationDraft, setNewEscalationDraft] = useState(null);
  const [focusedHotspotArea, setFocusedHotspotArea] = useState('');

  const fetchData = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const [insightsData, escalationsData] = await Promise.all([getInsights(), getEscalations()]);
      setInsights(insightsData);
      setEscalations(escalationsData.escalations || []);
      setEscalationMeta(escalationsData.meta || null);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const normalizedPath = location.pathname.endsWith('/') && location.pathname.length > 1
      ? location.pathname.slice(0, -1)
      : location.pathname;
    setActiveTab(routeTabMap[normalizedPath] || 'insights');
  }, [location.pathname]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleNewEscalation = async (data) => {
    setEscalationCreateState({ submitting: true, error: null, success: null });
    try {
      const result = await createEscalation(data);
      if (!result?.success || !result?.escalation) {
        throw new Error('Escalation was not saved');
      }

      setEscalations((prev) => [result.escalation, ...prev.filter((x) => x.id !== result.escalation.id)]);
      setEscalationCreateState({ submitting: false, error: null, success: `Escalation ${result.escalation.id} launched.` });
      setShowNewEscalation(false);
      setNewEscalationDraft(null);

      fetchData({ silent: true });
    } catch (err) {
      setEscalationCreateState({
        submitting: false,
        error: err?.message || 'Failed to create escalation. Please retry.',
        success: null
      });
    }
  };

  const filteredEscalations = useMemo(() => {
    const q = escalationFilters.query.trim().toLowerCase();
    const sorted = [...escalations]
      .filter((esc) => escalationFilters.status === 'all' || esc.status === escalationFilters.status)
      .filter((esc) => escalationFilters.issue_category === 'all' || esc.issue_category === escalationFilters.issue_category)
      .filter((esc) => escalationFilters.intervention_type === 'all' || esc.intervention_type === escalationFilters.intervention_type)
      .filter((esc) => {
        if (!q) return true;
        return [esc.id, esc.area, esc.issue_category, esc.intervention_type, esc.status, esc.incident_id]
          .filter(Boolean)
          .some((f) => String(f).toLowerCase().includes(q));
      });

    sorted.sort((a, b) => {
      if (escalationFilters.sort === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (escalationFilters.sort === 'recurrence_desc') {
        return Number(b.recurrence_score || 0) - Number(a.recurrence_score || 0);
      }
      if (escalationFilters.sort === 'recurrence_asc') {
        return Number(a.recurrence_score || 0) - Number(b.recurrence_score || 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return sorted;
  }, [escalations, escalationFilters]);

  const escalationStats = useMemo(() => ({
    total: escalations.length,
    active: escalations.filter((e) => e.status === 'active').length,
    completed: escalations.filter((e) => e.status === 'completed').length,
    cancelled: escalations.filter((e) => e.status === 'cancelled').length
  }), [escalations]);

  const trendSignals = useMemo(() => insights?.trendSignals || {
    zone_momentum: [],
    category_momentum: [],
    action_candidates: []
  }, [insights]);

  const visibleHotspots = useMemo(() => {
    const hotspots = insights?.hotspots || [];
    if (!focusedHotspotArea) return hotspots;
    return hotspots.filter((hotspot) => hotspot.area === focusedHotspotArea);
  }, [insights, focusedHotspotArea]);

  const insightSparseMeta = insights?.meta?.sparse || {};

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
    navigate(tabRouteMap[nextTab] || '/admin');
  };

  return (
    <div className="flex h-screen bg-slate-50" data-testid="admin-portal">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="City Dashboard" />

        <main className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-white border border-slate-200" data-testid="admin-tabs">
                <TabsTrigger value="insights" className="gap-2 data-[state=active]:bg-civic-blue data-[state=active]:text-white" data-testid="tab-insights">
                  <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
                  Insights
                </TabsTrigger>
                <TabsTrigger value="trends" className="gap-2 data-[state=active]:bg-civic-blue data-[state=active]:text-white" data-testid="tab-trends">
                  <TrendingUp className="w-4 h-4" strokeWidth={1.5} />
                  Trends
                </TabsTrigger>
                <TabsTrigger value="escalations" className="gap-2 data-[state=active]:bg-civic-blue data-[state=active]:text-white" data-testid="tab-escalations">
                  <AlertOctagon className="w-4 h-4" strokeWidth={1.5} />
                  Escalations
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="insights" className="mt-0 space-y-6">
              {loading ? (
                <>
                  <div className="grid grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <ChartSkeleton key={i} />)}
                  </div>
                  <ChartSkeleton />
                </>
              ) : error ? (
                <ErrorState message={error} onRetry={fetchData} />
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard title="Total Incidents" value={insights.summary.total_incidents} icon={Activity} color="blue" />
                    <KPICard title="Resolved This Week" value={insights.summary.resolved_this_week} icon={CheckCircle} color="green" />
                    <KPICard title="Avg Resolution Time" value={insights.summary.avg_resolution_time} icon={Clock} color="amber" />
                    <KPICard title="High Priority" value={insights.summary.high_priority_count} icon={AlertTriangle} color="red" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <TrendChart data={insights.trends} />
                    </div>
                    <CivicHealthScore overallScore={72} trend={4} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CategoryChart data={insights.categoryBreakdown} />
                    <InterventionImpactCard zone="Zone 3" issueCategory="Illegal Dumping" interventionType="Cleanup Campaign" beforeCount={21} afterCount={8} />
                  </div>

                  <Card className="border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Zone Risk Assessment</CardTitle>
                      <CardDescription>Hotspot zones ranked by recurrence score</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead>Zone</TableHead>
                            <TableHead>Incidents</TableHead>
                            <TableHead className="w-[250px]">Recurrence Score</TableHead>
                            <TableHead>Risk Level</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {insights.zoneRanking.map((zone) => (
                            <TableRow key={zone.zone}>
                              <TableCell className="font-medium">{zone.zone}</TableCell>
                              <TableCell>{zone.incidents}</TableCell>
                              <TableCell><RecurrenceBar score={zone.recurrence_score} showLabel={false} /></TableCell>
                              <TableCell><RiskBadge risk={zone.risk} /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="trends" className="mt-0 space-y-6" data-testid="hotspot-trends-tab">
              {loading ? (
                <ChartSkeleton />
              ) : error ? (
                <ErrorState message={error} onRetry={fetchData} />
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {insightSparseMeta.trends ? (
                      <Card className="border-slate-200" data-testid="trends-live-empty-state">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold">Incident Trends</CardTitle>
                          <CardDescription>Live backend returned no trend buckets yet.</CardDescription>
                        </CardHeader>
                      </Card>
                    ) : (
                      <TrendChart data={insights.trends} />
                    )}
                    {insightSparseMeta.zones ? (
                      <Card className="border-slate-200" data-testid="zones-live-empty-state">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold">Zone Distribution</CardTitle>
                          <CardDescription>No live zone ranking data is currently available.</CardDescription>
                        </CardHeader>
                      </Card>
                    ) : (
                      <ZoneChart data={insights.zoneRanking} />
                    )}
                  </div>

                  <Card className="border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Active Hotspots</CardTitle>
                      <CardDescription data-testid="trend-signal-summary">
                        {trendSignals.zone_momentum?.[0]?.key
                          ? `Top movement: ${trendSignals.zone_momentum[0].key} (${trendSignals.zone_momentum[0].delta_count >= 0 ? '+' : ''}${trendSignals.zone_momentum[0].delta_count} incidents)`
                          : 'Areas with concentrated incident activity'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {focusedHotspotArea ? (
                        <div className="mb-3 flex items-center justify-between" data-testid="hotspot-focus-banner">
                          <p className="text-xs text-slate-500">Focused hotspot: <span className="font-medium text-slate-700">{focusedHotspotArea}</span></p>
                          <Button size="sm" variant="ghost" onClick={() => setFocusedHotspotArea('')} data-testid="clear-hotspot-focus-btn">Clear focus</Button>
                        </div>
                      ) : null}
                      {visibleHotspots.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-500" data-testid="hotspots-empty-state">
                          {insightSparseMeta.hotspots
                            ? 'Live backend returned zero hotspot rows. No synthetic hotspots are being shown.'
                            : 'No hotspots match the active focus.'}
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50">
                              <TableHead>Area</TableHead>
                              <TableHead>Incidents</TableHead>
                              <TableHead className="w-[250px]">Recurrence Score</TableHead>
                              <TableHead>Coordinates</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {visibleHotspots.map((hotspot, idx) => {
                              const [area = hotspot.area, maybeCategory] = String(hotspot.area || '').split('·').map((p) => p.trim());
                              return (
                                <TableRow key={hotspot.area || idx} data-testid={`hotspot-row-${idx}`}>
                                  <TableCell className="font-medium">{hotspot.area}</TableCell>
                                  <TableCell>{hotspot.incidents}</TableCell>
                                  <TableCell><RecurrenceBar score={hotspot.recurrence_score} /></TableCell>
                                  <TableCell className="text-slate-500 text-sm font-mono">
                                    {hotspot.lat.toFixed(3)}, {hotspot.lon.toFixed(3)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2 justify-end">
                                      <Button size="sm" variant="outline" onClick={() => setFocusedHotspotArea(hotspot.area)} data-testid={`focus-hotspot-btn-${idx}`}>
                                        Focus
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1 text-civic-blue border-civic-blue/30 hover:bg-civic-blue/5"
                                        onClick={() => {
                                          setNewEscalationDraft({
                                            area,
                                            issue_category: maybeCategory || '',
                                            recurrence_score: hotspot.recurrence_score || 0.7,
                                            intervention_type: '',
                                            reason: ''
                                          });
                                          setShowNewEscalation(true);
                                          handleTabChange('escalations');
                                        }}
                                        data-testid={`prep-escalation-btn-${idx}`}
                                      >
                                        <Rocket className="w-3 h-3" strokeWidth={1.5} />
                                        Escalate
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="escalations" className="mt-0 space-y-6" data-testid="escalations-tab-content">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Escalation Manager</h2>
                  <p className="text-sm text-slate-500">Launch and track intervention campaigns</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fetchData()}
                    className="gap-2"
                    data-testid="refresh-escalations-btn"
                  >
                    <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                    Refresh
                  </Button>
                  <Button
                    className="bg-civic-blue hover:bg-civic-blue-hover text-white gap-2"
                    onClick={() => {
                      setEscalationCreateState({ submitting: false, error: null, success: null });
                      setNewEscalationDraft(null);
                      setShowNewEscalation(true);
                    }}
                    data-testid="new-escalation-btn"
                  >
                    <Plus className="w-4 h-4" strokeWidth={1.5} />
                    New Escalation
                  </Button>
                </div>
              </div>

              {escalationCreateState.success && (
                <div className="border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-md px-3 py-2 text-sm" data-testid="escalation-create-success">
                  {escalationCreateState.success}
                </div>
              )}

              {escalationMeta && (
                <div className="text-xs text-slate-500 space-y-1" data-testid="escalation-listing-meta">
                  <div>
                    Listing source: {escalationMeta.source === 'backend_list'
                      ? `Backend escalations endpoint${escalationMeta.backendListPath ? ` (${escalationMeta.backendListPath})` : ''}`
                      : escalationMeta.source === 'queue_derived'
                        ? 'Derived from operations queue + local cache (backend list unavailable)'
                        : 'Mock fallback + local cache'}
                  </div>
                  {Array.isArray(escalationMeta.probes) && escalationMeta.probes.length > 0 ? (
                    <div data-testid="escalation-listing-probes">
                      Probe results: {escalationMeta.probes.map((p) => `${p.path}:${p.ok ? 'ok' : (p.status || 'err')}`).join(' · ')}
                    </div>
                  ) : null}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="escalation-stats">
                <MiniStatCard label="Total" value={escalationStats.total} testId="stat-total" />
                <MiniStatCard label="Active" value={escalationStats.active} testId="stat-active" />
                <MiniStatCard label="Completed" value={escalationStats.completed} testId="stat-completed" />
                <MiniStatCard label="Cancelled" value={escalationStats.cancelled} testId="stat-cancelled" />
              </div>

              <Card className="border-slate-200">
                <CardContent className="p-4 border-b border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3" data-testid="escalation-filters">
                    <Input
                      value={escalationFilters.query}
                      onChange={(e) => setEscalationFilters((prev) => ({ ...prev, query: e.target.value }))}
                      placeholder="Search ID, area, category..."
                      data-testid="escalation-filter-query"
                    />
                    <Select value={escalationFilters.status} onValueChange={(v) => setEscalationFilters((prev) => ({ ...prev, status: v }))}>
                      <SelectTrigger data-testid="escalation-filter-status"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        {['all', 'active', 'completed', 'cancelled'].map((s) => <SelectItem key={s} value={s}>{s === 'all' ? 'All statuses' : s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={escalationFilters.issue_category} onValueChange={(v) => setEscalationFilters((prev) => ({ ...prev, issue_category: v }))}>
                      <SelectTrigger data-testid="escalation-filter-category"><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {[...new Set([...issueCategories, ...escalations.map((e) => e.issue_category).filter(Boolean)])].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={escalationFilters.intervention_type} onValueChange={(v) => setEscalationFilters((prev) => ({ ...prev, intervention_type: v }))}>
                      <SelectTrigger data-testid="escalation-filter-intervention"><SelectValue placeholder="Intervention" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All interventions</SelectItem>
                        {[...new Set([...interventionTypes, ...escalations.map((e) => e.intervention_type).filter(Boolean)])].map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={escalationFilters.sort} onValueChange={(v) => setEscalationFilters((prev) => ({ ...prev, sort: v }))}>
                      <SelectTrigger data-testid="escalation-filter-sort"><SelectValue placeholder="Sort" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest first</SelectItem>
                        <SelectItem value="oldest">Oldest first</SelectItem>
                        <SelectItem value="recurrence_desc">Highest recurrence</SelectItem>
                        <SelectItem value="recurrence_asc">Lowest recurrence</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEscalationFilters(DEFAULT_ESCALATION_FILTERS)} data-testid="escalation-clear-filters-btn">
                      Clear filters
                    </Button>
                  </div>
                </CardContent>

                <CardContent className="p-0">
                  {loading ? (
                    <TableSkeleton rows={5} />
                  ) : error && escalations.length === 0 ? (
                    <div className="p-6"><ErrorState message={error} onRetry={fetchData} /></div>
                  ) : filteredEscalations.length === 0 ? (
                    <div className="p-8 text-center" data-testid="escalations-empty-state">
                      <p className="text-slate-700 font-medium">No escalations match your current filters.</p>
                      <p className="text-sm text-slate-500 mt-1">Clear filters or launch a new escalation campaign.</p>
                    </div>
                  ) : (
                    <Table data-testid="escalations-table">
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead>ID</TableHead>
                          <TableHead>Area</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="w-[180px]">Recurrence</TableHead>
                          <TableHead>Intervention</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEscalations.map((esc) => (
                          <TableRow key={esc.id} data-testid={`escalation-row-${esc.id}`}>
                            <TableCell className="font-medium text-civic-blue">{esc.id}</TableCell>
                            <TableCell>{esc.area}</TableCell>
                            <TableCell>{esc.issue_category}</TableCell>
                            <TableCell><RecurrenceBar score={esc.recurrence_score} showLabel={false} size="sm" /></TableCell>
                            <TableCell><Badge variant="outline" className="bg-slate-50">{esc.intervention_type}</Badge></TableCell>
                            <TableCell><EscalationStatusBadge status={esc.status} /></TableCell>
                            <TableCell className="text-xs text-slate-500">
                              <div>{esc.source || 'unknown'}</div>
                              {esc.source_note ? <div className="text-[11px] text-amber-700 mt-0.5">{esc.source_note}</div> : null}
                            </TableCell>
                            <TableCell className="text-slate-500 text-sm">{format(new Date(esc.created_at), 'MMM d, HH:mm')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        <NewEscalationDialog
          open={showNewEscalation}
          onClose={() => {
            if (!escalationCreateState.submitting) {
              setShowNewEscalation(false);
              setNewEscalationDraft(null);
            }
          }}
          onSubmit={handleNewEscalation}
          initialData={newEscalationDraft}
          submitting={escalationCreateState.submitting}
          submitError={escalationCreateState.error}
        />
      </div>
    </div>
  );
}

const KPICard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          </div>
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colors[color])}>
            <Icon className="w-6 h-6" strokeWidth={1.5} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MiniStatCard = ({ label, value, testId }) => (
  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2" data-testid={testId}>
    <div className="text-xs text-slate-500">{label}</div>
    <div className="text-xl font-semibold text-slate-900">{value}</div>
  </div>
);

const RiskBadge = ({ risk }) => {
  const variants = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-green-100 text-green-700 border-green-200'
  };

  return <Badge variant="outline" className={cn('capitalize font-medium', variants[risk])}>{risk} Risk</Badge>;
};

const EscalationStatusBadge = ({ status }) => {
  const variants = {
    active: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  return <Badge variant="outline" className={cn('capitalize font-medium', variants[status] || variants.cancelled)}>{status}</Badge>;
};

const NewEscalationDialog = ({ open, onClose, onSubmit, initialData, submitting, submitError }) => {
  const [form, setForm] = useState({
    area: '',
    issue_category: '',
    recurrence_score: 0.7,
    intervention_type: '',
    reason: ''
  });

  useEffect(() => {
    if (open) {
      setForm({
        area: initialData?.area || '',
        issue_category: initialData?.issue_category || '',
        recurrence_score: initialData?.recurrence_score || 0.7,
        intervention_type: initialData?.intervention_type || '',
        reason: initialData?.reason || ''
      });
    }
  }, [open, initialData]);

  const handleSubmit = () => {
    if (form.area && form.issue_category && form.intervention_type && !submitting) {
      onSubmit(form);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md" data-testid="new-escalation-modal">
        <DialogHeader>
          <DialogTitle>Launch New Escalation</DialogTitle>
          <DialogDescription>Create an intervention campaign for a high-risk area</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {submitError && (
            <div className="text-sm rounded-md px-3 py-2 border border-red-200 bg-red-50 text-red-700" data-testid="escalation-submit-error">
              {submitError}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Area / Location</label>
            <Input
              value={form.area}
              onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))}
              placeholder="e.g., Downtown Commercial"
              data-testid="escalation-area-input"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Issue Category</label>
            <Select value={form.issue_category} onValueChange={(v) => setForm((prev) => ({ ...prev, issue_category: v }))}>
              <SelectTrigger data-testid="escalation-category-select"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>{issueCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Intervention Type</label>
            <Select value={form.intervention_type} onValueChange={(v) => setForm((prev) => ({ ...prev, intervention_type: v }))}>
              <SelectTrigger data-testid="escalation-intervention-select"><SelectValue placeholder="Select intervention" /></SelectTrigger>
              <SelectContent>{interventionTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Reason (optional)</label>
            <Input
              value={form.reason}
              onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="Escalation rationale"
              data-testid="escalation-reason-input"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Recurrence Score Threshold</label>
            <RecurrenceBar score={form.recurrence_score} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.area || !form.issue_category || !form.intervention_type || submitting}
            className="bg-civic-blue hover:bg-civic-blue-hover text-white gap-2"
            data-testid="submit-escalation-btn"
          >
            <Rocket className="w-4 h-4" strokeWidth={1.5} />
            {submitting ? 'Launching...' : 'Launch Escalation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
