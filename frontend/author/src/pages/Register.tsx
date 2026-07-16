import { useState, useRef, type SubmitEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import Card, { CardTitle } from '../components/ui/Card';
import { Icons } from '../icons';
import toast from 'react-hot-toast';

const GOV_ID_OPTIONS = [
  { value: 'passport', label: 'Passport' }, { value: 'driving-license', label: 'Driving License' },
  { value: 'aadhar-card', label: 'Aadhaar Card' }, { value: 'pan-card', label: 'PAN Card' },
];

export default function AuthorRegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { registerAuthor } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '', fullName: '', bio: '', website: '', x: '', linkedin: '', instagram: '', phoneNumber: '', addressStreet: '', addressCity: '', addressState: '', addressCountry: '', addressZip: '', govIdType: '', govIdNumber: '' });
  const [docFile, setDocFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  function update(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(p => { const n = { ...p }; delete n[field]; return n; });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    if (!form.password.trim() || form.password.length < 8) e.password = 'Min. 8 characters';
    if (!form.bio.trim()) e.bio = 'Required';
    setFieldErrors(e); return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault(); if (!validate()) return;
    setError(''); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('email', form.email); fd.append('password', form.password); fd.append('fullName', form.fullName);
      fd.append('bio', form.bio); fd.append('website', form.website);
      fd.append('socialLinks', JSON.stringify({ x: form.x, linkedin: form.linkedin, instagram: form.instagram }));
      fd.append('kyc', JSON.stringify({
        phoneNumber: form.phoneNumber,
        address: { street: form.addressStreet, city: form.addressCity, state: form.addressState, country: form.addressCountry, zipCode: form.addressZip },
        governmentId: form.govIdType ? { type: form.govIdType, number: form.govIdNumber } : undefined,
      }));
      if (docFile) fd.append('document', docFile);
      await registerAuthor(fd);
      toast.success('Application submitted!'); navigate('/dashboard');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="p-8 backdrop-blur-xl bg-card/90 border-border/50 shadow-2xl">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-lg"><Icons.edit className="h-7 w-7 text-white" /></div>
            </div>
            <CardTitle className="text-3xl font-bold">Become an Author</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Share your stories with the world</p>
          </div>
          {error && <div className="mb-8 p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2"><Icons.exclamationCircle className="h-4 w-4" />{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Account</h3>
                <Input label="Full Name" value={form.fullName} onChange={e => update('fullName', e.target.value)} required error={fieldErrors.fullName} icon={<Icons.user className="h-4 w-4" />} />
                <Input label="Email" type="email" value={form.email} onChange={e => update('email', e.target.value)} required error={fieldErrors.email} icon={<Icons.mail className="h-4 w-4" />} />
                <Input label="Password" type="password" value={form.password} onChange={e => update('password', e.target.value)} required error={fieldErrors.password} icon={<Icons.lock className="h-4 w-4" />} showPasswordToggle />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 mt-6">Profile</h3>
                <Textarea label="Bio" value={form.bio} onChange={e => update('bio', e.target.value)} rows={3} required error={fieldErrors.bio} />
                <Input label="Website" type="url" value={form.website} onChange={e => update('website', e.target.value)} icon={<Icons.link className="h-4 w-4" />} />
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Identity Verification</h3>
                <Input label="Phone" type="tel" value={form.phoneNumber} onChange={e => update('phoneNumber', e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Street" value={form.addressStreet} onChange={e => update('addressStreet', e.target.value)} />
                  <Input label="City" value={form.addressCity} onChange={e => update('addressCity', e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input label="State" value={form.addressState} onChange={e => update('addressState', e.target.value)} />
                  <Input label="Country" value={form.addressCountry} onChange={e => update('addressCountry', e.target.value)} />
                  <Input label="ZIP" value={form.addressZip} onChange={e => update('addressZip', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="ID Type" value={form.govIdType} onChange={e => update('govIdType', e.target.value)} options={GOV_ID_OPTIONS} placeholder="Select ID" />
                  <Input label="ID Number" value={form.govIdNumber} onChange={e => update('govIdNumber', e.target.value)} />
                </div>
                <div><label className="block text-xs font-medium text-muted-foreground mb-1.5">Upload ID Document</label>
                  <div onClick={() => fileRef.current?.click()} className="border border-dashed border-input rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                    <input ref={fileRef} type="file" accept=".pdf,application/pdf" onChange={e => setDocFile(e.target.files?.[0] || null)} className="hidden" />
                    {docFile ? <span className="text-sm text-foreground">{docFile.name}</span> : <p className="text-xs text-muted-foreground">Click to upload ID proof</p>}
                  </div>
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 mt-6">Social Links</h3>
                <div className="grid grid-cols-3 gap-3">
                  <Input placeholder="X" value={form.x} onChange={e => update('x', e.target.value)} icon={<Icons.twitter className="h-4 w-4" />} />
                  <Input placeholder="Instagram" value={f
