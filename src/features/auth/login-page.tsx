import { useState } from 'react';
import { useLogin } from '@/data/session';
import { ApiError, errorMessage, errorReason } from '@/lib/api/errors';
import { AuthCard } from './auth-card';

function loginErrorMessage(error: unknown): string {
  if (errorReason(error) === 'locked') return 'به دلیل چند تلاش ناموفق، ورود تا ۱۵ دقیقه ممکن نیست';
  if (error instanceof ApiError && error.status === 401) return 'شماره موبایل یا رمز عبور نادرست است';
  if (error instanceof ApiError && error.status === 400) return 'شماره موبایل را به شکل ۰۹۱۲۱۲۳۴۵۶۷ وارد کنید';
  return errorMessage(error);
}

export function LoginPage() {
  const login = useLogin();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');

  return (
    <AuthCard title="ورود" subtitle="با شماره موبایل و رمز عبور وارد شوید">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (mobile && password) login.mutate({ mobile: mobile.trim(), password });
        }}
      >
        <div>
          <label className="label-field" htmlFor="login-mobile">شماره موبایل</label>
          <input
            id="login-mobile"
            className="input-field"
            inputMode="numeric"
            autoComplete="username"
            placeholder="۰۹۱۲۱۲۳۴۵۶۷"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
        </div>
        <div>
          <label className="label-field" htmlFor="login-password">رمز عبور</label>
          <input
            id="login-password"
            type="password"
            className="input-field"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {login.error && <p role="alert" className="text-sm text-error-600">{loginErrorMessage(login.error)}</p>}
        <button type="submit" disabled={login.isPending || !mobile || !password} className="btn-primary w-full py-2.5">
          {login.isPending ? 'در حال ورود...' : 'ورود'}
        </button>
      </form>
    </AuthCard>
  );
}
