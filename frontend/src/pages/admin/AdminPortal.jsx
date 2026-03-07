import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';
import { TrendChart, CategoryChart, ZoneChart } from '../../components/charts/InsightCharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ChartSkeleton, TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { RecurrenceBar } from '../../components/ui/RecurrenceBar';
import { CivicHealthScore } from '../../components/ui/CivicHealthScore';
import { InterventionImpactCard } from '../../components/ui/InterventionImpactCard';
import { getInsights, getEscalations, createEscalation } from '../../services/api';
import { BarChart3, TrendingUp, AlertOctagon, Activity, CheckCircle, Clock, AlertTriangle, Plus, Rocket } from 'lucide-react';
import { issueCategories, interventionTypes, zones } from '../../mockData/incidents';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

const sidebarItems = [
  { id: 'insights', label: 'City Insights', icon: BarChart3, path: '/admin' },
  { id: 'trends', label: 'Hotspot Trends', icon: TrendingUp, path: '/admin/trends' },
  { id: 'escalations', label: 'Escalation Manager', icon: AlertOctagon, path: '/admin/escalations' }
];

export default function AdminPortal() {
  const [insights, setInsights] = useState(null);
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('insights');
  const [showNewEscalation, setShowNewEscalation] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [insightsData, escalationsData] = await Promise.all([
        getInsights(),
        getEscalations()
      ]);
      setInsights(insightsData);
      setEscalations(escalationsData.escalations);
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleNewEscalation = async (data) => {
    try {
      const result = await createEscalation(data);
      if (result.success) {
        setEscalations(prev => [...prev, result.escalation]);
        setShowNewEscalation(false);
      }
    } catch (err) {
      console.error("Failed to create escalation:", err);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50" data-testid="admin-portal">
      <Sidebar items={sidebarItems} persona="admin" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="City Dashboard" />
        
        <main className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-white border border-slate-200">
                <TabsTrigger value="insights" className="gap-2 data-[state=active]:bg-civic-blue data-[state=active]:text-white">
                  <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
                  Insights
                </TabsTrigger>
                <TabsTrigger value="trends" className="gap-2 data-[state=active]:bg-civic-blue data-[state=active]:text-white">
                  <TrendingUp className="w-4 h-4" strokeWidth={1.5} />
                  Trends
                </TabsTrigger>
                <TabsTrigger value="escalations" className="gap-2 data-[state=active]:bg-civic-blue data-[state=active]:text-white">
                  <AlertOctagon className="w-4 h-4" strokeWidth={1.5} />
                  Escalations
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Insights Tab */}
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
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard 
                      title="Total Incidents"
                      value={insights.summary.total_incidents}
                      icon={Activity}
                      color="blue"
                    />
                    <KPICard 
                      title="Resolved This Week"
                      value={insights.summary.resolved_this_week}
                      icon={CheckCircle}
                      color="green"
                    />
                    <KPICard 
                      title="Avg Resolution Time"
                      value={insights.summary.avg_resolution_time}
                      icon={Clock}
                      color="amber"
                    />
                    <KPICard 
                      title="High Priority"
                      value={insights.summary.high_priority_count}
                      icon={AlertTriangle}
                      color="red"
                    />
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <TrendChart data={insights.trends} />
                    </div>
                    <CivicHealthScore 
                      overallScore={72}
                      trend={4}
                    />
                  </div>

                  {/* Category Chart and Impact Card */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CategoryChart data={insights.categoryBreakdown} />
                    <InterventionImpactCard
                      zone="Zone 3"
                      issueCategory="Illegal Dumping"
                      interventionType="Cleanup Campaign"
                      beforeCount={21}
                      afterCount={8}
                    />
                  </div>

                  {/* Zone Risk Table */}
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
                              <TableCell>
                                <RecurrenceBar score={zone.recurrence_score} showLabel={false} />
                              </TableCell>
                              <TableCell>
                                <RiskBadge risk={zone.risk} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="mt-0 space-y-6">
              {loading ? (
                <ChartSkeleton />
              ) : error ? (
                <ErrorState message={error} onRetry={fetchData} />
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TrendChart data={insights.trends} />
                    <ZoneChart data={insights.zoneRanking} />
                  </div>

                  {/* Hotspots Table */}
                  <Card className="border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Active Hotspots</CardTitle>
                      <CardDescription>Areas with concentrated incident activity</CardDescription>
                    </CardHeader>
                    <CardContent>
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
                          {insights.hotspots.map((hotspot, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{hotspot.area}</TableCell>
                              <TableCell>{hotspot.incidents}</TableCell>
                              <TableCell>
                                <RecurrenceBar score={hotspot.recurrence_score} />
                              </TableCell>
                              <TableCell className="text-slate-500 text-sm font-mono">
                                {hotspot.lat.toFixed(3)}, {hotspot.lon.toFixed(3)}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="gap-1 text-civic-blue border-civic-blue/30 hover:bg-civic-blue/5"
                                  onClick={() => {
                                    setShowNewEscalation(true);
                                    setActiveTab('escalations');
                                  }}
                                  data-testid={`escalate-btn-${idx}`}
                                >
                                  <Rocket className="w-3 h-3" strokeWidth={1.5} />
                                  Escalate
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Escalations Tab */}
            <TabsContent value="escalations" className="mt-0 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Escalation Manager</h2>
                  <p className="text-sm text-slate-500">Launch and track intervention campaigns</p>
                </div>
                <Button 
                  className="bg-civic-blue hover:bg-civic-blue-hover text-white gap-2"
                  onClick={() => setShowNewEscalation(true)}
                  data-testid="new-escalation-btn"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                  New Escalation
                </Button>
              </div>

              {loading ? (
                <TableSkeleton rows={5} />
              ) : (
                <Card className="border-slate-200">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead>ID</TableHead>
                          <TableHead>Area</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="w-[180px]">Recurrence</TableHead>
                          <TableHead>Intervention</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {escalations.map((esc) => (
                          <TableRow key={esc.id} data-testid={`escalation-row-${esc.id}`}>
                            <TableCell className="font-medium text-civic-blue">{esc.id}</TableCell>
                            <TableCell>{esc.area}</TableCell>
                            <TableCell>{esc.issue_category}</TableCell>
                            <TableCell>
                              <RecurrenceBar score={esc.recurrence_score} showLabel={false} size="sm" />
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-slate-50">{esc.intervention_type}</Badge>
                            </TableCell>
                            <TableCell>
                              <EscalationStatusBadge status={esc.status} />
                            </TableCell>
                            <TableCell className="text-slate-500 text-sm">
                              {format(new Date(esc.created_at), 'MMM d, HH:mm')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>

        {/* New Escalation Dialog */}
        <NewEscalationDialog 
          open={showNewEscalation}
          onClose={() => setShowNewEscalation(false)}
          onSubmit={handleNewEscalation}
        />
      </div>
    </div>
  );
}

// KPI Card Component
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
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colors[color])}>
            <Icon className="w-6 h-6" strokeWidth={1.5} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Risk Badge Component
const RiskBadge = ({ risk }) => {
  const variants = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-green-100 text-green-700 border-green-200'
  };

  return (
    <Badge variant="outline" className={cn("capitalize font-medium", variants[risk])}>
      {risk} Risk
    </Badge>
  );
};

// Escalation Status Badge
const EscalationStatusBadge = ({ status }) => {
  const variants = {
    active: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  return (
    <Badge variant="outline" className={cn("capitalize font-medium", variants[status])}>
      {status}
    </Badge>
  );
};

// New Escalation Dialog
const NewEscalationDialog = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    area: '',
    issue_category: '',
    recurrence_score: 0.7,
    intervention_type: ''
  });

  const handleSubmit = () => {
    if (form.area && form.issue_category && form.intervention_type) {
      onSubmit(form);
      setForm({ area: '', issue_category: '', recurrence_score: 0.7, intervention_type: '' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md" data-testid="new-escalation-modal">
        <DialogHeader>
          <DialogTitle>Launch New Escalation</DialogTitle>
          <DialogDescription>
            Create an intervention campaign for a high-risk area
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Area / Location</label>
            <Input
              value={form.area}
              onChange={(e) => setForm(prev => ({ ...prev, area: e.target.value }))}
              placeholder="e.g., Downtown Commercial"
              data-testid="escalation-area-input"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Issue Category</label>
            <Select 
              value={form.issue_category} 
              onValueChange={(v) => setForm(prev => ({ ...prev, issue_category: v }))}
            >
              <SelectTrigger data-testid="escalation-category-select">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {issueCategories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Intervention Type</label>
            <Select 
              value={form.intervention_type} 
              onValueChange={(v) => setForm(prev => ({ ...prev, intervention_type: v }))}
            >
              <SelectTrigger data-testid="escalation-intervention-select">
                <SelectValue placeholder="Select intervention" />
              </SelectTrigger>
              <SelectContent>
                {interventionTypes.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Recurrence Score Threshold</label>
            <RecurrenceBar score={form.recurrence_score} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            disabled={!form.area || !form.issue_category || !form.intervention_type}
            className="bg-civic-blue hover:bg-civic-blue-hover text-white gap-2"
            data-testid="submit-escalation-btn"
          >
            <Rocket className="w-4 h-4" strokeWidth={1.5} />
            Launch Escalation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
