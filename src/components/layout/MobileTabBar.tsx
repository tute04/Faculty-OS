import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookMarked, BookOpen, CalendarDays, Sun, Moon, LayoutList, BarChart2, LogOut } from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { useAuth } from '../../lib/auth';
import { cn } from '../../lib/utils';

export const MobileTabBar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex bg-elevated border-t border-border shadow-2xl backdrop-blur-xl pb-safe">
      <div className="flex w-full justify-around items-center px-1">
        <NavLink to="/dashboard" className="flex-1 flex justify-center py-4">
          {({ isActive }) => <LayoutDashboard size={20} strokeWidth={isActive ? 2.5 : 2} className={cn('transition-colors', isActive ? 'text-amber' : 'text-text-muted hover:text-text-primary')} />}
        </NavLink>
        <NavLink to="/examenes" className="flex-1 flex justify-center py-4">
          {({ isActive }) => <BookMarked size={20} strokeWidth={isActive ? 2.5 : 2} className={cn('transition-colors', isActive ? 'text-amber' : 'text-text-muted hover:text-text-primary')} />}
        </NavLink>
        <NavLink to="/planner" className="flex-1 flex justify-center py-4">
          {({ isActive }) => <CalendarDays size={20} strokeWidth={isActive ? 2.5 : 2} className={cn('transition-colors', isActive ? 'text-amber' : 'text-text-muted hover:text-text-primary')} />}
        </NavLink>
        <NavLink to="/materias" className="flex-1 flex justify-center py-4">
          {({ isActive }) => <BookOpen size={20} strokeWidth={isActive ? 2.5 : 2} className={cn('transition-colors', isActive ? 'text-amber' : 'text-text-muted hover:text-text-primary')} />}
        </NavLink>
        <button onClick={toggleTheme} className="flex-1 flex justify-center py-4 text-text-muted hover:text-amber transition-colors">
          {theme === 'dark' ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
        </button>
        <button onClick={signOut} className="flex-1 flex justify-center py-4 text-red/70 hover:text-red transition-colors" title="Cerrar sesión">
          <LogOut size={20} strokeWidth={2} />
        </button>
      </div>
    </nav>
  );
};
