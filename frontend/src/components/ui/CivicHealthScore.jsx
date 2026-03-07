import { Card, CardContent, CardHeader, CardTitle } from './card';
import { TrendingUp, TrendingDown, Minus, Heart, Trash2, Construction, Shield, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

const categories = [
  { key: 'sanitation', label: 'Sanitation', icon: Trash2, score: 68 },
  { key: 'infrastructure', label: 'Infrastructure', icon: Construction, score: 75 },
  { key: 'publicSafety', label: 'Public Safety', icon: Shield, score: 70 },
  { key: 'community', label: 'Community Issues', icon: Users, score: 74 }
];

export const CivicHealthScore = ({ 
  overallScore = 72, 
  trend = 4, 
  categoryScores = categories 
}) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score) => {
    if (score >= 80) return 'from-green-500 to-green-400';
    if (score >= 60) return 'from-amber-500 to-amber-400';
    return 'from-red-500 to-red-400';
  };

  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp className="w-4 h-4" strokeWidth={2} />;
    if (trend < 0) return <TrendingDown className="w-4 h-4" strokeWidth={2} />;
    return <Minus className="w-4 h-4" strokeWidth={2} />;
  };

  const getTrendColor = () => {
    if (trend > 0) return 'text-green-600 bg-green-100';
    if (trend < 0) return 'text-red-600 bg-red-100';
    return 'text-slate-600 bg-slate-100';
  };

  return (
    <Card className="border-slate-200 overflow-hidden" data-testid="civic-health-score">
      <CardHeader className="pb-3 bg-gradient-to-r from-civic-blue/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-civic-blue/10 flex items-center justify-center">
              <Heart className="w-4 h-4 text-civic-blue" strokeWidth={1.5} />
            </div>
            <CardTitle className="text-base font-semibold text-slate-900">Montgomery Civic Health</CardTitle>
          </div>
          <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold", getTrendColor())}>
            {getTrendIcon()}
            {trend > 0 ? '+' : ''}{trend} this month
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {/* Main Score Circle */}
        <div className="flex items-center justify-center py-6">
          <div className="relative">
            <svg className="w-36 h-36 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="#E2E8F0"
                strokeWidth="12"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="url(#healthGradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(overallScore / 100) * 402} 402`}
              />
              <defs>
                <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1F4E79" />
                  <stop offset="100%" stopColor="#4CAF50" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-4xl font-bold", getScoreColor(overallScore))}>{overallScore}</span>
              <span className="text-sm text-slate-500 font-medium">/ 100</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3 mt-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Breakdown</span>
          {categoryScores.map((cat) => (
            <div key={cat.key} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <cat.icon className="w-4 h-4 text-slate-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">{cat.label}</span>
                  <span className={cn("text-sm font-bold", getScoreColor(cat.score))}>{cat.score}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", getScoreGradient(cat.score))}
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
