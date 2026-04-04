import React, { useEffect, useRef, useState } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useExams } from '../../hooks/useExams';
import { useWeekBlocks } from '../../hooks/useWeekBlocks';
import { useHabits } from '../../hooks/useHabits';
import { useAuth } from '../../lib/auth';
import { SEED_EXAMS, SEED_BLOCKS, SEED_HABITS } from '../../lib/seed';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OnboardingFlow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, user } = useAuth();
  const { hasCompletedOnboarding, loading: profileLoading, completeOnboarding } = useProfile();
  const { exams, addExam, loading: examsLoading } = useExams();
  const { addBlock, loading: blocksLoading } = useWeekBlocks();
  const { addHabit, loading: habitsLoading } = useHabits();
  
  const [showWelcome, setShowWelcome] = useState(false);
  const runningRef = useRef(false);

  useEffect(() => {
    const runSeed = async () => {
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
        
        // Inject data
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
  }, [hasCompletedOnboarding, profileLoading, examsLoading, blocksLoading, habitsLoading, user]);

  return (
    <>
      {children}
      
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
                   className="absolute -top-2 -right-2 bg-amber p-1.5 rounded-full text-[#1a0f00]"
                >
                  <Sparkles size={14} />
                </motion.div>
              </motion.div>
              
              <h2 className="text-[24px] font-black text-[#f0e8d8] tracking-tight mb-2">
                ¡Bienvenido/a, {profile?.first_name || 'Estudiante'}!
              </h2>
              <p className="text-text-muted text-[15px] leading-relaxed mb-8 max-w-[280px]">
                Ya preparamos tu espacio con algunos datos de ejemplo de <strong>{profile?.career || 'tu carrera'}</strong> para que empieces a explorar.
              </p>
              
              <Button 
                onClick={() => setShowWelcome(false)} 
                className="w-full h-12 !bg-amber !text-[#1a0f00] font-black rounded-xl shadow-lg active:scale-95"
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
