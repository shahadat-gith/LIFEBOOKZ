import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Avatar from '../components/ui/Avatar';
import Card, { CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Icons } from '../icons';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AuthorProfilePage() {
 const { author, updateProfile, logout } = useAuth();
 const navigate = useNavigate();
 const [fullName, setFullName] = useState(author?.fullName || '');
 const [profession, setProfession] = useState(author?.profession || '');
 const [bio, setBio] = useState(author?.bio || '');
 const [website, setWebsite] = useState(author?.website || '');
 const [x, setX] = useState(author?.socialLinks?.x || '');
 const [linkedin, setLinkedin] = useState(author?.socialLinks?.linkedin || '');
 const [instagram, setInstagram] = useState(author?.socialLinks?.instagram || '');
 const [avatarFile, setAvatarFile] = useState(File | null>(null);
 const [avatarPreview, setAvatarPreview] = useState(string | null>(null);
 const [saving, setSaving] = useState(false);
 const fileRef = useRef(HTMLInputElement>(null);

 // Revoke previous blob URL when preview changes or component unmounts
 useEffect(() => {
  return () => {
   if (avatarPreview) URL.revokeObjectURL(avatarPreview);
  };
 }, [avatarPreview]);

 const isApproved = author?.verification?.status === 'approved';

 if (!author) { navigate('/login'); return null; }

 async function handleSubmit(e) {
  e.preventDefault();
  setSaving(true);
  try {
   const fd = new FormData();
   fd.append('fullName', fullName);
   fd.append('profession', profession);
   fd.append('bio', bio);
   fd.append('website', website);
   fd.append('socialLinks', JSON.stringify({ x, linkedin, instagram }));
   if (avatarFile) fd.append('avatar', avatarFile);
   await updateProfile(fd);
   toast.success('Profile updated successfully');
   setAvatarFile(null);
   setAvatarPreview(null);
  } catch {
   toast.error('Failed to update profile');
  } finally {
   setSaving(false);
  }
 }

 function handleAvatarChange(e: ) {
  const file = e.target.files?.[0] || null;
  setAvatarFile(file);
  if (file) {
   const url = URL.createObjectURL(file);
   setAvatarPreview(url);
  } else {
   setAvatarPreview(null);
  }
 }

 const handleLogout = async () => {
  await logout();
  toast.success('Logged out');
  navigate('/login');
 };

 return (
  <motion.div
   initial={{ opacity: 0, y: 20 }}
   animate={{ opacity: 1, y: 0 }}
   transition={{ duration: 0.5 }}
   className="max-w-3xl mx-auto py-10 px-4 space-y-8"
  >
   {/* Profile Header */}
   <div className="flex flex-col sm:flex-row items-center gap-6 p-8 rounded-3xl border bg-gradient-to-br from-card to-muted/30">
    <div className="relative group flex-shrink-0">
     <Avatar
      src={avatarPreview || author.avatar?.url}
      name={author.fullName}
      size="2xl"
      className="ring-4 ring-primary/10"
     />
     <button
      type="button"
      onClick={() => fileRef.current?.click()}
      className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
     >
      <Icons.camera className="h-6 w-6 text-white" />
     </button>
     <input
      ref={fileRef}
      type="file"
      accept="image/*"
      onChange={handleAvatarChange}
      className="hidden"
     />
    </div>
    <div className="text-center sm:text-left">
     <h1 className="text-2xl font-bold text-foreground">{author.fullName}</h1>
     <p className="text-sm text-muted-foreground">{author.email}</p>
     <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
      <Badge variant={isApproved ? 'success' : 'warning'}>
       {isApproved ? 'Verified Author' : 'Pending Approval'}
      </Badge>
      {author.profession && (
       <span className="text-xs text-muted-foreground">• {author.profession}</span>
      )}
     </div>
     {avatarFile && (
      <p className="text-xs text-primary mt-2">New image selected: {avatarFile.name}</p>
     )}
    </div>
   </div>

   {/* Edit Form */}
   <form onSubmit={handleSubmit}>
    <Card>
     <CardContent className="p-6 space-y-6">
      <CardTitle>Edit Profile</CardTitle>

      <div className="grid gap-5 sm:grid-cols-2">
       <Input
        label="Full Name"
        value={fullName}
        onChange={e => setFullName(e.target.value)}
        required
        icon={<Icons.user className="h-4 w-4" />}
       />
       <Input
        label="Profession"
        value={profession}
        onChange={e => setProfession(e.target.value)}
        icon={<Icons.edit className="h-4 w-4" />}
        placeholder="Writer, Poet, Journalist..."
       />
      </div>

      <Input
       label="Email"
       value={author.email}
       disabled
       helperText="Email cannot be changed"
      />

      <Textarea
       label="Bio"
       value={bio}
       onChange={e => setBio(e.target.value)}
       rows={4}
       placeholder="Tell readers about yourself..."
      />

      <Input
       label="Website"
       type="url"
       value={website}
       onChange={e => setWebsite(e.target.value)}
       icon={<Icons.link className="h-4 w-4" />}
       placeholder="https://yourwebsite.com"
      />

      <div>
       <label className="block text-sm font-medium text-foreground mb-2">Social Links</label>
       <div className="grid gap-4 sm:grid-cols-3">
        <Input
         label="X (Twitter)"
         value={x}
         onChange={e => setX(e.target.value)}
         placeholder="@username"
         icon={<Icons.twitter className="h-4 w-4" />}
        />
        <Input
         label="Instagram"
         value={instagram}
         onChange={e => setInstagram(e.target.value)}
         placeholder="@username"
         icon={<Icons.instagram className="h-4 w-4" />}
        />
        <Input
         label="LinkedIn"
         value={linkedin}
         onChange={e => setLinkedin(e.target.value)}
         placeholder="linkedin.com/in/..."
         icon={<Icons.linkedin className="h-4 w-4" />}
        />
       </div>
      </div>
     </CardContent>

     <CardFooter className="px-6 py-4 border-t border-border flex flex-wrap gap-3 justify-between">
      <Button
       type="button"
       variant="ghost"
       onClick={handleLogout}
       icon={<Icons.logout className="h-4 w-4" />}
      >
       Sign Out
      </Button>
      <Button
       type="submit"
       loading={saving}
       icon={<Icons.save className="h-4 w-4" />}
      >
       Save Changes
      </Button>
     </CardFooter>
    </Card>
   </form>
  </motion.div>
 );
}
