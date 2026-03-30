import { useState } from 'react';
import { Zap, Mail, Lock, AlertCircle, CheckCircle, Github } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register' | 'coming-soon';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim()) {
      setError('Inserisci email e password.');
      return;
    }
    if (password.length < 6) {
      setError('La password deve essere almeno 6 caratteri.');
      return;
    }

    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email.trim(), password);
      if (error) setError(translateError(error));
    } else {
      const { error } = await signUp(email.trim(), password);
      if (error) {
        setError(translateError(error));
      } else {
        setSuccess('Account creato! Controlla la tua email per confermare, oppure accedi direttamente.');
        setMode('login');
      }
    }

    setLoading(false);
  };

  if (mode === 'coming-soon') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Defit</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              La registrazione non è ancora disponibile — il prodotto non è stato lanciato ufficialmente.
            </p>
          </div>
          <div className="w-full bg-zinc-900 border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-3 text-left">
            <p className="text-sm text-zinc-300 leading-relaxed">
              Defit è <span className="text-white font-semibold">open source</span>. Puoi clonarlo, usarlo in self-hosting con il tuo account Supabase e la tua chiave OpenAI, e contribuire allo sviluppo.
            </p>
            <a
              href="https://github.com/mbarealbo/defit"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 w-full justify-center bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
            >
              <Github className="w-4 h-4" />
              Vedi su GitHub
            </a>
          </div>
          <button
            onClick={() => setMode('login')}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Hai già un account? Accedi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Defit</h1>
            <p className="text-sm text-zinc-500 mt-1">Accedi al tuo account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete={mode === 'login' ? 'email' : 'new-password'}
                className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-3">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3.5 py-3">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-300">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            {loading ? 'Attendere...' : 'Accedi'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setMode(mode === 'login' ? 'coming-soon' : 'login'); setError(null); setSuccess(null); }}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {mode === 'login' ? "Non hai un account? Registrati" : 'Hai già un account? Accedi'}
          </button>
        </div>
      </div>
    </div>
  );
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email o password non corretti.';
  if (msg.includes('Email not confirmed')) return 'Conferma la tua email prima di accedere.';
  if (msg.includes('User already registered')) return 'Questa email e gia registrata.';
  if (msg.includes('Password should be at least')) return 'La password deve essere almeno 6 caratteri.';
  if (msg.includes('Unable to validate email')) return 'Email non valida.';
  return msg;
}
