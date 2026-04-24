import { XIcon } from '@/icons';
import { useEffect, useState } from 'react';

const TOKEN_KEY = 'leadhangover_imp_token';
const USER_KEY = 'leadhangover_imp_user';

type ImpUser = { name: string; email: string };

export function ImpersonationBanner() {
  const [impUser, setImpUser] = useState<ImpUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    if (token && raw) {
      try {
        setImpUser(JSON.parse(raw) as ImpUser);
      } catch {
        setImpUser({ name: 'Unknown', email: '' });
      }
    }
  }, []);

  if (!impUser) return null;

  const stop = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.reload();
  };

  return (
    <div className="bg-amber-400 text-amber-950 flex items-center justify-between px-4 py-2 text-sm font-medium shrink-0">
      <span>
        Acting as <strong>{impUser.name}</strong>
        {impUser.email ? ` (${impUser.email})` : ''}. Actions are logged.
      </span>
      <button onClick={stop} className="flex items-center gap-1 hover:underline font-semibold">
        <XIcon size={14} />
        Stop impersonation
      </button>
    </div>
  );
}
