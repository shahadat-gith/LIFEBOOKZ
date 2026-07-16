import { useState, useRef, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Avatar from '../components/ui/Avatar';
import Card, { CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { Icons } from '../icons';
import { uploadApi } from '../api/upload';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AuthorProfilePage() {
  const { author, updateAuthor, logout } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(author?.fullName || '');
  const [bio, setBio] = useState(author?.bio || '');
  const [website, setWebsite] = useState(author?.website || '');
  const [x, setX] = useState(author?.socialLinks?.x || '');
  const [linkedin, setLinkedin] = useState(author?.socialLinks?.linkedin || '');
  const [instagram, setInstagram] = useState(author?.socialLinks?.instagram || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!author) { navigate('/login'); return null; }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const updates: Record<string, unknown> = { fullName, bio, website, socialLinks: { x, linkedin, instagram } };
      if (avatarFile) { const r = await uploadApi.uploadAvatar(avatarFile); updates.avatar = r.data.url; }
      await updateAuthor(updates);
      toast.success('Profile updated');
    } catch { toast.error('Failed to update'); } finally { setSaving(false); }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="flex items-center gap-6 mb-10">
        <div className="relative group">
          <Avatar src={author.avatar} name={author.fullName} size="xl" className="ring-4 ring-border" />
          <button type="button" onClick={() => fileRef.current?.click()} className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] || null)} className="hidden" />
        </div>
        <div><h1 className="text-2xl font-bold text-foreground">{author.fullName}</h1><p className="text-sm text-muted-foreground">{author.email}</p></div>
      </div>
      <form onSubmit={handleSubmit}>
        <Card><CardContent className="p-6 space-y-5">
          <CardTitle>Edit Profile</CardTitle>
          <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required icon={<Icons.user className="h-4 w-4" />} />
          <Input label="Email" value={author.email} disabled helperText="Email cannot be changed" />
          <Textarea label="Bio" value={bio} onChange={e => setBio(e.target.value)} rows={4} />
          <Input label="Website" type="url" value={website} onChange={e => setWebsite(e.target.value)} icon={<Icons.link className="h-4 w-4" />} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="X" value={x} onChange={e => setX(e.target.value)} icon={<Icons.twitter className="h-4 w-4" />} />
            <Input label="Instagram" value={instagram} onChange={e => setInstagram(e.target.value)} icon={<Icons.instagram className="h-4 w-4" />} />
            <Input label="LinkedIn" value={linkedin} onChange={e => setLinkedin(e.target.value)} icon={<Icons.linkedin className="h-4 w-4" />} />
          </div>
        </CardContent><CardFooter className="px-6 py-4">
          <Button type="submit" loading={saving} icon={<Icons.save className="h-4 w-4" />}>Save Changes</Button>
        </CardFooter></Card>
      </form>
      <Card hover padding="md" className="mt-4" onClick={() => { logout(); toast.success('Logged out'); }}>
        <div className="flex items-center gap-3 text-destructive"><Icons.logout className="h-5 w-5" /><span className="font-medium">Log Out</span></div>
      </Card>
    </div>
  );
}
