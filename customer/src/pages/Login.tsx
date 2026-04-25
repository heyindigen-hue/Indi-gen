import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/store/auth';
import type { User } from '@/store/auth';
import { BrandShell, BRAND } from '@/components/auth/BrandShell';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type FormValues = z.infer<typeof schema>;

type LoginResponse = {
  token: string;
  user: User;
};

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuth((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      const data = await api.post<LoginResponse>('/auth/login', values);
      setAuth(data.token, data.user);

      if (data.user.role === 'admin' || data.user.role === 'super_admin') {
        window.location.href = '/admin';
        return;
      }

      if (!data.user.onboarding_completed_at) {
        navigate('/onboarding');
        return;
      }

      navigate('/');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Login failed');
      }
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
            <Link
              to="/signup"
              style={{
                color: BRAND.orange,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
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
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Field label="Email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            className="lh-line-input"
            {...register('email')}
          />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            className="lh-line-input"
            {...register('password')}
          />
        </Field>

        <button
          type="submit"
          disabled={isSubmitting}
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
            cursor: isSubmitting ? 'wait' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
            marginTop: 8,
            transition: 'opacity 160ms ease, transform 160ms ease',
          }}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in →'}
        </button>
      </form>
    </BrandShell>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
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
        {label}
      </label>
      {children}
      {error ? (
        <p
          style={{
            fontSize: 12,
            color: '#C8301A',
            fontFamily: BRAND.manrope,
          }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
