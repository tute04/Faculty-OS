import React, { useEffect, useRef } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useExams } from '../../hooks/useExams';
import { useWeekBlocks } from '../../hooks/useWeekBlocks';
import { useHabits } from '../../hooks/useHabits';
import { SEED_EXAMS, SEED_BLOCKS, SEED_HABITS } from '../../lib/seed';

/**
 * Lógica de Onboarding de Faculty OS.
 * Se encarga de inyectar datos de prueba (seed) en Supabase 
 * únicamente la primera vez que un usuario accede.
 */
export const OnboardingFlow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasCompletedOnboarding, loading: profileLoading, completeOnboarding } = useProfile();
  const { exams, addExam, loading: examsLoading } = useExams();
  const { addBlock, loading: blocksLoading } = useWeekBlocks();
  const { addHabit, loading: habitsLoading } = useHabits();
  
  // Guardar estado para evitar inyecciones simultáneas por re-renders
  const runningRef = useRef(false);

  useEffect(() => {
    const runSeed = async () => {
      // 1. Validar si el perfil cargó y falta completar el onboarding
      if (profileLoading || hasCompletedOnboarding !== false || runningRef.current) return;
      
      // 2. Si ya hay datos en la cuenta (ej: volvió a entrar pero el profile falló), completar inmediatamente
      if (!examsLoading && !blocksLoading && !habitsLoading) {
        if (exams.length > 0) {
            await completeOnboarding();
            return;
        }
      } else {
        return; // Esperar a que terminen de cargar los hooks antes de decidir
      }

      runningRef.current = true;
      try {
        console.log("Onboarding: Inyectando datos de prueba...");
        
        // Inyectar secuencialmente para evitar locks raros o errores masivos de red en móviles
        for (const e of SEED_EXAMS) await addExam(e);
        for (const b of SEED_BLOCKS) await addBlock(b as any);
        for (const h of SEED_HABITS) await addHabit(h);
        
        await completeOnboarding();
        console.log("Onboarding: Finalizado con éxito.");
      } catch (error) {
        console.error("Onboarding Flow Error:", error);
      } finally {
        runningRef.current = false;
      }
    };

    runSeed();
  }, [hasCompletedOnboarding, profileLoading, examsLoading, blocksLoading, habitsLoading]);

  // Si quisiéramos mostrar una pantalla de bienvenida durante la inyección, este es el lugar.
  return <>{children}</>;
};
