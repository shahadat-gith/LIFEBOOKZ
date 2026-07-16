import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card, { CardTitle } from '../components/ui/Card';
import { Icons } from '../icons';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await loginAdmin(email, password);
      toast.success('Welcome admin!'); navigate('/dashboard');
    } catch { setError('Invalid admin credentials'); } finally { setLoading(false); }
  }

  return (
    <div className="w-full max-w-sm px-4">
      <Card className="p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-lg"><Icons.shieldCheck className="h-7 w-7 text-white" /></div>
          <CardTitle className="text-xl text-center">Admin Login</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">LifeBookz Administration</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@lifebookz.com" required icon={<Icons.mail className="h-4 w-4" />} />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter admin password" required icon={<Icons.lock className="h-4 w-4" />} showPasswordToggle />
          {error && <div className="text-sm text-destructive flex items-center gap-1.5 p-3 rounded-lg bg-destructive/10"><Icons.exclamationCircle className="h-4 w-4" />{error}</div>}
          <Button type="submit" fullWidth size="lg" loading={loading} icon={<Icons.login className="h-4 w-4" />}>Sign In</Button>
        </form>
      </Card>
    </div>
  );
}
