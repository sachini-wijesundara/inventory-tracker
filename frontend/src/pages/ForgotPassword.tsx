import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { useState } from 'react';
import { authApi } from '../services/api';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

type FormData = z.infer<typeof schema>;

export function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-ink">
      <div className="w-full max-w-md animate-fade-up">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-ash-light text-sm hover:text-paper mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to login
        </Link>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-lg flex items-center justify-center">
              <Mail size={18} className="text-accent" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-paper">Forgot password</h1>
              <p className="text-ash text-xs font-mono">We'll email you a reset link</p>
            </div>
          </div>

          {sent ? (
            <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-sm text-success">
              If an account exists with that email, a reset link has been sent. Check your inbox.
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input {...register('email')} type="email" className="input" placeholder="you@company.com" autoComplete="email" />
                {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
              </div>

              {error && <p className="text-danger text-sm bg-danger/10 border border-danger/20 rounded px-3 py-2">{error}</p>}

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
