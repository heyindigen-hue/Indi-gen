import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRegisterCommand } from '@/store/commands';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const STATE_CODES = [
  '01-JK', '02-HP', '03-PB', '04-CH', '05-UT', '06-HR', '07-DL', '08-RJ',
  '09-UP', '10-BR', '11-SK', '12-AR', '13-NL', '14-MN', '15-MI', '16-TR',
  '17-ML', '18-AS', '19-WB', '20-JH', '21-OR', '22-CG', '23-MP', '24-GJ',
  '26-DD', '27-MH', '29-KA', '30-GA', '32-KL', '33-TN', '34-PY', '35-AN',
  '36-TS', '37-AP', '38-LD',
];

type AddressData = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

type CompanySettings = {
  legal_name: string;
  gstin: string;
  pan: string;
  cin: string;
  address: AddressData;
  state_code: string;
};

type CompanyState = {
  legalName: string;
  gstin: string;
  pan: string;
  cin: string;
  address: AddressData;
  stateCode: string;
};

const DEFAULTS: CompanyState = {
  legalName: '',
  gstin: '',
  pan: '',
  cin: '',
  address: { line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' },
  stateCode: '',
};

function fromApi(data: CompanySettings): CompanyState {
  return {
    legalName: data.legal_name,
    gstin: data.gstin,
    pan: data.pan,
    cin: data.cin,
    address: data.address,
    stateCode: data.state_code,
  };
}

export default function CompanyPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<CompanySettings>({
    queryKey: ['settings-company'],
    queryFn: () => api.get<CompanySettings>('/admin/settings/company'),
  });

  const [form, setForm] = useState<CompanyState>(DEFAULTS);
  const [gstinTouched, setGstinTouched] = useState(false);

  useEffect(() => {
    if (data) {
      setForm(fromApi(data));
    }
  }, [data]);

  const gstinInvalid = gstinTouched && form.gstin.length > 0 && !GSTIN_REGEX.test(form.gstin);

  const mutation = useMutation({
    mutationFn: (values: CompanyState) =>
      api.patch('/admin/settings/company', {
        legal_name: values.legalName,
        gstin: values.gstin,
        pan: values.pan,
        cin: values.cin,
        address: values.address,
        state_code: values.stateCode,
      }),
    onSuccess: () => {
      toast.success('Company settings saved');
      qc.invalidateQueries({ queryKey: ['settings-company'] });
    },
    onError: () => {
      toast.error('Failed to save company settings');
    },
  });

  function setAddr<K extends keyof AddressData>(key: K, value: string) {
    setForm((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));
  }

  useRegisterCommand(
    {
      id: 'settings.company',
      label: 'Company settings',
      group: 'Settings',
      action: () => navigate('/settings/company'),
    },
    [navigate],
  );

  return (
    <div>
      <PageHeader
        title="Company"
        subtitle="Legal entity details used on invoices and compliance documents"
        actions={
          <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6 max-w-2xl">
          <div className="space-y-1.5">
            <Label htmlFor="legalName">
              Legal name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="legalName"
              value={form.legalName}
              onChange={(e) => setForm((p) => ({ ...p, legalName: e.target.value }))}
              placeholder="Acme Pvt Ltd"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                value={form.gstin}
                onChange={(e) => setForm((p) => ({ ...p, gstin: e.target.value.toUpperCase() }))}
                onBlur={() => setGstinTouched(true)}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
              />
              {gstinInvalid && (
                <p className="text-xs text-destructive">Invalid GSTIN format</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pan">PAN</Label>
              <Input
                id="pan"
                value={form.pan}
                onChange={(e) => setForm((p) => ({ ...p, pan: e.target.value.toUpperCase() }))}
                placeholder="AAAAA0000A"
                maxLength={10}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cin">CIN (optional)</Label>
            <Input
              id="cin"
              value={form.cin}
              onChange={(e) => setForm((p) => ({ ...p, cin: e.target.value.toUpperCase() }))}
              placeholder="U12345MH2020PTC123456"
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Address</p>
            <div className="space-y-1.5">
              <Label htmlFor="addrLine1">Line 1</Label>
              <Input
                id="addrLine1"
                value={form.address.line1}
                onChange={(e) => setAddr('line1', e.target.value)}
                placeholder="Street / Building"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addrLine2">Line 2</Label>
              <Input
                id="addrLine2"
                value={form.address.line2}
                onChange={(e) => setAddr('line2', e.target.value)}
                placeholder="Area / Locality"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="addrCity">City</Label>
                <Input
                  id="addrCity"
                  value={form.address.city}
                  onChange={(e) => setAddr('city', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addrState">State</Label>
                <Input
                  id="addrState"
                  value={form.address.state}
                  onChange={(e) => setAddr('state', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="addrPincode">Pincode</Label>
                <Input
                  id="addrPincode"
                  value={form.address.pincode}
                  onChange={(e) => setAddr('pincode', e.target.value)}
                  placeholder="400001"
                  maxLength={6}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addrCountry">Country</Label>
                <Input
                  id="addrCountry"
                  value={form.address.country}
                  onChange={(e) => setAddr('country', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>State code</Label>
            <Select
              value={form.stateCode}
              onValueChange={(v) => setForm((p) => ({ ...p, stateCode: v }))}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select state code" />
              </SelectTrigger>
              <SelectContent>
                {STATE_CODES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
