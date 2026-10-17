import React, { useState } from 'react';
import { ArrowRight, CircleAlert, LockOpen, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn, resetPassword } from './api';
import { getErrorMessage } from '@/lib/utils';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

// Gaya input sebelum memakai ui/input; ukuran teks, fokus, dan disabled ditimpa
// supaya tampilan tidak berubah.
const LOGIN_INPUT_CLASS =
  'w-full bg-gray-50/50 dark:bg-white/5 border-gray-200 dark:border-white/10 pl-12 pr-4 text-base md:text-base text-slate-800 dark:text-white font-semibold placeholder:font-normal placeholder:text-slate-400 focus:ring-4 focus:ring-primary/10 focus:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 outline-none transition-all disabled:cursor-default disabled:opacity-100';

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  /* eslint-disable @typescript-eslint/no-unused-vars -- dipakai form reset password yang sedang dikomentari di bawah */
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
    } catch (err) {
      setResetStatus('error');
      setResetMessage(getErrorMessage(err) || 'Gagal mengirim link reset password.');
    }
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(email, password);
      onLoginSuccess();
    } catch (err) {
      setError(getErrorMessage(err) || 'Login gagal. Silakan cek email dan password Anda.');
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
        <div className="bg-white/85 dark:bg-black/45 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 dark:border-white/10 p-8 md:p-12 transition-all hover:shadow-primary/10 hover:border-primary/20 group">
          {/* Header Section */}
          <div className="text-center mb-10 group-hover:transform group-hover:scale-105 transition-transform duration-500">
            <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center p-2">
              <img
                src="/logo.svg"
                alt="Logo Opnamix"
                className="h-full w-full rounded-2xl object-contain"
                decoding="async"
              />
            </div>

            <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">
              Opnamix
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Sistem Manajemen Inventory Terintegrasi
            </p>
          </div>

          <div className="space-y-8">
            <div className="relative flex items-center justify-center">
              <span className="bg-gray-100 dark:bg-white/5 px-4 py-1 rounded-full text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Silakan Masuk
              </span>
            </div>

            {error && (
              <div className="p-4 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-100 dark:border-red-800 rounded-2xl animate-shake">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-700 dark:text-red-300">
                    <CircleAlert className="size-5" aria-hidden />
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 font-bold">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 group/input">
                <Label
                  htmlFor="login-email"
                  className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wide"
                >
                  Alamat Email
                </Label>
                <div className="relative transition-all duration-300 focus-within:transform focus-within:scale-[1.02]">
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={LOGIN_INPUT_CLASS}
                    placeholder="nama@email.com"
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute left-4 top-4 text-slate-400 group-focus-within/input:text-primary transition-colors">
                    <Mail className="size-5" aria-hidden />
                  </div>
                </div>
              </div>

              <div className="space-y-2 group/input">
                <Label
                  htmlFor="login-password"
                  className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wide"
                >
                  Kata Sandi
                </Label>
                <div className="relative transition-all duration-300 focus-within:transform focus-within:scale-[1.02]">
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={LOGIN_INPUT_CLASS}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute left-4 top-4 text-slate-400 group-focus-within/input:text-primary transition-colors">
                    <LockOpen className="size-5" aria-hidden />
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                type="submit"
                disabled={isLoading}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white font-bold shadow-xl shadow-primary/30 transition-all transform hover:-translate-y-1 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed border-none [&_svg]:size-6"
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
                      <ArrowRight
                        className="group-hover:translate-x-1 transition-transform"
                        aria-hidden
                      />
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
          &copy; {new Date().getFullYear()} Opnamix. Hak cipta dilindungi.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
