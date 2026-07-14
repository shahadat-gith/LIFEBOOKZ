import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Card, { CardTitle } from '../../../components/ui/Card';
import { Icons } from '../../../icons';
import toast from 'react-hot-toast';

export function AuthorLoginPage() {
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
    <div className="w-full max-w-md px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="p-8 backdrop-blur-xl bg-card/90 border-border/50 shadow-2xl">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex justify-center mb-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-lg shadow-secondary/25">
                <Icons.edit className="h-8 w-8 text-white" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <CardTitle className="text-2xl">Author Sign In</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in to manage your stories
              </p>
            </motion.div>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              icon={<Icons.mail className="h-4 w-4" />}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              icon={<Icons.lock className="h-4 w-4" />}
              showPasswordToggle
            />

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-destructive flex items-center gap-1.5 p-3 rounded-lg bg-destructive/10"
              >
                <Icons.exclamationCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </motion.div>
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
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="mt-6 space-y-4"
          >
            <p className="text-center text-sm text-muted-foreground">
              Not registered yet?{' '}
              <Link
                to="/author/register"
                className="text-primary font-semibold hover:text-primary/80 transition-colors"
              >
                Apply to become an author
              </Link>
            </p>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Link
              to="/login"
              className="block text-center text-sm text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted/50"
            >
              <Icons.book className="h-3.5 w-3.5 inline mr-1.5" />
              Reader login
            </Link>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}

export default AuthorLoginPage;
