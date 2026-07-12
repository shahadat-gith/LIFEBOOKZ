import { useState, type FormEvent } from 'react';
import { useAuth } from '../../../store/AuthContext';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import Avatar from '../../../components/ui/Avatar';
import Card, { CardTitle, CardContent, CardFooter } from '../../../components/ui/Card';
import { Icons } from '../../../icons';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AuthorProfilePage() {
  const { author, updateAuthor, logout } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(author?.fullName || '');
  const [bio, setBio] = useState(author?.bio || '');
  const [website, setWebsite] = useState(author?.website || '');
  const [x, setX] = useState(author?.socialLinks?.x || '');
  const [github, setGithub] = useState(author?.socialLinks?.github || '');
  const [linkedin, setLinkedin] = useState(author?.socialLinks?.linkedin || '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAuthor({
        fullName,
        bio,
        website,
        socialLinks: { x, github, linkedin },
      });
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (!author) {
    navigate('/author/login');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="flex items-center gap-6 mb-10">
        <Avatar src={author.avatar} name={author.fullName} size="xl" className="ring-4 ring-border" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">{author.fullName}</h1>
          <p className="text-sm text-muted-foreground">{author.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardContent className="p-6 space-y-5">
            <CardTitle>Edit Author Profile</CardTitle>
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              icon={<Icons.user className="h-4 w-4" />}
            />
            <Input
              label="Email"
              value={author.email}
              disabled
              helperText="Email cannot be changed"
            />
            <Textarea
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell readers about yourself..."
              rows={4}
            />
            <Input
              label="Website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourwebsite.com"
              icon={<Icons.link className="h-4 w-4" />}
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="X (Twitter)"
                value={x}
                onChange={(e) => setX(e.target.value)}
                placeholder="@username"
                icon={<Icons.twitter className="h-4 w-4" />}
              />
              <Input
                label="GitHub"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="username"
                icon={<Icons.github className="h-4 w-4" />}
              />
              <Input
                label="LinkedIn"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="URL or username"
                icon={<Icons.linkedin className="h-4 w-4" />}
              />
            </div>
          </CardContent>
          <CardFooter className="px-6 py-4">
            <Button type="submit" loading={saving} icon={<Icons.save className="h-4 w-4" />}>
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Logout */}
      <Card hover padding="md" onClick={() => { logout(); navigate('/'); toast.success('Logged out'); }}>
        <div className="flex items-center gap-3 text-destructive">
          <Icons.logout className="h-5 w-5" />
          <span className="font-medium">Log Out</span>
        </div>
      </Card>
    </div>
  );
}
