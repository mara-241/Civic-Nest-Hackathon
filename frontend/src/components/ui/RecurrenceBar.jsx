import { cn } from '../../lib/utils';

export const RecurrenceBar = ({ score, showLabel = true, size = 'default' }) => {
  const percentage = Math.round(score * 100);
  
  const getColor = () => {
    if (score >= 0.7) return 'bg-red-500';
    if (score >= 0.4) return 'bg-amber-500';
    return 'bg-green-500';
  };
  
  const getRiskLabel = () => {
    if (score >= 0.7) return 'High Risk';
    if (score >= 0.4) return 'Medium Risk';
    return 'Low Risk';
  };

  const heights = {
    sm: 'h-1.5',
    default: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className="flex items-center gap-3">
      <div className={cn("flex-1 bg-slate-100 rounded-full overflow-hidden", heights[size])}>
        <div 
          className={cn("h-full rounded-full transition-all duration-500", getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn(
          "text-xs font-medium whitespace-nowrap",
          score >= 0.7 ? 'text-red-600' : score >= 0.4 ? 'text-amber-600' : 'text-green-600'
        )}>
          {percentage}% · {getRiskLabel()}
        </span>
      )}
    </div>
  );
};
