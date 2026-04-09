import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BookMarked, BookOpen, CalendarDays,
  GraduationCap, Sun, Moon, LayoutList, BarChart2,
  LogOut, Send, User as UserIcon, Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useExams } from '../../hooks/useExams';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { daysUntil, cn } from '../../lib/utils';
import { CountdownChip } from '../ui/CountdownChip';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

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
  const { user, profile, signOut, updateProfile } = useAuth();

  const [showPopover, setShowPopover] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [telegramCode, setTelegramCode] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    university: '',
    career: '',
    year_of_study: 1
  });

  useEffect(() => {
    if (profile) {
      setEditData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        university: profile.university || '',
        career: profile.career || '',
        year_of_study: profile.year_of_study || 1
      });
    }
  }, [profile]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    };
    if (showPopover) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopover]);

  const handleConnectTelegram = async () => {
    if (!user) return;
    setLoadingCode(true);
    setShowTelegramModal(true);
    setShowPopover(false);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await supabase.from('telegram_link_codes').delete().eq('user_id', user.id);
    const { error } = await supabase.from('telegram_link_codes').insert({ code, user_id: user.id });
    if (error) setTelegramCode('ERROR');
    else setTelegramCode(code);
    setLoadingCode(false);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setSaveError(null);
    try {
      const { error } = await updateProfile(editData);
      if (error) {
        setSaveError('No se pudo guardar. Intentá de nuevo.');
        
      } else {
        setShowProfileModal(false);
      }
    } catch (err) {
      setSaveError('Error inesperado al guardar.');
      
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignOut = async () => {
    setShowPopover(false);
    try {
      await signOut();
    } catch {
      // signOut handles the redirect internally
      window.location.href = '/login';
    }
  };

  const now = new Date();
  const nextExam = exams
    .filter((e) => e.status === 'pendiente' && new Date(e.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null;

  const getInitials = () => {
    if (profile?.first_name) return profile.first_name[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'F';
  };

  const displayName = profile?.first_name
    ? profile.first_name
    : user?.email?.split('@')[0] ?? 'Estudiante';

  return (
    <aside className="hidden md:flex flex-col w-[220px] shrink-0 bg-surface border-r border-border h-full z-10 transition-colors">

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
              <div className={cn('flex items-center gap-3 px-6 py-2.5 border-l-[2px] transition-colors', isActive ? 'text-amber bg-amber/10 border-amber' : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-hover')}>
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-amber' : 'opacity-70'} />
                <span className="text-[13px] font-medium">{label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 mt-auto mb-4 flex flex-col gap-2">

        {/* User menu */}
        <div className="relative w-full" ref={popoverRef}>
          <button
            onClick={() => setShowPopover(p => !p)}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-hover rounded-[10px] transition-colors border border-transparent hover:border-border/50"
          >
            <div className="w-[28px] h-[28px] rounded-full bg-amber flex items-center justify-center text-[#1a0f00] font-black text-[12px] shrink-0 shadow-sm">
              {getInitials()}
            </div>
            <span className="truncate flex-1 text-left text-[13px] font-bold tracking-tight">
              {displayName}
            </span>
          </button>

          {/* Popover */}
          {showPopover && (
            <div className="absolute bottom-[calc(100%+8px)] left-0 w-[260px] bg-elevated border border-border shadow-2xl rounded-2xl p-4 z-50">
              <div className="flex flex-col gap-1 mb-4 pb-4 border-b border-border/50">
                <span className="text-sm font-bold text-text-primary">
                  {profile?.first_name || user?.email?.split('@')[0] || 'Estudiante'} {profile?.last_name}
                </span>
                <span className="text-[11px] text-text-muted">{profile?.career || 'Sin carrera configurada'}</span>
                <span className="text-[11px] text-text-faint font-bold uppercase tracking-widest">{profile?.university}</span>
              </div>

              <div className="flex flex-col gap-1">
                <button
                  onClick={() => { setShowProfileModal(true); setShowPopover(false); }}
                  className="flex items-center gap-3 w-full text-left px-3 py-2 text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-hover rounded-lg transition-all"
                >
                  <UserIcon size={14} className="opacity-70" />
                  <span>Editar perfil</span>
                </button>
                <button
                  onClick={handleConnectTelegram}
                  className="flex items-center gap-3 w-full text-left px-3 py-2 text-[13px] font-medium text-text-secondary hover:text-[#0088cc] hover:bg-[#0088cc]/5 rounded-lg transition-all"
                >
                  <Send size={14} className="opacity-70" />
                  <span>Conectar Telegram</span>
                </button>
                <div className="my-1 border-t border-border/30" />
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full text-left px-3 py-2 text-[13px] font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <LogOut size={14} />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-10 h-10 mx-auto text-text-muted hover:text-amber hover:bg-hover rounded-xl transition-all border border-border/40 shadow-sm group"
          title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {theme === 'light'
            ? <Sun size={18} className="group-hover:rotate-45 transition-transform" />
            : <Moon size={18} className="group-hover:-rotate-12 transition-transform" />}
        </button>
      </div>

      {/* Next Exam Widget */}
      {nextExam && (
        <div className="mx-3 mb-4 p-3 rounded-[14px] bg-elevated/50 border border-border/80 shadow-sm group hover:border-amber/20 transition-colors">
          <p className="text-[10px] font-bold text-text-faint uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-amber" />
            Próximo Examen
          </p>
          <div className="flex flex-col gap-0.5 mb-3">
            <p className="text-[13px] text-text-primary font-bold leading-tight line-clamp-2">{nextExam.subject}</p>
            <p className="text-[10px] text-text-muted font-medium uppercase tracking-wide">{nextExam.type}</p>
          </div>
          <CountdownChip days={daysUntil(nextExam.date)} className="w-full justify-center py-1 opacity-90 group-hover:opacity-100" />
        </div>
      )}

      {/* Telegram Modal */}
      <Modal open={showTelegramModal} onClose={() => setShowTelegramModal(false)} title="Conectar Telegram">
        <div className="flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0088cc]/10 text-[#0088cc] flex items-center justify-center mb-2">
            <Send size={24} strokeWidth={2.5} />
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            Recordatorios automáticos y carga de datos por chat usando lenguaje natural.
          </p>
          <div className="bg-elevated border border-border rounded-xl p-5 flex flex-col items-center gap-3 text-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-faint mb-1">1. Abrí el bot</p>
              <a href="https://t.me/FacultyOSBot" target="_blank" rel="noreferrer" className="text-[#0088cc] font-bold text-sm hover:underline">@FacultyOSBot</a>
            </div>
            <div className="w-full h-[1px] bg-border/50" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-faint mb-1">2. Enviá este código</p>
              {loadingCode
                ? <Loader2 className="animate-spin text-amber" />
                : <code className="text-xl font-mono font-bold text-text-primary tracking-wider bg-hover px-4 py-2 rounded-lg border border-border select-all cursor-copy">/vincular {telegramCode}</code>
              }
            </div>
          </div>
          <Button onClick={() => setShowTelegramModal(false)} className="w-full h-11 !bg-amber !text-[#1a0f00] font-bold mt-2">
            Listo, ya lo envié
          </Button>
        </div>
      </Modal>

      {/* Profile Edit Modal */}
      <Modal open={showProfileModal} onClose={() => { setShowProfileModal(false); setSaveError(null); }} title="Editar Perfil">
        <div className="flex flex-col gap-5 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-faint ml-1">Nombre</label>
              <input
                value={editData.first_name}
                onChange={e => setEditData({ ...editData, first_name: e.target.value })}
                className="w-full h-11 bg-base border border-border rounded-xl px-4 text-sm focus:border-amber outline-none transition-colors"
                placeholder="Mateo"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-faint ml-1">Apellido</label>
              <input
                value={editData.last_name}
                onChange={e => setEditData({ ...editData, last_name: e.target.value })}
                className="w-full h-11 bg-base border border-border rounded-xl px-4 text-sm focus:border-amber outline-none transition-colors"
                placeholder="Pérez"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-faint ml-1">Universidad</label>
            <input
              value={editData.university}
              onChange={e => setEditData({ ...editData, university: e.target.value })}
              className="w-full h-11 bg-base border border-border rounded-xl px-4 text-sm focus:border-amber outline-none transition-colors"
              placeholder="UTN FRC"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-faint ml-1">Carrera</label>
            <input
              value={editData.career}
              onChange={e => setEditData({ ...editData, career: e.target.value })}
              className="w-full h-11 bg-base border border-border rounded-xl px-4 text-sm focus:border-amber outline-none transition-colors"
              placeholder="Ingeniería Industrial"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-faint ml-1">Año de estudio</label>
            <div className="flex bg-base p-1 rounded-xl border border-border">
              {[1, 2, 3, 4, 5, 6].map(y => (
                <button
                  key={y}
                  onClick={() => setEditData({ ...editData, year_of_study: y })}
                  className={cn('flex-1 py-2 text-xs font-bold rounded-lg transition-all', editData.year_of_study === y ? 'bg-amber text-[#1a0f00]' : 'text-text-muted hover:text-text-secondary')}
                >
                  {y}°
                </button>
              ))}
            </div>
          </div>

          {saveError && (
            <p className="text-red-400 text-sm font-medium">{saveError}</p>
          )}

          <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full h-12 !bg-amber !text-[#1a0f00] font-black mt-2">
            {savingProfile ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </Modal>
    </aside>
  );
};
