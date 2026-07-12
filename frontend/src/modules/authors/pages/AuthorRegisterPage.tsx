import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../store/AuthContext';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import Button from '../../../components/ui/Button';
import Card, { CardTitle, CardContent } from '../../../components/ui/Card';
import { Icons } from '../../../icons';
import toast from 'react-hot-toast';

export default function AuthorRegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { registerAuthor } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    bio: '',
    website: '',
    // Social
    x: '',
    github: '',
    linkedin: '',
    // KYC
    dateOfBirth: '',
    phoneNumber: '',
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressCountry: '',
    addressZip: '',
    govIdType: '',
    govIdNumber: '',
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await registerAuthor({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        bio: form.bio,
        website: form.website,
        socialLinks: {
          x: form.x,
          github: form.github,
          linkedin: form.linkedin,
        },
        kyc: {
          dateOfBirth: form.dateOfBirth || undefined,
          phoneNumber: form.phoneNumber,
          address: {
            street: form.addressStreet,
            city: form.addressCity,
            state: form.addressState,
            country: form.addressCountry,
            zipCode: form.addressZip,
          },
          governmentId: form.govIdType
            ? { type: form.govIdType, number: form.govIdNumber }
            : undefined,
        },
      });
      toast.success('Application submitted! You will be notified once approved.');
      navigate('/author/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl py-10 px-4">
      <Card className="p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-lg">
              <Icons.edit className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Become an Author</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Share your stories with the world
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step >= s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s ? <Icons.check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
            <Icons.exclamationCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Account */}
          {step === 1 && (
            <CardContent className="space-y-4">
              <CardTitle>Account Details</CardTitle>
              <Input
                label="Full Name"
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                placeholder="Your legal name"
                required
                icon={<Icons.user className="h-4 w-4" />}
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="author@example.com"
                required
                icon={<Icons.mail className="h-4 w-4" />}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  icon={<Icons.lock className="h-4 w-4" />}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  placeholder="Repeat password"
                  required
                  icon={<Icons.lock className="h-4 w-4" />}
                />
              </div>
            </CardContent>
          )}

          {/* Step 2: Profile */}
          {step === 2 && (
            <CardContent className="space-y-4">
              <CardTitle>Profile &amp; Links</CardTitle>
              <Textarea
                label="Bio"
                value={form.bio}
                onChange={(e) => update('bio', e.target.value)}
                placeholder="Tell us about yourself and your writing..."
                rows={4}
              />
              <Input
                label="Website"
                type="url"
                value={form.website}
                onChange={(e) => update('website', e.target.value)}
                placeholder="https://yourwebsite.com"
                icon={<Icons.link className="h-4 w-4" />}
              />
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="X (Twitter)"
                  value={form.x}
                  onChange={(e) => update('x', e.target.value)}
                  placeholder="@username"
                  icon={<Icons.twitter className="h-4 w-4" />}
                />
                <Input
                  label="GitHub"
                  value={form.github}
                  onChange={(e) => update('github', e.target.value)}
                  placeholder="username"
                  icon={<Icons.github className="h-4 w-4" />}
                />
                <Input
                  label="LinkedIn"
                  value={form.linkedin}
                  onChange={(e) => update('linkedin', e.target.value)}
                  placeholder="URL or username"
                  icon={<Icons.linkedin className="h-4 w-4" />}
                />
              </div>
            </CardContent>
          )}

          {/* Step 3: KYC */}
          {step === 3 && (
            <CardContent className="space-y-4">
              <CardTitle>Identity Verification</CardTitle>
              <p className="text-sm text-muted-foreground">
                This helps us verify your identity. Your data is encrypted and secure.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date of Birth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => update('dateOfBirth', e.target.value)}
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => update('phoneNumber', e.target.value)}
                  placeholder="+1 234 567 890"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Street"
                  value={form.addressStreet}
                  onChange={(e) => update('addressStreet', e.target.value)}
                  placeholder="Street address"
                />
                <Input
                  label="City"
                  value={form.addressCity}
                  onChange={(e) => update('addressCity', e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="State"
                  value={form.addressState}
                  onChange={(e) => update('addressState', e.target.value)}
                  placeholder="State"
                />
                <Input
                  label="Country"
                  value={form.addressCountry}
                  onChange={(e) => update('addressCountry', e.target.value)}
                  placeholder="Country"
                />
                <Input
                  label="ZIP Code"
                  value={form.addressZip}
                  onChange={(e) => update('addressZip', e.target.value)}
                  placeholder="ZIP"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Government ID Type"
                  value={form.govIdType}
                  onChange={(e) => update('govIdType', e.target.value)}
                  placeholder="passport, driving-license, etc."
                />
                <Input
                  label="ID Number"
                  value={form.govIdNumber}
                  onChange={(e) => update('govIdNumber', e.target.value)}
                  placeholder="ID number"
                />
              </div>
            </CardContent>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <div>
              {step > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(step - 1)}
                  icon={<Icons.arrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Already an author? Sign in
              </Link>
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  icon={<Icons.arrowRight className="h-4 w-4" />}
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" loading={loading} size="lg">
                  Submit Application
                </Button>
              )}
            </div>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-border text-center">
          <Link
            to="/register"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Just want to read? Create a reader account
          </Link>
        </div>
      </Card>
    </div>
  );
}
