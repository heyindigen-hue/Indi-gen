import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { firebaseAuth } from '@/firebase';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/store/auth';
import type { User } from '@/store/auth';
import { BrandShell, BRAND } from '@/components/auth/BrandShell';

const COUNTRIES = [
  { code: '+91', flag: '🇮🇳', label: 'India' },
  { code: '+1', flag: '🇺🇸', label: 'USA' },
  { code: '+44', flag: '🇬🇧', label: 'UK' },
  { code: '+971', flag: '🇦🇪', label: 'UAE' },
  { code: '+65', flag: '🇸🇬', label: 'SG' },
];

type FirebaseLinkResponse = {
  token: string;
  user: User;
  needs_onboarding?: boolean;
};

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
    verifierRef.current = new RecaptchaVerifier(firebaseAuth, recaptchaRef.current, {
      size: 'invisible',
    });
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
    verifierRef.current = new RecaptchaVerifier(firebaseAuth, recaptchaRef.current, {
      size: 'invisible',
    });
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
      const msg = err?.message || 'Could not send code. Try again.';
      setError(msg);
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
      setAuth(data.token, data.user);

      if (data.user.role === 'admin' || data.user.role === 'super_admin') {
        window.location.href = '/admin';
        return;
      }

      const needs =
        data.needs_onboarding ?? (data.user.onboarding_completed_at ? false : true);
      navigate(needs ? '/onboarding' : '/');
    } catch (err: any) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err?.message || 'Invalid code. Try again.';
      setError(msg);
      setCode('');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <BrandShell
      eyebrow="LeadHangover · Indigen Services"
      headline="Welcome back."
      subhead="Wake up to better leads."
      footer={
        <>
          <p className="text-center text-sm" style={{ color: BRAND.ash }}>
            New here?{' '}
            <Link to="/signup" style={{ color: BRAND.orange, fontWeight: 600, textDecoration: 'none' }}>
              Sign up
            </Link>
          </p>
          <p className="text-center mt-4" style={{ fontSize: 11, color: BRAND.ash }}>
            By signing in you agree to our{' '}
            <a href="/terms" style={{ textDecoration: 'underline', color: BRAND.ash }}>Terms</a>
            {' · '}
            <a href="/privacy" style={{ textDecoration: 'underline', color: BRAND.ash }}>Privacy</a>
            {' · '}
            <a href="/dpdp" style={{ textDecoration: 'underline', color: BRAND.ash }}>DPDP</a>
          </p>
        </>
      }
    >
      <div className="flex justify-center mb-4 text-xs" style={{ color: BRAND.ash, fontFamily: BRAND.mono }}>
        <Link to="/login" style={{ textDecoration: 'underline', color: BRAND.ash }}>
          Sign in with email
        </Link>
        <span className="mx-2" aria-hidden="true">·</span>
        <span style={{ color: BRAND.ink, fontWeight: 600 }}>Phone</span>
      </div>

      {step === 'phone' ? (
        <form onSubmit={onSubmitPhone} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label
              style={{
                fontSize: 11,
                fontFamily: BRAND.mono,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: BRAND.ash,
              }}
            >
              Phone number
            </label>
            <div className="flex gap-3 items-end">
              <select
                value={country.code}
                onChange={(e) => {
                  const c = COUNTRIES.find((x) => x.code === e.target.value);
                  if (c) setCountry(c);
                }}
                style={{
                  background: 'transparent',
                  border: 0,
                  borderBottom: `1px solid rgba(14,14,12,0.18)`,
                  padding: '10px 0',
                  fontSize: 15,
                  fontFamily: BRAND.manrope,
                  color: BRAND.ink,
                  outline: 'none',
                  minWidth: 96,
                }}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="98765 43210"
                autoComplete="tel"
                className="lh-line-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <p style={{ fontSize: 11, color: BRAND.ash, fontFamily: BRAND.mono, letterSpacing: 0.4, marginTop: 6 }}>
              We'll send a 6-digit code via SMS. Standard rates apply.
            </p>
          </div>

          {error ? (
            <p style={{ fontSize: 12, color: '#C8301A', fontFamily: BRAND.manrope }}>{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={!phoneValid || sending}
            style={{
              backgroundColor: BRAND.orange,
              color: '#FFFFFF',
              fontFamily: BRAND.manrope,
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: '-0.005em',
              padding: '14px 18px',
              borderRadius: 999,
              border: 0,
              cursor: !phoneValid || sending ? 'not-allowed' : 'pointer',
              opacity: !phoneValid || sending ? 0.55 : 1,
              marginTop: 4,
              transition: 'opacity 160ms ease',
            }}
          >
            {sending ? 'Sending…' : 'Send code →'}
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label
              style={{
                fontSize: 11,
                fontFamily: BRAND.mono,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: BRAND.ash,
              }}
            >
              Code sent to {fullPhone}
            </label>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              className="lh-line-input"
              style={{
                fontFamily: BRAND.mono,
                letterSpacing: '0.6em',
                fontSize: 22,
                textAlign: 'center',
              }}
              value={code}
              onChange={(e) => onChangeCode(e.target.value)}
              autoFocus
              disabled={verifying}
            />
          </div>

          {error ? (
            <p style={{ fontSize: 12, color: '#C8301A', fontFamily: BRAND.manrope }}>{error}</p>
          ) : null}

          <div className="flex items-center justify-between gap-3 text-xs">
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setCode('');
                setConfirmation(null);
                setError(null);
              }}
              style={{
                background: 'transparent',
                border: 0,
                color: BRAND.ash,
                fontFamily: BRAND.manrope,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Use a different number
            </button>
            <button
              type="button"
              onClick={() => sendCode(true)}
              disabled={cooldown > 0 || sending}
              style={{
                background: 'transparent',
                border: 0,
                color: cooldown > 0 ? BRAND.ash : BRAND.orange,
                fontFamily: BRAND.manrope,
                fontWeight: 600,
                cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                opacity: cooldown > 0 ? 0.6 : 1,
              }}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>

          {verifying ? (
            <p
              style={{
                fontSize: 12,
                color: BRAND.ash,
                fontFamily: BRAND.mono,
                textAlign: 'center',
              }}
            >
              Verifying…
            </p>
          ) : null}
        </div>
      )}

      <div ref={recaptchaRef} id="lh-recaptcha-container" />
    </BrandShell>
  );
}
