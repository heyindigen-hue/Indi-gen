import { useState, KeyboardEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/store/auth';
import type { User } from '@/store/auth';

const TOTAL_STEPS = 9;

type OnboardingData = {
  companyName: string;
  tagline: string;
  description: string;
  idealClients: string[];
  industries: string[];
  geography: string[];
  searchPhrases: string[];
  budgetSignals: string[];
  plan: 'free' | 'starter' | 'pro' | '';
};

const INITIAL_DATA: OnboardingData = {
  companyName: '',
  tagline: '',
  description: '',
  idealClients: [],
  industries: [],
  geography: [],
  searchPhrases: [],
  budgetSignals: [],
  plan: '',
};

const PLANS = [
  {
    key: 'free' as const,
    name: 'Free',
    price: '₹0 / mo',
    description: 'Get started with basic lead discovery. 50 lead credits per month.',
  },
  {
    key: 'starter' as const,
    name: 'Starter',
    price: '₹2,999 / mo',
    description: 'For growing teams. 500 lead credits, LinkedIn outreach, and priority support.',
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    price: '₹7,999 / mo',
    description: 'Unlimited leads, advanced filters, CRM sync, and a dedicated account manager.',
  },
];

function ProgressBar({ step }: { step: number }) {
  const pct = Math.round((step / TOTAL_STEPS) * 100);
  return (
    <div className="w-full mb-10">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-muted-foreground">
          Step {step} of {TOTAL_STEPS}
        </span>
        <span className="text-xs text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StepHeadline({ children }: { children: ReactNode }) {
  return (
    <h2
      className="text-3xl font-semibold text-foreground mb-2 leading-tight"
      style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }}
    >
      {children}
    </h2>
  );
}

type ChipInputProps = {
  chips: string[];
  onChange: (chips: string[]) => void;
  placeholder?: string;
  helper?: string;
};

