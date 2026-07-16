import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card, { CardTitle } from '../components/ui/Card';
import { Icons } from '../icons';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError(''); setLoading(true);
    try { await registerUser(email, password, fullName); toast.success('Account created! Welcome to Lifebookz.'); navigate('/'); }
    catch (err: unknown) { const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message; setError(msg || 'Registration failed'); }
    finally { setLoading(false); }
  }

  return <div className="w-full max-w-md px-4">
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <Card className="p-8">
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }} className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg"><Icons.userAdd className="h-8 w-8 text-white" /></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Join Lifebookz and start your journey</p>
          </motion.div>
        </div>
        <motion.form onSubmit={handleSubmit} className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.4 }}>
          <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g., Rahul Sharma" required icon={<Icons.user className="h-4 w-4" />} />
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required icon={<Icons.mail className="h-4 w-4" />} />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a strong password" required icon={<Icons.lock className="h-4 w-4" />} helperText="Min. 8 characters" showPasswordToggle />
          <Input label="Confirm Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" required icon={<Icons.lock className="h-4 w-4" />} showPasswordToggle />
          {error && <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-sm text-destructive flex items-center gap-1.5 p-3 rounded-lg bg-destructive/10"><Icons.exclamationCircle className="h-4 w-4" />{error}</motion.div>}
          <Button type="submit" fullWidth size="lg" loading={loading} icon={<Icons.userAdd className="h-4 w-4" />}>Create Account</Button>
        </motion.form>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.5 }} className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">Already have an account? <Link to="/login" className="text-primary font-semibold hover:text-primary/80">Sign in</Link></p>
        </motion.div>
      </Card>
    </motion.div>
  </div>;
}
