import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookMarked, BookOpen, CalendarDays, Sun, Moon, LayoutList, BarChart2 } from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { cn } from '../../lib/utils';

export const MobileTabBar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex bg-elevated border-t border-border shadow-2xl backdrop-blur-xl pb-safe">
      <div className="flex w-full justify-around items-center px-1">
        <NavLink to="/dashboard" className="flex-1 flex justify-center py-4">
          {({ isActive }) => <LayoutDashboard size={22} strokeWidth={isActive ? 2.5 : 2} className={cn('transition-colors', isActive ? 'text-amber' : 'text-text-muted hover:text-text-primary')} />}
        </NavLink>
        <NavLink to="/examenes" className="flex-1 flex justify-center py-4">
          {({ isActive }) => <BookMarked size={22} strokeWidth={isActive ? 2.5 : 2} className={cn('transition-colors', isActive ? 'text-amber' : 'text-text-muted hover:text-text-primary')} />}
        </NavLink>
        <NavLink to="/planner" className="flex-1 flex justify-center py-4">
          {({ isActive }) => <CalendarDays size={22} strokeWidth={isActive ? 2.5 : 2} className={cn('transition-colors', isActive ? 'text-amber' : 'text-text-muted hover:text-text-primary')} />}
        </NavLink>
        <NavLink to="/timeline" className="flex-1 flex justify-center py-4">
          {({ isActive }) => <LayoutList size={22} strokeWidth={isActive ? 2.5 : 2} className={cn('transition-colors', isActive ? 'text-amber' : 'text-text-muted hover:text-text-primary')} />}
        </NavLink>
        <NavLink to="/materias" className="flex-1 flex justify-center py-4">
          {({ isActive }) => <BookOpen size={22} strokeWidth={isActive ? 2.5 : 2} className={cn('transition-colors', isActive ? 'text-amber' : 'text-text-muted hover:text-text-primary')} />}
        </NavLink>
        <NavLink to="/estadisticas" className="flex-1 flex justify-center py-4">
          {({ isActive }) => <BarChart2 size={22} strokeWidth={isActive ? 2.5 : 2} className={cn('transition-colors', isActive ? 'text-amber' : 'text-text-muted hover:text-text-primary')} />}
        </NavLink>
        <button onClick={toggleTheme} className="flex-1 flex justify-center py-4 text-text-muted hover:text-amber transition-colors">
          {theme === 'dark' ? <Sun size={22} strokeWidth={2} /> : <Moon size={22} strokeWidth={2} />}
        </button>
      </div>
    </nav>
  );
};