function ChipInput({ chips, onChange, placeholder, helper }: ChipInputProps) {
  const [draft, setDraft] = useState('');

  const addChip = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || chips.includes(trimmed)) return;
    onChange([...chips, trimmed]);
    setDraft('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addChip(draft);
    }
    if (e.key === 'Backspace' && draft === '' && chips.length > 0) {
      onChange(chips.slice(0, -1));
    }
  };

  const removeChip = (index: number) => {
    onChange(chips.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800 font-medium"
            >
              {chip}
              <button
                type="button"
                onClick={() => removeChip(i)}
                className="ml-0.5 text-orange-500 hover:text-orange-700 leading-none"
                aria-label={`Remove ${chip}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addChip(draft)}
        placeholder={placeholder ?? 'Type and press Enter'}
      />
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const setUser = useAuth((s) => s.setUser);

  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const canContinue = (): boolean => {
    if (step === 1) return data.companyName.trim().length > 0;
    if (step === 4) return data.idealClients.length > 0;
    if (step === 5) return data.industries.length > 0;
    if (step === 6) return data.geography.length > 0;
    if (step === 7) return data.searchPhrases.length > 0;
    if (step === 9) return data.plan !== '';
    return true;
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleContinue = async () => {
    if (!canContinue()) return;
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }
    await handleFinish();
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        company_name: data.companyName,
        tagline: data.tagline || undefined,
        description: data.description || undefined,
        ideal_clients: data.idealClients,
        industries: data.industries,
        geography: data.geography,
        search_phrases: data.searchPhrases,
        budget_signals: data.budgetSignals.length > 0 ? data.budgetSignals : undefined,
        plan: data.plan || undefined,
      };
      const updatedUser = await api.patch<User>('/users/me/onboarding', payload);
      setUser(updatedUser);
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const optionalSteps = new Set([2, 3, 8]);
  const isOptional = optionalSteps.has(step);

  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <ProgressBar step={step} />

        <div className="min-h-[320px]">
          {step === 1 && (
            <div className="space-y-4">
              <StepHeadline>What's your company name?</StepHeadline>
              <p className="text-muted-foreground">We'll use this to personalise your experience.</p>
              <Input
                autoFocus
                placeholder="Acme Corp"
                value={data.companyName}
                onChange={(e) => set('companyName', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canContinue() && handleContinue()}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <StepHeadline>Write a short tagline</StepHeadline>
              <p className="text-muted-foreground">A one-liner that captures what you do.</p>
              <Input
                autoFocus
                placeholder="We help SaaS companies close enterprise deals faster"
                value={data.tagline}
                onChange={(e) => set('tagline', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <StepHeadline>Describe your company</StepHeadline>
              <p className="text-muted-foreground">
                What do you do, how, and for whom? This helps us craft better outreach.
              </p>
              <Textarea
                autoFocus
                placeholder="We build AI-powered sales tools for B2B startups…"
                rows={5}
                value={data.description}
                onChange={(e) => set('description', e.target.value)}
                className="resize-none"
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <StepHeadline>Who are your ideal clients?</StepHeadline>
              <p className="text-muted-foreground">
                Add titles, personas, or company types. Press Enter after each.
              </p>
              <ChipInput
                chips={data.idealClients}
                onChange={(chips) => set('idealClients', chips)}
                placeholder="e.g. VP of Sales, Series B startup, HR Director"
              />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <StepHeadline>Which industries do you serve?</StepHeadline>
              <p className="text-muted-foreground">
                Add the industries your best clients come from.
              </p>
              <ChipInput
                chips={data.industries}
                onChange={(chips) => set('industries', chips)}
                placeholder="e.g. Fintech, SaaS, Healthcare, Real Estate"
              />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <StepHeadline>Where are your clients located?</StepHeadline>
              <p className="text-muted-foreground">
                Countries, states, or cities — whatever fits your targeting.
              </p>
              <ChipInput
                chips={data.geography}
                onChange={(chips) => set('geography', chips)}
                placeholder="e.g. India, UAE, Mumbai, Singapore"
              />
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <StepHeadline>What search phrases find them on LinkedIn?</StepHeadline>
              <p className="text-muted-foreground">
                Think about how you'd search for your ideal client on LinkedIn Sales Navigator.
              </p>
              <ChipInput
                chips={data.searchPhrases}
                onChange={(chips) => set('searchPhrases', chips)}
                placeholder="e.g. CTO fintech Mumbai"
                helper="e.g. 'CTO fintech Mumbai', 'VP Sales B2B SaaS', 'Founder edtech India'"
              />
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4">
              <StepHeadline>What budget signals matter to you?</StepHeadline>
              <p className="text-muted-foreground">
                Keywords that suggest a lead has budget — like funding rounds, headcount, or tech stack.
              </p>
              <ChipInput
                chips={data.budgetSignals}
                onChange={(chips) => set('budgetSignals', chips)}
                placeholder="e.g. Series A, 50+ employees, Salesforce user"
              />
            </div>
          )}

          {step === 9 && (
            <div className="space-y-6">
              <StepHeadline>Choose your plan</StepHeadline>
              <p className="text-muted-foreground">
                You can upgrade or downgrade anytime from your account settings.
              </p>
              <div className="space-y-3">
                {PLANS.map((plan) => {
                  const isSelected = data.plan === plan.key;
                  return (
                    <button
                      key={plan.key}
                      type="button"
                      onClick={() => set('plan', plan.key)}
                      className={[
                        'w-full text-left rounded-xl border-2 p-4 transition-all',
                        isSelected
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-border hover:border-orange-300 bg-card',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="text-base font-semibold text-foreground"
                          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                        >
                          {plan.name}
                        </span>
                        <span className="text-sm font-medium text-orange-600">{plan.price}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isOptional && (
              <button
                type="button"
                onClick={handleContinue}
                disabled={isSubmitting}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Skip for now
              </button>
            )}
            <Button
              onClick={handleContinue}
              disabled={!canContinue() || isSubmitting}
              style={{ backgroundColor: '#f97316', borderColor: '#f97316' }}
              className="text-white hover:opacity-90 min-w-[120px]"
            >
              {isSubmitting
                ? 'Saving…'
                : step === TOTAL_STEPS
                ? 'Finish'
                : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
