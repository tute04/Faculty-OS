import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './components/layout/Sidebar';
import { MobileTabBar } from './components/layout/MobileTabBar';
import { Dashboard } from './pages/Dashboard';
import { ExamTracker } from './pages/ExamTracker';
import { WeeklyPlanner } from './pages/WeeklyPlanner';
import { Materias } from './pages/Materias';
import { Timeline } from './pages/Timeline';
import { Estadisticas } from './pages/Estadisticas';
import { ModoExamen } from './pages/ModoExamen';
import { Login } from './pages/Login';
import { ResetPassword } from './pages/ResetPassword';
import { UpdatePassword } from './pages/UpdatePassword';
import { QuickCaptureModal } from './components/dashboard/QuickCaptureModal';
import { ImportDataModal } from './components/dashboard/ImportDataModal';
import { FullScreenLoader } from './components/ui/FullScreenLoader';

import { ThemeProvider } from './lib/theme';
import { ToastProvider, useToast } from './components/ui/Toast';
import { decodeShareLink } from './lib/share';
import { scheduleExamReminders } from './lib/notifications';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';
import { formatDateES } from './lib/utils';
import type { Exam } from './types';
import { AuthProvider, useAuth } from './lib/auth';
import { useExams } from './hooks/useExams';
import { OnboardingFlow } from './features/onboarding/OnboardingFlow';

// ─── App Level Interceptor (Import & Notifs logic) ─────────────────────────────
const AppProvidersAndLogic = ({ children }: { children: React.ReactNode }) => {
  const { exams, addExam } = useExams();
  const { showToast } = useToast();
  
  // 1. URL Import Interceptor
  const [importExam, setImportExam] = useState<Partial<Exam> | null>(null);
  
  useEffect(() => {
    const url = new URL(window.location.href);
    const imp = url.searchParams.get('import');
    if (imp) {
      const decoded = decodeShareLink(imp);
      if (decoded) setTimeout(() => setImportExam(decoded), 0);
      // Clean URL silently
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleImport = () => {
    if (!importExam) return;
    addExam({ ...importExam, status: 'pendiente' } as Omit<Exam, 'id'>);
    showToast('Examen importado con éxito');
    setImportExam(null);
  };

  // 2. Notification Scheduler
  useEffect(() => {
    scheduleExamReminders(exams);
  }, [exams]);

  return (
    <>
      {children}
      <Modal open={!!importExam} onClose={() => setImportExam(null)} title="Tu compañero compartió un examen">
        {importExam && (
          <div className="flex flex-col gap-4">
            <div className="bg-elevated border border-border rounded-card p-4">
              <p className="text-text-primary font-semibold text-lg">{importExam.subject}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-text-muted capitalize">
                <span className="bg-surface px-2 py-0.5 rounded border border-border">{importExam.type}</span>
                {importExam.date && <span>— {formatDateES(importExam.date)}</span>}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <Button onClick={() => setImportExam(null)} variant="ghost">Ignorar</Button>
              <Button onClick={handleImport} variant="primary" className="!bg-amber !text-[#17130b]">Importar examen</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

// ─── Route Animations ─────────────────────────────────────────────────────────
const titles: Record<string, string> = {
  '/dashboard': 'Dashboard | Faculty OS',
  '/examenes': 'Exámenes | Faculty OS',
  '/planner': 'Planificador | Faculty OS',
  '/materias': 'Materias | Faculty OS',
  '/timeline': 'Timeline | Faculty OS',
  '/estadisticas': 'Estadísticas | Faculty OS',
};

const AnimatedRoutes = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = titles[location.pathname] || 'Faculty OS';
  }, [location]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="h-full"
      >
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/examenes" element={<ExamTracker />} />
          <Route path="/planner" element={<WeeklyPlanner />} />
          <Route path="/materias" element={<Materias />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/estadisticas" element={<Estadisticas />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setQuickCaptureOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        setImportModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Block rendering until Supabase has restored the session
  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppProvidersAndLogic>
      <OnboardingFlow>
        <div className="flex h-screen overflow-hidden bg-base text-text-primary">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-base to-transparent z-10 pointer-events-none" />
            <main className="flex-1 overflow-y-auto pb-24 md:pb-0 px-4 md:px-8 xl:px-12 pt-8 scroll-smooth">
              <AnimatedRoutes />
            </main>
          </div>
          <MobileTabBar />
        </div>

        <QuickCaptureModal 
          open={quickCaptureOpen} 
          onClose={() => setQuickCaptureOpen(false)} 
        />

        <ImportDataModal 
          open={importModalOpen} 
          onClose={() => setImportModalOpen(false)} 
        />
      </OnboardingFlow>
    </AppProvidersAndLogic>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/modo-examen/:examId" element={<ModoExamen />} />
              <Route path="*" element={<ProtectedLayout />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
