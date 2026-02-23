import { Home, CalendarDays, UserCircle, Ruler } from 'lucide-react';

export type Tab = 'home' | 'calendar' | 'misure' | 'profile';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-white/[0.06] pb-safe">
      <div className="flex items-stretch h-16 max-w-lg mx-auto px-4">
        <NavItem
          icon={<Home className="w-5 h-5" />}
          label="Oggi"
          active={active === 'home'}
          onClick={() => onChange('home')}
        />
        <NavItem
          icon={<CalendarDays className="w-5 h-5" />}
          label="Storico"
          active={active === 'calendar'}
          onClick={() => onChange('calendar')}
        />
        <NavItem
          icon={<Ruler className="w-5 h-5" />}
          label="Misure"
          active={active === 'misure'}
          onClick={() => onChange('misure')}
        />
        <NavItem
          icon={<UserCircle className="w-5 h-5" />}
          label="Profilo"
          active={active === 'profile'}
          onClick={() => onChange('profile')}
        />
      </div>
    </nav>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${
        active ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'
      }`}
    >
      {active && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-emerald-400" />
      )}
      <span className={`transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`}>
        {icon}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
    </button>
  );
}
