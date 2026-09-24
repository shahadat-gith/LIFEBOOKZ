import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card, { CardTitle } from '../components/ui/Card';
import FormError from '../components/common/FormError';
import { Icons } from '../icons';
import toast from 'react-hot-toast';

export default function DeveloperLoginPage() {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 // Which input the API rejected — "wrong email" vs "wrong password" — so the
 // offending field is marked, not just the form.
 const [fieldErrors, setFieldErrors] = useState({});
 const { login } = useAuth();
 const navigate = useNavigate();

 async function handleSubmit(e) {
  e.preventDefault();
  setError('');
  setFieldErrors({});
  setLoading(true);
  try {
   await login(email, password);
   toast.success('Signed in to the developer portal');
   navigate('/logs');
  } catch (err) {
   const payload = err?.response?.data?.error;
   setError(
     payload?.message || 'Could not sign you in. Please try again.'
   );
   setFieldErrors(payload?.fields || {});
  } finally {
   setLoading(false);
  }
 }

 return (
  <div className="w-full max-w-sm px-4">
   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
    <Card className="p-8 border-border">
     <div className="text-center mb-8">
      <motion.div
       initial={{ scale: 0.8, opacity: 0 }}
       animate={{ scale: 1, opacity: 1 }}
       transition={{ duration: 0.4, delay: 0.2 }}
      >
       <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
        <Icons.terminal className="h-8 w-8 text-white" />
       </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
       <CardTitle className="text-2xl text-center">Developer Sign In</CardTitle>
       <p className="text-sm text-muted-foreground mt-1">Application logs &amp; diagnostics</p>
      </motion.div>
     </div>

     <motion.form onSubmit={handleSubmit} className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.4 }}>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your developer email"
        required
        invalid={Boolean(fieldErrors.email)}
        icon={<Icons.mail className="h-4 w-4" />}
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        required
        invalid={Boolean(fieldErrors.password)}
        icon={<Icons.lock className="h-4 w-4" />}
        showPasswordToggle
      />
      <FormError>{error}</FormError>
      <Button type="submit" fullWidth size="lg" loading={loading} icon={<Icons.login className="h-4 w-4" />}>
        Sign In
      </Button>
     </motion.form>

     <p className="mt-6 pt-5 border-t border-border text-center text-xs text-muted-foreground">
       Access is limited to the credentials configured by <span className="font-mono">DEVELOPER_EMAIL</span> and <span className="font-mono">DEVELOPER_PASSWORD</span>.
     </p>
    </Card>
   </motion.div>
  </div>
 );
}
