import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { firebaseAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/store/auth';

const SERIF: CSSProperties = { fontFamily: "'Fraunces', Georgia, serif" };

const COUNTRIES = [
  { code: '+91', flag: '🇮🇳', label: 'India' },
  { code: '+1', flag: '🇺🇸', label: 'USA' },
  { code: '+44', flag: '🇬🇧', label: 'UK' },
  { code: '+971', flag: '🇦🇪', label: 'UAE' },
  { code: '+65', flag: '🇸🇬', label: 'SG' },
];

type FirebaseLinkResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    avatar_url?: string | null;
  };
};

function FlowerLogo({ size = 96 }: { size?: number }) {
  const cx = 40;
  const cy = 40;
  const petalColor = '#F5E6D3';
  const centerColor = '#FF4716';
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ animation: 'lh-pulse 3s ease-in-out infinite' }}
    >
      {angles.map((deg) => (
        <ellipse key={deg} cx={cx} cy={18} rx={7} ry={14} fill={petalColor} transform={`rotate(${deg} ${cx} ${cy})`} />
      ))}
      <circle cx={cx} cy={cy} r={9} fill={centerColor} />
    </svg>
  );
}

export default function PhoneLogin() {
  const navigate = useNavigate();
  const setAuth = useAuth((s) => s.setAuth);

  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recaptchaRef = useRef<HTMLDivElement | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!recaptchaRef.current || verifierRef.current) return;
    verifierRef.current = new RecaptchaVerifier(firebaseAuth, recaptchaRef.current, { size: 'invisible' });
    return () => {
      try { verifierRef.current?.clear(); } catch {}
      verifierRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const cleaned = phone.replace(/[^0-9]/g, '');
  const fullPhone = `${country.code}${cleaned}`;
  const phoneValid = cleaned.length >= 7;

  const ensureVerifier = () => {
    if (verifierRef.current) return verifierRef.current;
    if (!recaptchaRef.current) throw new Error('reCAPTCHA host not ready');
    verifierRef.current = new RecaptchaVerifier(firebaseAuth, recaptchaRef.current, { size: 'invisible' });
    return verifierRef.current;
  };

  const sendCode = async (resend = false) => {
    if (!phoneValid) return;
    setSending(true);
    setError(null);
    try {
      const verifier = ensureVerifier();
      const c = await signInWithPhoneNumber(firebaseAuth, fullPhone, verifier);
      setConfirmation(c);
      setStep('otp');
      setCooldown(30);
      if (resend) toast.success('Code resent.');
    } catch (err: any) {
      setError(err?.message || 'Could not send code.');
      try { verifierRef.current?.clear(); } catch {}
      verifierRef.current = null;
    } finally {
      setSending(false);
    }
  };

  const onSubmitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendCode(false);
  };

  const onChangeCode = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(digits);
    if (error) setError(null);
    if (digits.length === 6) verifyCode(digits);
  };

  const verifyCode = async (digits: string) => {
    if (!confirmation || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const credential = await confirmation.confirm(digits);
      const idToken = await credential.user.getIdToken(true);
      const data = await api.post<FirebaseLinkResponse>('/auth/firebase-verify', { idToken });

      if (data.user.role !== 'admin' && data.user.role !== 'super_admin') {
        toast.error('This account does not have admin access.');
        setError('Not an admin account.');
        setVerifying(false);
        return;
      }

      setAuth(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : err?.message || 'Invalid code.';
      setError(msg);
      setCode('');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes lh-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        .lh-phone-root { display: flex; min-height: 100vh; align-items: center; justify-content: center; background: var(--background, #faf9f7); padding: 24px; }
        .lh-phone-inner { width: 100%; max-width: 380px; }
        .lh-toggle-row { display: flex; justify-content: center; gap: 10px; margin-bottom: 16px; font-size: 12px; color: rgba(14,14,12,0.55); }
        .lh-toggle-row a { color: rgba(14,14,12,0.55); text-decoration: underline; }
        .lh-toggle-row .active { color: rgba(14,14,12,0.95); font-weight: 600; }
      `}</style>

      <div className="lh-phone-root">
        <div className="lh-phone-inner">
          <div className="mb-8 text-center flex flex-col items-center gap-3">
            <FlowerLogo size={72} />
            <div>
              <h1 className="text-3xl font-semibold text-foreground" style={{ ...SERIF, fontStyle: 'italic' }}>
                LeadHangover
              </h1>
              <p className="text-base text-muted-foreground mt-1">Admin · Phone sign-in</p>
            </div>
          </div>

          <div className="lh-toggle-row">
            <Link to="/login/email">Sign in with email</Link>
            <span aria-hidden="true">·</span>
            <span className="active">Phone</span>
          </div>

          {step === 'phone' ? (
            <form onSubmit={onSubmitPhone} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <div className="flex gap-2">
                  <select
                    value={country.code}
                    onChange={(e) => {
                      const c = COUNTRIES.find((x) => x.code === e.target.value);
                      if (c) setCountry(c);
                    }}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="98765 43210"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll send a 6-digit code via SMS. Standard rates apply.
                </p>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={!phoneValid || sending}>
                {sending ? 'Sending…' : 'Send code'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="otp">Code sent to {fullPhone}</Label>
                <Input
                  id="otp"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="••••••"
                  value={code}
                  onChange={(e) => onChangeCode(e.target.value)}
                  autoFocus
                  disabled={verifying}
                  style={{ letterSpacing: '0.6em', fontSize: 22, textAlign: 'center' }}
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex justify-between text-xs">
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setCode(''); setConfirmation(null); setError(null); }}
                  className="underline text-muted-foreground"
                >
                  Use a different number
                </button>
                <button
                  type="button"
                  onClick={() => sendCode(true)}
                  disabled={cooldown > 0 || sending}
                  className="font-semibold disabled:opacity-50"
                  style={{ color: cooldown > 0 ? 'inherit' : '#FF4716' }}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
              </div>
              {verifying && <p className="text-xs text-center text-muted-foreground">Verifying…</p>}
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground mt-6">
            Admin access required. Your account is verified after sign-in.
          </p>

          <div ref={recaptchaRef} id="lh-admin-recaptcha-container" />
        </div>
      </div>
    </>
  );
}
