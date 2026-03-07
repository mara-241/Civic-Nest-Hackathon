import { Badge } from './badge';
import { cn } from '../../lib/utils';

export const PriorityBadge = ({ priority }) => {
  const variants = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  return (
    <Badge 
      variant="outline" 
      className={cn("capitalize font-medium", variants[priority])}
    >
      {priority}
    </Badge>
  );
};

export const StatusBadge = ({ status }) => {
  const variants = {
    new: 'bg-blue-100 text-blue-700 border-blue-200',
    assigned: 'bg-purple-100 text-purple-700 border-purple-200',
    resolved: 'bg-green-100 text-green-700 border-green-200',
    monitored: 'bg-amber-100 text-amber-700 border-amber-200'
  };

  return (
    <Badge 
      variant="outline" 
      className={cn("capitalize font-medium", variants[status])}
    >
      {status}
    </Badge>
  );
};
