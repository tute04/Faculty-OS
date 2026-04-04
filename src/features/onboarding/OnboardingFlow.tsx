import React, { useEffect, useRef, useState } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useExams } from '../../hooks/useExams';
import { useWeekBlocks } from '../../hooks/useWeekBlocks';
import { useHabits } from '../../hooks/useHabits';
import { useAuth } from '../../lib/auth';
import { SEED_EXAMS, SEED_BLOCKS, SEED_HABITS } from '../../lib/seed';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, Sparkles, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Profile Completion Gate (for Google OAuth users) ─────────────────────────
const ProfileGate: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { profile, updateProfile } = useAuth();
  const [university, setUniversity] = useState(profile?.university ?? '');
  const [career, setCareer] = useState(profile?.career ?? '');
  const [year, setYear] = useState<string>(String(profile?.year_of_study ?? ''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!university.trim() || !career.trim() || !year) {
      setError('Por favor completá todos los campos.');
      return;
    }
    setSaving(true);
    setError('');
    const { error: err } = await updateProfile({
      university: university.trim(),
      career: career.trim(),
      year_of_study: Number(year),
    });
    setSaving(false);
    if (err) {
      setError('Error al guardar. Intentá de nuevo.');
      return;
    }
    onComplete();
  };

  return (
    <Modal open title="" onClose={() => {/* not dismissable */}}>
      <div className="flex flex-col items-center text-center py-4 px-2">
        <div className="w-16 h-16 bg-amber/10 rounded-[20px] flex items-center justify-center mb-5">
          <GraduationCap size={32} className="text-amber" />
        </div>
        <h2 className="text-[22px] font-black text-text-primary tracking-tight mb-1">
          ¡Hola, {profile?.first_name || 'estudiante'}!
        </h2>
        <p className="text-text-muted text-[14px] mb-6 max-w-[280px]">
          Completá tu perfil académico para personalizar tu experiencia en Faculty OS.
        </p>

        <div className="w-full flex flex-col gap-3 text-left">
          <div>
            <label className="label block mb-1">Universidad</label>
            <input
              className="input w-full"
              placeholder="ej. UTN Córdoba"
              value={university}
              onChange={e => setUniversity(e.target.value)}
            />
          </div>
          <div>
            <label className="label block mb-1">Carrera</label>
            <input
              className="input w-full"
              placeholder="ej. Ingeniería Industrial"
              value={career}
              onChange={e => setCareer(e.target.value)}
            />
          </div>
          <div>
            <label className="label block mb-1">Año cursando</label>
            <select
              className="input w-full"
              value={year}
              onChange={e => setYear(e.target.value)}
            >
              <option value="">Seleccioná un año</option>
              {[1, 2, 3, 4, 5, 6].map(y => (
                <option key={y} value={y}>{y}° año</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-red text-xs mt-3">{error}</p>}

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 !bg-amber !text-base font-black rounded-xl shadow-lg active:scale-95 mt-6"
        >
          {saving ? 'Guardando...' : 'Continuar →'}
        </Button>
      </div>
    </Modal>
  );
};

// ─── OnboardingFlow ──────────────────────────────────────────────────────────
export const OnboardingFlow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, user } = useAuth();
  const { hasCompletedOnboarding, loading: profileLoading, completeOnboarding } = useProfile();
  const { exams, addExam, loading: examsLoading } = useExams();
  const { addBlock, loading: blocksLoading } = useWeekBlocks();
  const { addHabit, loading: habitsLoading } = useHabits();

  const [showWelcome, setShowWelcome] = useState(false);
  const [profileFilled, setProfileFilled] = useState(false);
  const runningRef = useRef(false);

  // Check whether the profile is complete (university & career both set)
  const isProfileIncomplete =
    user &&
    !profileLoading &&
    hasCompletedOnboarding === false &&
    !profileFilled &&
    profile !== null &&
    (!profile?.university?.trim() || !profile?.career?.trim());

  useEffect(() => {
    const runSeed = async () => {
      // Don't seed if profile is incomplete – wait for user to fill it in
      if (isProfileIncomplete) return;

      if (!user || profileLoading || hasCompletedOnboarding !== false || runningRef.current) return;

      if (!examsLoading && !blocksLoading && !habitsLoading) {
        if (exams.length > 0) {
          await completeOnboarding();
          return;
        }
      } else {
        return;
      }

      runningRef.current = true;
      try {
        console.log("Onboarding: Inyectando datos de prueba...");
        for (const e of SEED_EXAMS) await addExam(e);
        for (const b of SEED_BLOCKS) await addBlock(b as any);
        for (const h of SEED_HABITS) await addHabit(h);

        await completeOnboarding();
        setShowWelcome(true);
        console.log("Onboarding: Finalizado con éxito.");
      } catch (error) {
        console.error("Onboarding Flow Error:", error);
      } finally {
        runningRef.current = false;
      }
    };

    runSeed();
  }, [hasCompletedOnboarding, profileLoading, examsLoading, blocksLoading, habitsLoading, user, isProfileIncomplete, profileFilled]);

  return (
    <>
      {/* Gate: If profile incomplete (Google OAuth), block the app and force completion */}
      {isProfileIncomplete ? (
        <ProfileGate onComplete={() => setProfileFilled(true)} />
      ) : (
        children
      )}

      <AnimatePresence>
        {showWelcome && (
          <Modal open={showWelcome} onClose={() => setShowWelcome(false)} title="">
            <div className="flex flex-col items-center text-center py-4">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-20 h-20 bg-amber/10 rounded-[24px] flex items-center justify-center mb-6 relative"
              >
                <CheckCircle2 size={40} className="text-amber" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-2 -right-2 bg-amber p-1.5 rounded-full text-base"
                >
                  <Sparkles size={14} />
                </motion.div>
              </motion.div>

              <h2 className="text-[24px] font-black text-text-primary tracking-tight mb-2">
                ¡Bienvenido/a, {profile?.first_name || 'Estudiante'}!
              </h2>
              <p className="text-text-muted text-[15px] leading-relaxed mb-8 max-w-[280px]">
                Ya preparamos tu espacio con algunos datos de ejemplo de <strong>{profile?.career || 'tu carrera'}</strong> para que empieces a explorar.
              </p>

              <Button
                onClick={() => setShowWelcome(false)}
                className="w-full h-12 !bg-amber !text-base font-black rounded-xl shadow-lg active:scale-95"
              >
                Empezar ahora →
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
};
