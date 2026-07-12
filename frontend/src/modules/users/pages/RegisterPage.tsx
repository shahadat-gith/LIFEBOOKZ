import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../store/AuthContext';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Card, { CardTitle } from '../../../components/ui/Card';
import { Icons } from '../../../icons';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await registerUser(email, password, name);
      toast.success('Account created! Welcome to Lifebookz.');
      navigate('/');
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
    <div className="w-full max-w-md">
      <Card className="p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Icons.userAdd className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Join Lifebookz and start reading
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            icon={<Icons.user className="h-4 w-4" />}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            icon={<Icons.mail className="h-4 w-4" />}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            icon={<Icons.lock className="h-4 w-4" />}
            helperText="Min. 8 characters"
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            required
            icon={<Icons.lock className="h-4 w-4" />}
          />

          {error && (
            <div className="text-sm text-destructive flex items-center gap-1.5">
              <Icons.exclamationCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            icon={<Icons.userAdd className="h-4 w-4" />}
          >
            Create Account
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button
          variant="outline"
          fullWidth
          size="lg"
          icon={<Icons.google className="h-5 w-5" />}
          onClick={() => {
            const apiUrl =
              import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
            window.location.href = `${apiUrl}/auth/google`;
          }}
        >
          Continue with Google
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>

        <div className="mt-4 pt-4 border-t border-border text-center">
          <Link
            to="/author/register"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Want to write? Become an author
          </Link>
        </div>
      </Card>
    </div>
  );
}
