import React, { useState } from 'react';
import { Button } from './ui/button';
import { signIn, resetPassword } from '../lib/auth';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resetMessage, setResetMessage] = useState('');

  const handleResetPassword = async () => {
    if (!resetEmail) return;
    setResetStatus('loading');
    try {
      await resetPassword(resetEmail);
      setResetStatus('success');
      setResetMessage('Link reset password telah dikirim ke email Anda.');
    } catch (err: any) {
      setResetStatus('error');
      setResetMessage(err.message || 'Gagal mengirim link reset password.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(email, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login gagal. Silakan cek email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden font-display">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-primary/15 rounded-full blur-[70px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-secondary/15 rounded-full blur-[70px]"></div>
      </div>

      <div className="w-full max-w-lg relative z-10 perspective-1000">
        {/* Main Card */}
        <div className="bg-white/85 dark:bg-black/45 backdrop-blur-md rounded-[40px] shadow-2xl border border-white/50 dark:border-white/10 p-8 md:p-12 transition-all hover:shadow-primary/10 hover:border-primary/20 group">

          {/* Header Section */}
          <div className="text-center mb-10 group-hover:transform group-hover:scale-105 transition-transform duration-500">
            <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center p-2">
              <img
                src="/image.png"
                alt="Logo TPMB Anita Wahyu Ningsih"
                className="h-full w-full rounded-2xl object-contain"
                decoding="async"
              />
            </div>

            <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">
              TPMB Anita
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Sistem Manajemen Inventory Terintegrasi
            </p>
          </div>

          {/* Quick Demo Login Buttons */}
          {/* <div className="grid grid-cols-3 gap-2 mb-8">
            <Button
              variant="outline"
              onClick={() => { setEmail('admin@test.com'); setPassword('password123'); }}
              className="h-auto flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all group/btn"
              type="button"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1 group-hover/btn:scale-110 transition-transform">
                <span className="material-icons-round text-lg">admin_panel_settings</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover/btn:text-primary">Admin</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => { setEmail('admin@uniera.ac.id'); setPassword('password123'); }}
              className="h-auto flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-500 transition-all group/btn"
              type="button"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-1 group-hover/btn:scale-110 transition-transform">
                <span className="material-icons-round text-lg">medication</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover/btn:text-blue-500">Farmasi</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => { setEmail('nakes@uniera.ac.id'); setPassword('password123'); }}
              className="h-auto flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 hover:bg-green-500/10 hover:border-green-500/20 hover:text-green-500 transition-all group/btn"
              type="button"
            >
              <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-1 group-hover/btn:scale-110 transition-transform">
                <span className="material-icons-round text-lg">medical_services</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover/btn:text-green-500">Nakes</span>
            </Button>
          </div> */}

          <div className="space-y-8">
            <div className="relative flex items-center justify-center">
              <span className="bg-gray-100 dark:bg-white/5 px-4 py-1 rounded-full text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Silakan Masuk
              </span>
            </div>

            {error && (
              <div className="p-4 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-100 dark:border-red-800 rounded-2xl animate-shake">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400">
                    <span className="material-icons-round text-lg">priority_high</span>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 font-bold">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 group/input">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wide">Alamat Email</label>
                <div className="relative transition-all duration-300 focus-within:transform focus-within:scale-[1.02]">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-4 text-slate-800 dark:text-white font-semibold placeholder:font-normal placeholder-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                    placeholder="nama@email.com"
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute left-4 top-4 text-slate-400 group-focus-within/input:text-primary transition-colors">
                    <span className="material-icons-round text-xl">mail</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 group/input">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wide">Kata Sandi</label>
                <div className="relative transition-all duration-300 focus-within:transform focus-within:scale-[1.02]">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-4 text-slate-800 dark:text-white font-semibold placeholder:font-normal placeholder-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute left-4 top-4 text-slate-400 group-focus-within/input:text-primary transition-colors">
                    <span className="material-icons-round text-xl">lock_open</span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-auto group relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary/30 transition-all transform hover:-translate-y-1 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed border-none"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {isLoading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">Masuk Aplikasi</span>
                      <span className="material-icons-round group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </>
                  )}
                </div>
                {/* Shine Effect - Manual implementation as Button doesn't support children outside standard content easily without custom composition, but we are wrapping children */}
                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shine" />
              </Button>
            </form>

            {/* Footer Credit
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setIsResetMode(!isResetMode); setResetStatus('idle'); setResetMessage(''); }}
                className="text-sm font-semibold text-slate-400 hover:text-primary transition-colors"
              >
                {isResetMode ? 'Kembali ke Login' : 'Lupa Password?'}
              </button>
              {isResetMode && (
                <div className="mt-4 space-y-3">
                  <input
                    type="email"
                    className="w-full bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                    placeholder="Masukkan email Anda"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resetStatus === 'loading'}
                    className="w-full bg-primary text-white rounded-xl px-4 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {resetStatus === 'loading' ? 'Mengirim...' : 'Kirim Link Reset'}
                  </button>
                  {resetMessage && (
                    <p className={`text-sm ${resetStatus === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                      {resetMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
             */}
          </div>
        </div>

        {/* Footer Credit */}
        <p className="text-center text-slate-400 text-xs mt-8 font-medium">
          &copy; {new Date().getFullYear()} TPMB Anita. Hak cipta dilindungi.
        </p>


      </div>
    </div>
  );
};

export default LoginPage;
