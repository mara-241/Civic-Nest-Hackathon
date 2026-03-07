import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { RecurrenceBar } from './RecurrenceBar';
import { PriorityBadge } from './PriorityBadge';
import { MapPin, AlertTriangle, Lightbulb, Target, TrendingUp, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

export const AIInsightPanel = ({ 
  issueCategory, 
  zone, 
  recurrenceScore, 
  suggestedIntervention, 
  confidence,
  priority 
}) => {
  return (
    <Card className="border-civic-blue/20 bg-gradient-to-br from-civic-blue/5 to-transparent overflow-hidden" data-testid="ai-insight-panel">
      <CardHeader className="pb-3 border-b border-civic-blue/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-civic-blue/10 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-civic-blue" strokeWidth={1.5} />
          </div>
          <CardTitle className="text-base font-semibold text-civic-blue">AI Civic Insight</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Issue Detected */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-500" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Issue Detected</span>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">{issueCategory}</p>
          </div>
          {priority && <PriorityBadge priority={priority} />}
        </div>

        {/* Location */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-blue-500" strokeWidth={1.5} />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Location</span>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">{zone}</p>
          </div>
        </div>

        {/* Recurrence Risk */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Recurrence Risk</span>
            <div className="mt-1.5">
              <RecurrenceBar score={recurrenceScore} size="default" />
            </div>
          </div>
        </div>

        {/* Suggested Intervention */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
            <Target className="w-4 h-4 text-green-500" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Suggested Intervention</span>
            <p className="text-sm font-medium text-slate-700 mt-0.5 leading-relaxed">{suggestedIntervention}</p>
          </div>
        </div>

        {/* Confidence */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-civic-blue" strokeWidth={1.5} />
            <span className="text-xs font-medium text-slate-500">AI Confidence</span>
          </div>
          <ConfidenceMeter value={confidence} />
        </div>
      </CardContent>
    </Card>
  );
};

const ConfidenceMeter = ({ value }) => {
  const percentage = Math.round(value * 100);
  const getColor = () => {
    if (value >= 0.8) return 'text-green-600 bg-green-100';
    if (value >= 0.6) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className={cn("px-3 py-1 rounded-full text-sm font-bold", getColor())}>
      {percentage}%
    </div>
  );
};
