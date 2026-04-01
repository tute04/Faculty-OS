import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookMarked, BookOpen, CalendarDays, GraduationCap, Sun, Moon, LayoutList, BarChart2, LogOut, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useExams } from '../../hooks/useExams';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { daysUntil } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { CountdownChip } from '../ui/CountdownChip';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/examenes', label: 'Exámenes', icon: BookMarked },
  { to: '/planner', label: 'Planificador', icon: CalendarDays },
  { to: '/timeline', label: 'Timeline', icon: LayoutList },
  { to: '/materias', label: 'Materias', icon: BookOpen },
  { to: '/estadisticas', label: 'Estadísticas', icon: BarChart2 },
];

export const Sidebar: React.FC = () => {
  const { exams } = useExams();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  
  const [showPopover, setShowPopover] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [telegramCode, setTelegramCode] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleConnectTelegram = async () => {
    if (!user) return;
    setLoadingCode(true);
    setShowTelegramModal(true);
    setShowPopover(false);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    await supabase.from('telegram_link_codes').delete().eq('user_id', user.id);
    
    const { error } = await supabase.from('telegram_link_codes').insert({
      code,
      user_id: user.id
    });

    if (error) {
      setTelegramCode('ERROR');
    } else {
      setTelegramCode(code);
    }
    setLoadingCode(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    };
    if (showPopover) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopover]);
  
  const now = new Date();
  const nextExam = exams
    .filter((e) => e.status === 'pendiente' && new Date(e.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null;

  const getInitials = (name?: string | null) => {
    if (!name) return 'F';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <aside className="hidden md:flex flex-col w-[220px] shrink-0 bg-surface border-r border-[#221c12] h-full z-10 transition-colors">
      
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-6 border-b border-border/50">
        <div className="w-6 h-6 rounded flex items-center justify-center bg-amber/10 text-amber">
          <GraduationCap size={14} strokeWidth={2.5} />
        </div>
        <span className="font-semibold text-text-primary tracking-[-0.2px] text-[15px]">Faculty OS</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-[2px] p-3 flex-1 overflow-y-auto w-full">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="w-full">
            {({ isActive }) => (
              <div className={cn('nav-item', isActive && 'active')}>
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-amber' : 'opacity-70'} />
                <span>{label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Items */}
      <div className="px-4 mt-auto mb-4 flex flex-col gap-2 relative">
        {/* User Menu */}
        {user && (
          <div className="relative w-full" ref={popoverRef}>
            <button 
              onClick={() => setShowPopover(!showPopover)}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-hover rounded-[6px] transition-colors"
            >
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="User avatar" className="w-[32px] h-[32px] rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-[32px] h-[32px] rounded-full bg-amber flex items-center justify-center text-[#17130b] font-bold text-xs shrink-0">
                  {getInitials(user.user_metadata?.full_name || user.email)}
                </div>
              )}
              <span className="truncate flex-1 text-left">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </span>
            </button>

            {/* Popover */}
            {showPopover && (
              <div className="absolute bottom-[calc(100%+8px)] left-0 w-[240px] bg-elevated border border-border shadow-lg rounded-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col gap-1 mb-3 pb-3 border-b border-border/50">
                  <span className="text-sm font-medium text-text-primary line-clamp-1">{user.user_metadata?.full_name || 'Usuario'}</span>
                  <span className="text-xs text-text-muted line-clamp-1">{user.email}</span>
                </div>
                <button 
                  onClick={handleConnectTelegram}
                  className="flex items-center gap-2 w-full text-left px-2 py-[6px] text-sm hover:bg-hover rounded transition-colors mb-1 text-text-secondary hover:text-[#0088cc]"
                >
                  <Send size={14} />
                  <span>Conectar Telegram</span>
                </button>
                <button 
                  onClick={signOut}
                  className="flex items-center gap-2 w-full text-left px-2 py-[6px] text-sm text-red hover:bg-red/10 rounded transition-colors"
                >
                  <LogOut size={14} />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-hover rounded-[6px] transition-colors group">
          {theme === 'dark' ? <Sun size={16} className="group-hover:text-amber" /> : <Moon size={16} className="group-hover:text-amber" />}
          <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
        </button>
      </div>

      {/* Next Exam Widget */}
      {nextExam && (
        <div className="mx-4 mb-4 p-4 rounded-card bg-elevated border border-border border-accent shadow-sm">
          <p className="label mb-2">Próximo Examen</p>
          <p className="text-[13px] text-text-primary font-medium leading-[1.3] line-clamp-2 mb-1.5">
            {nextExam.subject}
          </p>
          <p className="text-[11px] text-text-muted capitalize mb-3">
            {nextExam.type}
          </p>
          <CountdownChip days={daysUntil(nextExam.date)} />
        </div>
      )}
    {/* Telegram Connect Modal */}
    {showTelegramModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d0b08]/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm bg-surface border border-border shadow-2xl rounded-2xl p-6 relative">
          <button onClick={() => setShowTelegramModal(false)} className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors">✕</button>
          <div className="w-10 h-10 rounded-full bg-[#0088cc]/10 text-[#0088cc] flex items-center justify-center mb-4">
            <Send size={20} />
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-text-primary mb-2">Conectar Telegram</h3>
          <p className="text-sm text-text-secondary leading-relaxed mb-6">
            Llevá Faculty OS a todos lados. Recibí recordatorios automáticos de tus parciales y agregá exámenes o entregas conversando con el bot usando lenguaje natural.
          </p>
          
          <div className="bg-elevated border border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2 mb-6 text-center">
            <p className="text-sm text-text-muted">1. Abrí el bot en Telegram</p>
            <a href="https://t.me/FacultyOSBot" target="_blank" rel="noreferrer" className="text-[#0088cc] font-medium text-sm hover:underline">@FacultyOSBot</a>
            
            <div className="w-full h-[1px] bg-border my-2" />
            
            <p className="text-sm text-text-muted">2. Enviá este mensaje</p>
            {loadingCode ? (
              <div className="h-8 flex items-center justify-center">
                <div className="h-4 w-4 border-2 border-[#0088cc] border-t-transparent animate-spin rounded-full" />
              </div>
            ) : telegramCode === 'ERROR' ? (
              <span className="text-red font-medium text-sm">Error al generar código</span>
            ) : (
              <code className="text-lg font-mono font-bold text-text-primary bg-hover px-3 py-1 rounded select-all cursor-pointer">/vincular {telegramCode}</code>
            )}
          </div>

          <button onClick={() => setShowTelegramModal(false)} className="w-full py-2.5 bg-amber text-[#17130b] font-medium rounded-lg hover:bg-amber/90 transition-colors">
            Listo, ya lo envié
          </button>
        </div>
      </div>
    )}
  </aside>
);
};

