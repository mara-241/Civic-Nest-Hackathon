import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

export const ErrorState = ({ message = "Something went wrong", onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">Error</h3>
      <p className="text-sm text-slate-500 mb-4 max-w-sm">{message}</p>
      {onRetry && (
        <Button 
          variant="outline" 
          onClick={onRetry}
          className="gap-2"
          data-testid="retry-btn"
        >
          <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
          Try Again
        </Button>
      )}
    </div>
  );
};

export const EmptyState = ({ title, description, icon: Icon, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  );
};
