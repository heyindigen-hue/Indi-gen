import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/store/auth';
import type { User } from '@/store/auth';
import { BrandShell, BRAND } from '@/components/auth/BrandShell';

const schema = z
  .object({
    name: z.string().min(1, 'Name required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

type SignupResponse = {
  token: string;
  user: User;
};

export default function Signup() {
  const navigate = useNavigate();
  const setAuth = useAuth((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      const data = await api.post<SignupResponse>('/auth/signup', {
        name: values.name,
        email: values.email,
        password: values.password,
      });
      setAuth(data.token, data.user);
      navigate('/onboarding');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Signup failed');
      }
    }
  };

  return (
    <BrandShell
      eyebrow="LeadHangover · Indigen Services"
      headline="Start your hunt."
      subhead="Wake up to better leads."
      footer={
        <>
          <p className="text-center text-sm" style={{ color: BRAND.ash }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: BRAND.orange,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Sign in
            </Link>
          </p>

          <p className="text-center mt-4" style={{ fontSize: 11, color: BRAND.ash }}>
            By signing up you agree to our{' '}
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
        <Field label="Full name" error={errors.name?.message}>
          <input
            id="name"
            type="text"
            placeholder="Priya Sharma"
            autoComplete="name"
            className="lh-line-input"
            {...register('name')}
          />
        </Field>

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
            autoComplete="new-password"
            className="lh-line-input"
            {...register('password')}
          />
        </Field>

        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          <input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            className="lh-line-input"
            {...register('confirmPassword')}
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
          {isSubmitting ? 'Creating account…' : 'Create account →'}
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
