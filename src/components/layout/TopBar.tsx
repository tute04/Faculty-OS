import React from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { BookOpen, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

const titles: Record<string, string> = {
  '/exams': 'Seguimiento de Exámenes',
  '/planner': 'Planificador Semanal',
};

export const TopBar: React.FC = () => {
  const location = useLocation();
  const title = titles[location.pathname] ?? 'Faculty OS';

  return (
    <>
      {/* Desktop top bar */}
      <header className="hidden md:flex items-center h-14 px-6 border-b border-border bg-surface shrink-0">
        <h1 className="text-sm font-semibold text-text-primary">{title}</h1>
      </header>

      {/* Mobile top bar */}
      <header className="flex md:hidden items-center justify-between h-14 px-4 border-b border-border bg-surface shrink-0">
        <span className="text-sm font-semibold text-text-primary">{title}</span>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex bg-surface border-t border-border">
        <NavLink to="/exams" className="flex-1">
          {({ isActive }) => (
            <div className={cn('flex flex-col items-center gap-1 py-3', isActive ? 'text-accent' : 'text-text-muted')}>
              <BookOpen size={20} />
              <span className="text-[10px] font-medium">Exámenes</span>
            </div>
          )}
        </NavLink>
        <NavLink to="/planner" className="flex-1">
          {({ isActive }) => (
            <div className={cn('flex flex-col items-center gap-1 py-3', isActive ? 'text-accent' : 'text-text-muted')}>
              <Calendar size={20} />
              <span className="text-[10px] font-medium">Planificador</span>
            </div>
          )}
        </NavLink>
      </nav>
    </>
  );
};
