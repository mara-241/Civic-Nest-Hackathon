import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

export const Sidebar = ({ items, persona }) => {
  const bgColors = {
    resident: 'bg-white',
    worker: 'bg-white',
    admin: 'bg-slate-900'
  };
  
  const textColors = {
    resident: 'text-slate-600',
    worker: 'text-slate-600',
    admin: 'text-slate-300'
  };
  
  const activeColors = {
    resident: 'bg-civic-blue/10 text-civic-blue border-l-2 border-civic-blue',
    worker: 'bg-civic-blue/10 text-civic-blue border-l-2 border-civic-blue',
    admin: 'bg-civic-blue text-white'
  };
  
  const hoverColors = {
    resident: 'hover:bg-slate-50 hover:text-slate-900',
    worker: 'hover:bg-slate-50 hover:text-slate-900',
    admin: 'hover:bg-slate-800'
  };

  return (
    <aside className={cn(
      "w-64 border-r border-slate-200 hidden lg:flex flex-col",
      bgColors[persona]
    )}>
      <nav className="flex-1 p-4 space-y-1" data-testid={`${persona}-sidebar`}>
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200",
              textColors[persona],
              hoverColors[persona],
              isActive && activeColors[persona]
            )}
            data-testid={`nav-${item.id}`}
          >
            <item.icon className="w-5 h-5" strokeWidth={1.5} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
