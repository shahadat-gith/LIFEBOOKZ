import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import FormError from '../../components/common/FormError';
import { Icons } from '../../icons';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Which input the API rejected — "wrong email" vs "wrong password" — so the
  // offending field is marked, not just the form.
  const [fieldErrors, setFieldErrors] = useState({});
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      await loginAdmin(email, password);
      toast.success('Welcome back, admin.');
      navigate('/dashboard');
    } catch (err) {
      const payload = err?.response?.data?.error;
      setError(payload?.message || 'Could not sign you in. Please try again.');
      setFieldErrors(payload?.fields || {});
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="rounded-2xl border border-border/70 bg-card p-8 shadow-sm">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-md">
                <Icons.shieldCheck className="h-8 w-8 text-primary-foreground" />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-primary">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Sign in to continue.</p>
            </motion.div>
          </div>

          <motion.form onSubmit={handleSubmit} className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.4 }}>
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your admin email" required invalid={Boolean(fieldErrors.email)} icon={<Icons.mail className="h-4 w-4" />} />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required invalid={Boolean(fieldErrors.password)} icon={<Icons.lock className="h-4 w-4" />} showPasswordToggle />
            <FormError>{error}</FormError>
            <Button type="submit" fullWidth size="lg" loading={loading} icon={<Icons.login className="h-4 w-4" />}>Sign In</Button>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}
