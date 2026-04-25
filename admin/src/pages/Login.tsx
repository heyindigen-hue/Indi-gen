import type { CSSProperties } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/store/auth';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type FormValues = z.infer<typeof schema>;

type LoginResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    avatar_url?: string | null;
  };
};

const EDITORIAL_PHOTO =
  'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200';

const PHOTO_GRADIENT =
  'linear-gradient(180deg, rgba(11,10,8,0.15) 0%, rgba(11,10,8,0.55) 100%)';

const SERIF: CSSProperties = {
  fontFamily: "'Fraunces', Georgia, serif",
};

// Canonical brand flower logo — cream petals + orange center
function FlowerLogo({ size = 120 }: { size?: number }) {
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
        <ellipse
          key={deg}
          cx={cx}
          cy={18}
          rx={7}
          ry={14}
          fill={petalColor}
          transform={`rotate(${deg} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={9} fill={centerColor} />
    </svg>
  );
}

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
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,400;1,600&display=swap');

        @keyframes lh-pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.06); }
        }

        .lh-login-root {
          display: flex;
          min-height: 100vh;
        }

        /* ---- Photo half ---- */
        .lh-photo-half {
          position: relative;
          flex: 1;
          min-height: 40vh;
          background-image: url('${EDITORIAL_PHOTO}');
          background-size: cover;
          background-position: center;
          overflow: hidden;
        }

        .lh-photo-overlay {
          position: absolute;
          inset: 0;
          background: ${PHOTO_GRADIENT};
        }

        /* Caption text helpers */
        .lh-caption {
          position: absolute;
          color: #fff;
          line-height: 1.25;
        }
        .lh-caption-top-left {
          top: 24px;
          left: 24px;
        }
        .lh-caption-top-center {
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          white-space: nowrap;
        }
        .lh-caption-top-right {
          top: 24px;
          right: 24px;
          text-align: right;
        }

        .lh-caption-line-1 {
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.03em;
          opacity: 0.85;
        }
        .lh-caption-line-2 {
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.06em;
          opacity: 0.7;
          margin-top: 2px;
        }

        /* Center flower on photo */
        .lh-photo-center-logo {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          filter: drop-shadow(0 4px 16px rgba(0,0,0,0.35));
        }

        /* ---- Form half ---- */
        .lh-form-half {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          padding: 48px 24px;
          background: var(--background, #faf9f7);
        }

        .lh-form-inner {
          width: 100%;
          max-width: 380px;
        }

        /* ---- Mobile: stack vertically ---- */
        @media (max-width: 767px) {
          .lh-login-root {
            flex-direction: column;
          }
          .lh-photo-half {
            height: 40vh;
            flex: none;
          }
          .lh-form-half {
            flex: 1;
          }
        }

        /* ---- Desktop: side by side ---- */
        @media (min-width: 768px) {
          .lh-photo-half {
            min-height: 100vh;
          }
        }
      `}</style>

      <div className="lh-login-root">
        {/* ---- Left: editorial photo ---- */}
        <div className="lh-photo-half">
          <div className="lh-photo-overlay" />

          {/* Top-left caption */}
          <div className="lh-caption lh-caption-top-left" style={SERIF}>
            <div className="lh-caption-line-1">Nashik, India</div>
            <div className="lh-caption-line-2">Lead intelligence</div>
          </div>

          {/* Top-center caption */}
          <div className="lh-caption lh-caption-top-center" style={SERIF}>
            <div className="lh-caption-line-1" style={{ fontStyle: 'italic' }}>
              LeadHangover
            </div>
            <div className="lh-caption-line-2">Wake up to better leads</div>
          </div>

          {/* Top-right caption */}
          <div className="lh-caption lh-caption-top-right" style={SERIF}>
            <div className="lh-caption-line-1">Find buyers</div>
            <div className="lh-caption-line-2">before sunrise</div>
          </div>

          {/* Centered brand flower logo */}
          <div className="lh-photo-center-logo">
            <FlowerLogo size={200} />
          </div>
        </div>

        {/* ---- Right: login form ---- */}
        <div className="lh-form-half">
          <div className="lh-form-inner">
            {/* Logo + brand header */}
            <div className="mb-8 text-center flex flex-col items-center gap-3">
              <FlowerLogo size={72} />
              <div>
                <h1
                  className="text-3xl font-semibold text-foreground"
                  style={{ ...SERIF, fontStyle: 'italic' }}
                >
                  LeadHangover
                </h1>
                <p className="text-base text-muted-foreground mt-1">
                  Wake up to better leads
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  autoComplete="email"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
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
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              By signing in you agree to our{' '}
              <a href="/terms" className="underline hover:text-foreground">
                Terms
              </a>
              {' · '}
              <a href="/privacy" className="underline hover:text-foreground">
                Privacy
              </a>
              {' · '}
              <a href="/dpdp" className="underline hover:text-foreground">
                DPDP
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
