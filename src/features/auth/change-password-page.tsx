import { useState } from 'react';
import { useChangePassword, useLogout } from '@/data/session';
import { ApiError, errorMessage } from '@/lib/api/errors';
import { AuthCard } from './auth-card';

const MIN_LENGTH = 8;

/** Shown while the account has a temporary password. */
export function ChangePasswordPage() {
  const change = useChangePassword();
  const logout = useLogout();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');

  const problem =
    next && next.length < MIN_LENGTH
      ? 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد'
      : repeat && next !== repeat
        ? 'تکرار رمز عبور با رمز جدید یکی نیست'
        : null;
  const failure =
    change.error instanceof ApiError && change.error.status === 401
      ? 'رمز عبور فعلی نادرست است'
      : change.error
        ? errorMessage(change.error)
        : null;

  return (
    <AuthCard title="تغییر رمز عبور" subtitle="رمز عبور شما موقت است؛ برای ادامه یک رمز جدید انتخاب کنید">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!problem && current && next && next === repeat) change.mutate({ current_password: current, new_password: next });
        }}
      >
        <div>
          <label className="label-field" htmlFor="current-password">رمز عبور فعلی</label>
          <input id="current-password" type="password" className="input-field" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div>
          <label className="label-field" htmlFor="new-password">رمز عبور جدید</label>
          <input id="new-password" type="password" className="input-field" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
        <div>
          <label className="label-field" htmlFor="repeat-password">تکرار رمز عبور جدید</label>
          <input id="repeat-password" type="password" className="input-field" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} />
        </div>
        {(problem || failure) && <p role="alert" className="text-sm text-error-600">{problem || failure}</p>}
        <button type="submit" disabled={change.isPending || !current || !next || next !== repeat || Boolean(problem)} className="btn-primary w-full py-2.5">
          {change.isPending ? 'در حال ذخیره...' : 'ذخیره و ادامه'}
        </button>
        <button type="button" onClick={() => logout.mutate()} className="btn-secondary w-full py-2.5">خروج</button>
      </form>
    </AuthCard>
  );
}
