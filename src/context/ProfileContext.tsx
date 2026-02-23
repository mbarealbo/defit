import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { calcBMR, calcTDEE } from '../types/profile';
import type { UserProfile, ProfileFormData } from '../types/profile';

interface ProfileContextValue {
  profile: UserProfile | null;
  profileLoading: boolean;
  saveProfile: (data: ProfileFormData) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  updateWeight: (weightKg: number) => Promise<{ error: string | null; newTDEE: number | null }>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    setProfile(data as UserProfile | null);
    setProfileLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const saveProfile = async (data: ProfileFormData): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Non autenticato' };

    const bmr = calcBMR(data.sex, data.weight_kg, data.height_cm, data.age);
    const tdee = calcTDEE(bmr, data.activity_multiplier);

    const row = {
      id: user.id,
      sex: data.sex,
      age: data.age,
      weight_kg: data.weight_kg,
      height_cm: data.height_cm,
      activity_multiplier: data.activity_multiplier,
      target_deficit: data.target_deficit,
      min_deficit_target: data.min_deficit_target,
      max_deficit_target: data.max_deficit_target,
      bmr,
      tdee,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
    if (error) return { error: error.message };

    await fetchProfile();
    return { error: null };
  };

  const updateWeight = async (weightKg: number): Promise<{ error: string | null; newTDEE: number | null }> => {
    if (!user || !profile) return { error: 'Profilo non disponibile', newTDEE: null };

    const newBMR = calcBMR(profile.sex, weightKg, profile.height_cm, profile.age);
    const newTDEE = calcTDEE(newBMR, profile.activity_multiplier);

    const { error } = await supabase
      .from('profiles')
      .update({ weight_kg: weightKg, bmr: newBMR, tdee: newTDEE, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) return { error: error.message, newTDEE: null };

    await fetchProfile();
    return { error: null, newTDEE };
  };

  return (
    <ProfileContext.Provider value={{ profile, profileLoading, saveProfile, refreshProfile: fetchProfile, updateWeight }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
