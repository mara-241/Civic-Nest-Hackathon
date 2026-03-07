import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

const COLORS = {
  primary: '#1F4E79',
  secondary: '#4CAF50',
  accent: '#E3F2FD',
  chart: ['#1F4E79', '#4CAF50', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#64748B']
};

export const TrendChart = ({ data }) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="trend-chart">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Incident Trends</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#64748B' }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="incidents" 
            stroke={COLORS.primary} 
            fill="url(#colorIncidents)" 
            name="New Incidents"
          />
          <Area 
            type="monotone" 
            dataKey="resolved" 
            stroke={COLORS.secondary} 
            fill="url(#colorResolved)" 
            name="Resolved"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CategoryChart = ({ data }) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="category-chart">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Issues by Category</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis type="number" tick={{ fontSize: 12, fill: '#64748B' }} />
          <YAxis 
            type="category" 
            dataKey="category" 
            tick={{ fontSize: 11, fill: '#64748B' }}
            width={120}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #E2E8F0',
              borderRadius: '8px'
            }}
          />
          <Bar dataKey="count" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ZoneChart = ({ data }) => {
  const chartData = data.map((item, index) => ({
    ...item,
    fill: COLORS.chart[index % COLORS.chart.length]
  }));

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="zone-chart">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Zone Distribution</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="incidents"
            nameKey="zone"
            label={({ zone, percent }) => `${zone}: ${(percent * 100).toFixed(0)}%`}
            labelLine={{ stroke: '#94A3B8', strokeWidth: 1 }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #E2E8F0',
              borderRadius: '8px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
