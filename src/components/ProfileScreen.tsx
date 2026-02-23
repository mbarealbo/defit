import { useState } from 'react';
import { User, Edit2, LogOut, Zap, Scale, Ruler, Calendar, Activity, Target, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { ACTIVITY_OPTIONS } from '../types/profile';
import OnboardingWizard from './OnboardingWizard';
import type { ProfileFormData } from '../types/profile';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const [editing, setEditing] = useState(false);

  if (editing || !profile) {
    const initialData: Partial<ProfileFormData> | undefined = profile
      ? {
          sex: profile.sex as ProfileFormData['sex'],
          age: profile.age,
          weight_kg: profile.weight_kg,
          height_cm: profile.height_cm,
          activity_multiplier: profile.activity_multiplier,
          target_deficit: profile.target_deficit,
          min_deficit_target: profile.min_deficit_target ?? 500,
          max_deficit_target: profile.max_deficit_target ?? 1000,
        }
      : undefined;

    return (
      <OnboardingWizard
        initialData={initialData}
        onComplete={() => setEditing(false)}
      />
    );
  }

  const activityLabel = ACTIVITY_OPTIONS.find((o) => o.value === profile.activity_multiplier)?.label ?? '';
  const dailyAllowance = profile.tdee - (profile.min_deficit_target ?? profile.target_deficit);

  return (
    <div className="flex flex-col gap-5 px-4 pt-6 pb-8">
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <User className="w-7 h-7 text-emerald-400" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-white">{user?.email}</p>
          <p className="text-xs text-zinc-500 mt-0.5 capitalize">{profile.sex}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Zap className="w-4 h-4 text-emerald-400" />} label="TDEE" value={profile.tdee} unit="kcal" color="#10b981" />
        <StatCard icon={<Target className="w-4 h-4 text-amber-400" />} label="Budget giorn." value={dailyAllowance} unit="kcal" color="#f59e0b" />
        <StatCard icon={<Activity className="w-4 h-4 text-sky-400" />} label="BMR" value={profile.bmr} unit="kcal" color="#0ea5e9" />
        <StatCard icon={<Target className="w-4 h-4 text-pink-400" />} label="Deficit Min" value={profile.min_deficit_target ?? profile.target_deficit} unit="kcal" color="#f472b6" />
      </div>

      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Dati Personali</span>
        </div>
        <ProfileRow icon={<Calendar className="w-3.5 h-3.5" />} label="Eta" value={`${profile.age} anni`} />
        <ProfileRow icon={<Scale className="w-3.5 h-3.5" />} label="Peso" value={`${profile.weight_kg} kg`} />
        <ProfileRow icon={<Ruler className="w-3.5 h-3.5" />} label="Altezza" value={`${profile.height_cm} cm`} />
      </div>

      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Obiettivi</span>
        </div>
        <div className="px-4 py-3 border-b border-white/[0.05]">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">Stile di vita</span>
          <p className="text-sm text-zinc-300 mt-1 leading-snug">{activityLabel}</p>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">Range deficit</span>
            <p className="text-sm text-zinc-300 mt-1 tabular-nums">
              {profile.min_deficit_target ?? profile.target_deficit} – {profile.max_deficit_target ?? profile.target_deficit} kcal
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setEditing(true)}
        className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.07] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Edit2 className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-zinc-200">Modifica profilo</span>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600" />
      </button>

      <button
        onClick={signOut}
        className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:bg-red-500/10 hover:border-red-500/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <LogOut className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium text-red-400">Esci dall'account</span>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600" />
      </button>
    </div>
  );
}

function StatCard({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value: number; unit: string; color: string }) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
      </div>
      <span className="text-2xl font-bold tabular-nums leading-none" style={{ color }}>{value}</span>
      <span className="text-[10px] text-zinc-600">{unit}</span>
    </div>
  );
}

function ProfileRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05] last:border-0">
      <div className="flex items-center gap-2.5 text-zinc-500">
        {icon}
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      <span className="text-sm font-medium text-zinc-200">{value}</span>
    </div>
  );
}
