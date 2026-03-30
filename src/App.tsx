import { useEffect, useRef, useState } from 'react';
import { useDefitStore, todayStr } from './store/useDefitStore';
import MultiRingDashboard from './components/MultiRingDashboard';
import Timeline from './components/Timeline';
import InputArea from './components/InputArea';
import CalendarView from './components/CalendarView';
import BottomNav, { type Tab } from './components/BottomNav';
import AuthScreen from './components/AuthScreen';
import OnboardingWizard from './components/OnboardingWizard';
import ProfileScreen from './components/ProfileScreen';
import MeasurementsPage from './components/MeasurementsPage';
import { useAuth } from './context/AuthContext';
import { useProfile } from './context/ProfileContext';
import { Zap } from 'lucide-react';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { profile, profileLoading } = useProfile();
  const [tab, setTab] = useState<Tab>('home');
  const { fetchToday, records, setTDEE, setDeficitTargets, syncTodaySnapshot } = useDefitStore();
  const today = todayStr();
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (!profile) return;

    const minDef = profile.min_deficit_target ?? profile.target_deficit ?? 0;
    const maxDef = profile.max_deficit_target ?? profile.target_deficit ?? 0;

    if (!initialFetchDone.current) {
      setTDEE(profile.tdee);
      setDeficitTargets(minDef, maxDef);
      if (user) {
        fetchToday();
        initialFetchDone.current = true;
      }
    } else {
      syncTodaySnapshot(profile.tdee, minDef, maxDef);
    }
  }, [profile, user, setTDEE, setDeficitTargets, fetchToday, syncTodaySnapshot]);

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!profile) {
    return <OnboardingWizard onComplete={() => {}} />;
  }

  const todayRecord = records[today] ?? { entries: [], foodKcal: 0, workoutKcal: 0, deficit: profile.tdee };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <header className="sticky top-0 z-50 flex items-center justify-center px-4 py-3 border-b border-white/[0.06] flex-shrink-0 bg-zinc-950/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <h1 className="text-base font-bold tracking-tight">Defit</h1>
        </div>
      </header>

      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: tab === 'home' ? 'calc(16rem + env(safe-area-inset-bottom, 0px))' : 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {tab === 'home' && (
          <>
            <MultiRingDashboard record={todayRecord} date={today} />
            <div className="h-px bg-white/[0.06] mx-4" />
            <Timeline />
          </>
        )}
        {tab === 'calendar' && <CalendarView />}
        {tab === 'misure' && <MeasurementsPage />}
        {tab === 'profile' && <ProfileScreen />}
      </main>

      {tab === 'home' && <InputArea />}

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
