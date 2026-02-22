import { useState, useEffect, useCallback } from 'react';
import { Plus, TrendingUp, ChevronDown } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '../lib/supabase';
import MeasurementWizard from './MeasurementWizard';
import type { Measurement, MeasurementKey } from '../types/measurements';
import { MEASUREMENT_LABELS, MEASUREMENT_UNITS } from '../types/measurements';

const METRIC_OPTIONS: { key: MeasurementKey; color: string }[] = [
  { key: 'peso', color: '#10b981' },
  { key: 'petto', color: '#0ea5e9' },
  { key: 'vita', color: '#f59e0b' },
  { key: 'fianchi', color: '#f472b6' },
  { key: 'cosce', color: '#a78bfa' },
  { key: 'braccia', color: '#fb923c' },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  unit: string;
}

function CustomTooltip({ active, payload, label, unit }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-white/[0.08] rounded-xl px-3 py-2 shadow-xl">
      <p className="text-[10px] text-zinc-400 mb-0.5">{label}</p>
      <p className="text-sm font-bold text-white">
        {payload[0].value} <span className="text-zinc-500 font-normal text-xs">{unit}</span>
      </p>
    </div>
  );
}

export default function MeasurementsPage() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(() => sessionStorage.getItem('measureWizardOpen') === '1');

  function openWizard() {
    sessionStorage.setItem('measureWizardOpen', '1');
    setShowWizard(true);
  }

  function closeWizard() {
    sessionStorage.removeItem('measureWizardOpen');
    setShowWizard(false);
  }
  const [selectedMetric, setSelectedMetric] = useState<MeasurementKey>('peso');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchMeasurements = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('measurements')
      .select('*')
      .order('date', { ascending: true });
    setMeasurements((data ?? []) as Measurement[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMeasurements();
  }, [fetchMeasurements]);

  const metricConfig = METRIC_OPTIONS.find((m) => m.key === selectedMetric)!;
  const unit = MEASUREMENT_UNITS[selectedMetric];

  const chartData = measurements
    .filter((m) => m[selectedMetric] !== null)
    .map((m) => ({
      date: formatDate(m.date),
      value: m[selectedMetric] as number,
    }));

  const lastEntry = measurements.length > 0 ? measurements[measurements.length - 1] : null;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-6 pb-8">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)] px-4 py-3 rounded-2xl bg-emerald-900/90 border border-emerald-500/30 backdrop-blur-md shadow-2xl animate-fade-in">
          <p className="text-sm font-semibold text-emerald-300 text-center">{toast}</p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Misurazioni</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {measurements.length > 0 ? `${measurements.length} rilevazioni` : 'Nessuna misurazione'}
          </p>
        </div>
        <button
          onClick={() => openWizard()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuova Misurazione
        </button>
      </div>

      {lastEntry && (
        <div className="grid grid-cols-3 gap-2.5">
          {METRIC_OPTIONS.map(({ key, color }) => {
            const val = lastEntry[key];
            if (val === null) return null;
            return (
              <div key={key} className="flex flex-col gap-1 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {MEASUREMENT_LABELS[key]}
                </span>
                <span className="text-base font-bold tabular-nums" style={{ color }}>
                  {val}
                </span>
                <span className="text-[10px] text-zinc-600">{MEASUREMENT_UNITS[key]}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-zinc-200">Andamento</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/[0.08] text-sm text-zinc-300 font-medium transition-colors"
            >
              <span style={{ color: metricConfig.color }}>{MEASUREMENT_LABELS[selectedMetric]}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-40 bg-zinc-800 border border-white/[0.08] rounded-xl overflow-hidden shadow-xl z-10">
                {METRIC_OPTIONS.map(({ key, color }) => (
                  <button
                    key={key}
                    onClick={() => { setSelectedMetric(key); setDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                      selectedMetric === key
                        ? 'bg-white/[0.06] text-white'
                        : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    {MEASUREMENT_LABELS[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        ) : chartData.length < 2 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <TrendingUp className="w-8 h-8 text-zinc-700" />
            <p className="text-xs text-zinc-600 text-center">
              {chartData.length === 0
                ? 'Nessun dato per questa metrica'
                : 'Aggiungi almeno 2 misurazioni per vedere il grafico'}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={metricConfig.color}
                strokeWidth={2}
                dot={{ fill: metricConfig.color, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: metricConfig.color, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {measurements.length > 0 && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Storico misurazioni
            </span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {[...measurements].reverse().map((m) => (
              <div key={m.id} className="px-4 py-3">
                <p className="text-xs font-semibold text-zinc-400 mb-2">
                  {new Date(m.date + 'T12:00:00').toLocaleDateString('it-IT', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
                <div className="flex flex-wrap gap-3">
                  {METRIC_OPTIONS.map(({ key, color }) => {
                    const val = m[key];
                    if (val === null) return null;
                    return (
                      <div key={key} className="flex items-baseline gap-1">
                        <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
                          {MEASUREMENT_LABELS[key]}
                        </span>
                        <span className="text-sm font-bold tabular-nums" style={{ color }}>
                          {val}
                        </span>
                        <span className="text-[10px] text-zinc-600">{MEASUREMENT_UNITS[key]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {measurements.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-zinc-300">Nessuna misurazione</p>
            <p className="text-xs text-zinc-600 mt-1">
              Inizia a tracciare il tuo progresso con la prima misurazione
            </p>
          </div>
          <button
            onClick={() => openWizard()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Aggiungi la prima misurazione
          </button>
        </div>
      )}

      {showWizard && (
        <MeasurementWizard
          latestMeasurement={lastEntry}
          onClose={closeWizard}
          onSaved={(toastMsg) => {
            closeWizard();
            fetchMeasurements();
            if (toastMsg) showToast(toastMsg);
          }}
        />
      )}
    </div>
  );
}
