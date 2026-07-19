import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { Icons } from '../icons';
import toast from 'react-hot-toast';

const INTEREST_OPTIONS = [
 'Fiction', 'Poetry', 'Romance', 'Mystery', 'Fantasy', 'Science Fiction',
 'Horror', 'Thriller', 'Historical', 'Biography', 'Self-Help', 'Philosophy',
 'Adventure', 'Comedy', 'Drama', 'Spirituality', 'Science', 'Technology',
 'Cooking', 'Travel', 'Nature', 'Sports', 'Music', 'Art',
];

export default function RegisterPage() {
 const [fullName, setFullName] = useState('');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [selectedInterests, setSelectedInterests] = useState([]);
 const [avatarFile, setAvatarFile] = useState(null);
 const [avatarPreview, setAvatarPreview] = useState(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const { registerUser } = useAuth()
 const navigate = useNavigate();
 const fileRef = useRef(null);

 function toggleInterest(interest) {
  setSelectedInterests(prev =>
   prev.includes(interest)
    ? prev.filter(i => i !== interest)
    : [...prev, interest],
  );
 }

 function handleAvatarChange(e) {
  const file = e.target.files?.[0] || null;
  setAvatarFile(file);
  if (file) {
   setAvatarPreview(URL.createObjectURL(file));
  } else {
   setAvatarPreview(null);
  }
 }

 async function handleSubmit(e) {
  e.preventDefault();
  if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
  setError(''); setLoading(true);
  try {
   const fd = new FormData();
   fd.append('email', email);
   fd.append('password', password);
   fd.append('fullName', fullName);
   fd.append('interests', JSON.stringify(selectedInterests));
   if (avatarFile) fd.append('avatar', avatarFile);
   await registerUser(fd);
   toast.success('Account created! Welcome to Lifebookz.');
   navigate('/');
  } catch (err) {
   const msg = (err.response?.data?.error?.message);
   setError(msg || 'Registration failed');
  } finally { setLoading(false); }
 }

 return (
  <div className="w-full max-w-2xl px-4 py-8">
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

     <motion.form onSubmit={handleSubmit} className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.4 }}>
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
       <div className="relative group">
        <Avatar
         src={avatarPreview || ''}
         name={fullName || 'You'}
         size="xl"
         className="ring-4 ring-border"
        />
        <button
         type="button"
         onClick={() => fileRef.current?.click()}
         className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
         <Icons.camera className="h-5 w-5 text-white" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
       </div>
       <span className="text-xs text-muted-foreground">Upload a profile picture (optional)</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
       <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g., Rahul Sharma" required icon={<Icons.user className="h-4 w-4" />} />
       <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required icon={<Icons.mail className="h-4 w-4" />} />
      </div>

      <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a strong password" required icon={<Icons.lock className="h-4 w-4" />} helperText="Min. 8 characters" showPasswordToggle />

      {/* Interests */}
      <div>
       <label className="block text-sm font-medium text-foreground mb-3">
        Select your interests
       </label>
       <div className="flex flex-wrap gap-2">
        {INTEREST_OPTIONS.map(interest => (
         <button
          key={interest}
          type="button"
          onClick={() => toggleInterest(interest)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
           selectedInterests.includes(interest)
            ? 'bg-primary/15 text-primary border-primary/30 shadow-xs'
            : 'bg-transparent text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
          }`}
         >
          {interest}
         </button>
        ))}
       </div>
       {selectedInterests.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
         {selectedInterests.length} selected
        </p>
       )}
      </div>

      {error && (
       <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-sm text-destructive flex items-center gap-1.5 p-3 rounded-lg bg-destructive/10">
        <Icons.exclamationCircle className="h-4 w-4" />{error}
       </motion.div>
      )}

      <Button type="submit" fullWidth size="lg" loading={loading} icon={<Icons.userAdd className="h-4 w-4" />}>
       Create Account
      </Button>
     </motion.form>

     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.5 }} className="mt-6 text-center">
      <p className="text-sm text-muted-foreground">
       Already have an account?{' '}
       <Link to="/login" className="text-primary font-semibold hover:text-primary/80">Sign in</Link>
      </p>
     </motion.div>
    </Card>
   </motion.div>
  </div>
 );
}
