import { Card, CardContent, CardHeader, CardTitle } from './card';
import { TrendingDown, TrendingUp, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

export const InterventionImpactCard = ({ 
  zone, 
  issueCategory, 
  interventionType,
  beforeCount, 
  afterCount,
  unit = "incidents/week"
}) => {
  const reduction = Math.round(((beforeCount - afterCount) / beforeCount) * 100);
  const isPositive = reduction > 0;

  return (
    <Card className="border-slate-200 overflow-hidden" data-testid="intervention-impact-card">
      <CardHeader className="pb-3 bg-gradient-to-r from-civic-green/10 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900">Intervention Impact</CardTitle>
          <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded">{interventionType}</span>
        </div>
        <p className="text-sm text-slate-600 mt-1">{zone} – {issueCategory}</p>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Before */}
          <div className="bg-red-50/50 rounded-lg p-4 border border-red-100">
            <span className="text-xs font-medium text-red-600 uppercase tracking-wide">Before</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-red-700">{beforeCount}</span>
              <span className="text-xs text-red-500">{unit}</span>
            </div>
          </div>

          {/* After */}
          <div className="bg-green-50/50 rounded-lg p-4 border border-green-100">
            <span className="text-xs font-medium text-green-600 uppercase tracking-wide">After</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-green-700">{afterCount}</span>
              <span className="text-xs text-green-500">{unit}</span>
            </div>
          </div>
        </div>

        {/* Impact */}
        <div className={cn(
          "mt-4 rounded-lg p-4 flex items-center justify-between",
          isPositive ? "bg-civic-green/10" : "bg-red-50"
        )}>
          <div className="flex items-center gap-3">
            {isPositive ? (
              <div className="w-10 h-10 rounded-full bg-civic-green/20 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-civic-green" strokeWidth={2} />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-red-500" strokeWidth={2} />
              </div>
            )}
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Impact</span>
              <p className={cn(
                "text-lg font-bold",
                isPositive ? "text-civic-green" : "text-red-600"
              )}>
                {isPositive ? "↓" : "↑"} {Math.abs(reduction)}% {isPositive ? "reduction" : "increase"}
              </p>
            </div>
          </div>
          <Activity className={cn(
            "w-6 h-6",
            isPositive ? "text-civic-green" : "text-red-500"
          )} strokeWidth={1.5} />
        </div>
      </CardContent>
    </Card>
  );
};
