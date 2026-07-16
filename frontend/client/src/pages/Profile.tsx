import { useState, useRef, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import Card, { CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { Icons } from '../icons';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      if (avatarFile) {
        const fd = new FormData(); fd.append('name', name); fd.append('avatar', avatarFile);
        await updateUser(fd);
      } else await updateUser({ name });
      toast.success('Profile updated');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  }

  if (!user) { navigate('/login'); return null; }

  return <div className="max-w-2xl mx-auto py-10 px-4">
    <div className="flex items-center gap-6 mb-10">
      <div className="relative group">
        <Avatar src={user.avatar} name={user.name} size="xl" className="ring-4 ring-border" />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] || null)} className="hidden" />
      </div>
      <div><h1 className="text-2xl font-bold">{user.name}</h1><p className="text-sm text-muted-foreground">{user.email}</p><p className="text-xs text-muted-foreground mt-1">Member since {new Date(user.createdAt).toLocaleDateString()}</p>{avatarFile && <p className="text-xs text-primary mt-1">Selected: {avatarFile.name}</p>}</div>
    </div>
    <Card className="mb-6">
      <form onSubmit={handleSubmit}>
        <CardContent className="p-6"><CardTitle className="mb-4">Edit Profile</CardTitle>
          <div className="space-y-4"><Input label="Name" value={name} onChange={e => setName(e.target.value)} required /><Input label="Email" value={user.email} disabled helperText="Email cannot be changed" /></div>
        </CardContent>
        <CardFooter className="px-6 py-4"><Button type="submit" loading={saving} icon={<Icons.save className="h-4 w-4" />}>Save Changes</Button></CardFooter>
      </form>
    </Card>
    <Card hover padding="md" onClick={() => navigate('/preferences')} className="mb-6 cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Icons.settings className="h-5 w-5 text-primary" /></div><div><p className="font-medium">Preferences</p><p className="text-sm text-muted-foreground">Interests, profession, languages & more</p></div></div>
        <Icons.chevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </Card>
    <Card hover padding="md" onClick={() => { logout(); navigate('/'); toast.success('Logged out'); }} className="cursor-pointer">
      <div className="flex items-center gap-3 text-destructive"><Icons.logout className="h-5 w-5" /><span className="font-medium">Log Out</span></div>
    </Card>
  </div>;
}
