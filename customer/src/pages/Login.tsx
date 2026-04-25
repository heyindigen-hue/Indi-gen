import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/store/auth';
import type { User } from '@/store/auth';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type FormValues = z.infer<typeof schema>;

type LoginResponse = {
  token: string;
  user: User;
};

function FlowerLogo({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ animation: 'lh-pulse 3s ease-in-out infinite' }}
    >
      <circle cx="40" cy="40" r="38" fill="#f3eeff" />
      <ellipse cx="40" cy="18" rx="7" ry="14" fill="#552f83" opacity="0.9" />
      <ellipse cx="40" cy="18" rx="7" ry="14" fill="#552f83" opacity="0.9" transform="rotate(45 40 40)" />
      <ellipse cx="40" cy="18" rx="7" ry="14" fill="#552f83" opacity="0.9" transform="rotate(90 40 40)" />
      <ellipse cx="40" cy="18" rx="7" ry="14" fill="#552f83" opacity="0.9" transform="rotate(135 40 40)" />
      <ellipse cx="40" cy="18" rx="7" ry="14" fill="#7c4db8" opacity="0.7" transform="rotate(22.5 40 40)" />
      <ellipse cx="40" cy="18" rx="7" ry="14" fill="#7c4db8" opacity="0.7" transform="rotate(67.5 40 40)" />
      <ellipse cx="40" cy="18" rx="7" ry="14" fill="#7c4db8" opacity="0.7" transform="rotate(112.5 40 40)" />
      <ellipse cx="40" cy="18" rx="7" ry="14" fill="#7c4db8" opacity="0.7" transform="rotate(157.5 40 40)" />
      <circle cx="40" cy="40" r="9" fill="#f97316" />
      <circle cx="40" cy="40" r="5" fill="#fff3e0" />
    </svg>
  );
}

function PetalPattern() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {PETAL_POSITIONS.map((p, i) => (
        <svg
          key={i}
          viewBox="0 0 40 70"
          width={p.w}
          height={p.h}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            opacity: 0.05,
            transform: `rotate(${p.r}deg)`,
          }}
        >
          <ellipse cx="20" cy="20" rx="10" ry="20" fill="#552f83" />
        </svg>
      ))}
    </div>
  );
}

const PETAL_POSITIONS = [
  { x: '5%',  y: '8%',  w: 40, h: 70, r: 20  },
  { x: '15%', y: '65%', w: 30, h: 54, r: -15  },
  { x: '78%', y: '12%', w: 36, h: 64, r: 40  },
  { x: '88%', y: '55%', w: 28, h: 50, r: -30  },
  { x: '50%', y: '90%', w: 32, h: 58, r: 10  },
  { x: '35%', y: '3%',  w: 24, h: 42, r: -45  },
  { x: '92%', y: '88%', w: 20, h: 36, r: 25  },
  { x: '2%',  y: '45%', w: 22, h: 40, r: 60  },
];

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
    <>
      <style>{`
        @keyframes lh-pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.06); }
        }
      `}</style>

      <PetalPattern />

      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center flex flex-col items-center gap-3">
            <FlowerLogo size={120} />
            <div>
              <h1
                className="text-3xl font-semibold text-foreground"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }}
              >
                LeadHangover
              </h1>
              <p className="text-base text-muted-foreground mt-1">
                Wake up to better leads
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            New here?{' '}
            <Link to="/signup" className="text-orange-500 hover:text-orange-600 font-medium">
              Sign up
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground mt-4">
            By signing in you agree to our{' '}
            <a href="/terms" className="underline hover:text-foreground">Terms</a>
            {' · '}
            <a href="/privacy" className="underline hover:text-foreground">Privacy</a>
            {' · '}
            <a href="/dpdp" className="underline hover:text-foreground">DPDP</a>
          </p>
        </div>
      </div>
    </>
  );
}
