import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../store/AuthContext';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Card, { CardTitle } from '../../../components/ui/Card';
import { Icons } from '../../../icons';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const googleError = searchParams.get('error');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginUser(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Invalid email or password';
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
              <Icons.book className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to your account
          </p>
        </div>

        {googleError && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
            <Icons.exclamationCircle className="h-4 w-4 flex-shrink-0" />
            Google authentication failed. Please try again.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="••••••••"
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
            icon={<Icons.login className="h-4 w-4" />}
          >
            Sign In
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button
          variant="outline"
          fullWidth
          size="lg"
          icon={<Icons.google className="h-5 w-5" />}
          onClick={() => {
            window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'}/auth/google`;
          }}
        >
          Google
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-primary font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>

        <div className="mt-4 pt-4 border-t border-border text-center">
          <Link
            to="/author/login"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Are you an author? Sign in here
          </Link>
        </div>
      </Card>
    </div>
  );
}
