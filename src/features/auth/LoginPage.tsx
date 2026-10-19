import React, { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/form/Field';
import { PasswordInput } from '@/components/form/PasswordInput';
import { InfoBox } from '@/components/panel/InfoBox';
import { getErrorMessage } from '@/lib/utils';
import { signIn } from './api';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background p-4">
      {/* Latar: dua bidang warna lembut */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-[10%] -top-[10%] size-[45%] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-[10%] -right-[10%] size-[45%] rounded-full bg-chart-ser2/15 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col gap-6">
        <Card className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <img
              src="/logo.svg"
              alt="Logo Opnamix"
              className="mb-1 size-16 rounded-2xl object-contain"
              decoding="async"
            />
            <h1 className="text-2xl font-bold tracking-tight">Opnamix</h1>
            <p className="text-meta text-muted-foreground">
              Sistem Manajemen Inventory Terintegrasi
            </p>
          </div>

          {error && <InfoBox tone="bad">{error}</InfoBox>}

          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            <Field label="Alamat email" required>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                disabled={isLoading}
              />
            </Field>
            <Field label="Kata sandi" required>
              <PasswordInput
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </Field>
            <Button size="lg" type="submit" disabled={isLoading} className="mt-1 w-full">
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  Memproses…
                </>
              ) : (
                <>
                  Masuk
                  <ArrowRight aria-hidden />
                </>
              )}
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Opnamix. Hak cipta dilindungi.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
