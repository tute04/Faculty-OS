import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

/**
 * Hook para gestionar el perfil del usuario y el estado de onboarding.
 * Persiste si el usuario ya inyectó los datos iniciales (seed) en Supabase.
 */
export function useProfile() {
  const { user } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('has_completed_onboarding')
          .eq('id', user!.id)
          .single();

        if (error) {
          // Si no existe, lo creamos manualmente como fallback (aunque el trigger debería hacerlo)
          if (error.code === 'PGRST116') {
             await supabase.from('profiles').insert({ id: user!.id });
             setHasCompletedOnboarding(false);
          } else {
             console.error('Error fetching profile:', error);
          }
        } else if (data) {
          setHasCompletedOnboarding(data.has_completed_onboarding);
        }
      } catch (err) {
        console.error('Unexpected error in useProfile:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  const completeOnboarding = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ has_completed_onboarding: true, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    
    if (!error) {
      setHasCompletedOnboarding(true);
    } else {
      console.error('Error updating onboarding status:', error);
    }
  };

  return { hasCompletedOnboarding, loading, completeOnboarding };
}
