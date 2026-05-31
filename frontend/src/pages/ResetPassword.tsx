import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { authApi } from '../services/api';

const schema = z.object({
  password: z.string().min(6, 'At least 6 characters'),
  confirm: z.string().min(1, 'Confirm your password'),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

type FormData = z.infer<typeof schema>;

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!token) { setError('Invalid reset link'); return; }
    setError('');
    try {
      await authApi.resetPassword(token, data.password);
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-ink">
        <div className="card p-6 max-w-md text-center">
          <p className="text-danger mb-4">Invalid or missing reset link.</p>
          <Link to="/forgot-password" className="btn-primary inline-block">Request new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-ink">
      <div className="w-full max-w-md animate-fade-up">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-lg flex items-center justify-center">
              <KeyRound size={18} className="text-accent" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-paper">Set new password</h1>
              <p className="text-ash text-xs font-mono">Choose a strong password</p>
            </div>
          </div>

          {done ? (
            <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-sm text-success">
              Password updated! Redirecting to login…
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">New password</label>
                <input {...register('password')} type="password" className="input" autoComplete="new-password" />
                {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="label">Confirm password</label>
                <input {...register('confirm')} type="password" className="input" autoComplete="new-password" />
                {errors.confirm && <p className="text-danger text-xs mt-1">{errors.confirm.message}</p>}
              </div>

              {error && <p className="text-danger text-sm bg-danger/10 border border-danger/20 rounded px-3 py-2">{error}</p>}

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
                {isSubmitting ? 'Saving…' : 'Reset password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
