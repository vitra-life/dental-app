import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useActiveWorkspace, useMe, useSwitchWorkspace } from '@/data/session';
import { errorMessage } from '@/lib/api/errors';
import { showToast } from '@/lib/toast';

/**
 * The top bar's «clinic · position» button: lists every workspace of the
 * user, by clinic, and switches to the one chosen. Switching changes what
 * the user may do and whose data they see.
 */
export function WorkspaceSwitcher() {
  const { data: me } = useMe();
  const { clinic, workspace } = useActiveWorkspace();
  const switchWorkspace = useSwitchWorkspace();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!me || !clinic || !workspace) return null;
  const choices = me.clinics.flatMap((c) => c.workspaces).length;

  function choose(id: string) {
    setOpen(false);
    if (id === workspace?.id) return;
    switchWorkspace.mutate(id, { onError: (error) => showToast(errorMessage(error), 'error') });
  }

  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={choices < 2}
        aria-expanded={open}
        aria-label="جایگاه کاری"
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-surface-200 hover:bg-surface-50 text-sm disabled:cursor-default disabled:hover:bg-white max-w-[60vw]"
      >
        <span className="truncate text-surface-500 hidden sm:inline">{clinic.clinic_name} ·</span>
        <span className="truncate font-medium text-surface-800">{workspace.label}</span>
        {choices > 1 && <ChevronDown size={15} className={`text-surface-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 max-w-[85vw] bg-white border border-surface-200 rounded-xl shadow-lg p-1 z-30">
          {me.clinics.map((c) => (
            <div key={c.clinic_id}>
              <p className="text-xs text-surface-400 px-3 pt-2 pb-1">{c.clinic_name}</p>
              {c.workspaces.map((w) => (
                <button
                  key={w.id}
                  disabled={switchWorkspace.isPending}
                  onClick={() => choose(w.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-surface-700 hover:bg-surface-50 text-right"
                >
                  <span className="flex-1 truncate">{w.label}</span>
                  {w.id === workspace.id && <Check size={15} className="text-primary-600 shrink-0" />}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
