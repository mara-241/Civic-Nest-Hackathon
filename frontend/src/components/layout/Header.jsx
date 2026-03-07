import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

export const Header = ({ title, showChangePersona = true }) => {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-civic-blue flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-semibold text-slate-900 text-lg leading-tight">{title}</h1>
          <p className="text-xs text-slate-500">CivicNest</p>
        </div>
      </div>
      
      {showChangePersona && (
        <Link to="/">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 text-slate-600 hover:text-civic-blue hover:border-civic-blue/30"
            data-testid="change-persona-btn"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Change Persona
          </Button>
        </Link>
      )}
    </header>
  );
};
