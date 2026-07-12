import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../store/AuthContext';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Card, { CardTitle } from '../../../components/ui/Card';
import { Icons } from '../../../icons';
import toast from 'react-hot-toast';

export default function AuthorLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginAuthor } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginAuthor(email, password);
      toast.success('Welcome back, author!');
      navigate('/author/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Invalid credentials';
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-lg">
              <Icons.edit className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Author Sign In</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to manage your stories
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="author@example.com"
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

        <p className="text-center text-sm text-muted-foreground mt-6">
          Not registered yet?{' '}
          <Link
            to="/author/register"
            className="text-primary font-medium hover:underline"
          >
            Apply to become an author
          </Link>
        </p>

        <div className="mt-4 pt-4 border-t border-border text-center">
          <Link
            to="/login"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Reader login
          </Link>
        </div>
      </Card>
    </div>
  );
}
