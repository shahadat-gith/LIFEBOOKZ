import { useState, type FormEvent } from 'react';
import { useAuth } from '../../../store/AuthContext';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Avatar from '../../../components/ui/Avatar';
import Card, { CardTitle, CardContent, CardFooter } from '../../../components/ui/Card';
import { Icons } from '../../../icons';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUser({ name });
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {/* Profile Header */}
      <div className="flex items-center gap-6 mb-10">
        <Avatar src={user.avatar} name={user.name} size="xl" className="ring-4 ring-border" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Member since {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Edit Profile */}
      <Card className="mb-6">
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6">
            <CardTitle className="mb-4">Edit Profile</CardTitle>
            <div className="space-y-4">
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Email"
                value={user.email}
                disabled
                helperText="Email cannot be changed"
              />
            </div>
          </CardContent>
          <CardFooter className="px-6 py-4">
            <Button type="submit" loading={saving} icon={<Icons.save className="h-4 w-4" />}>
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Preferences Link */}
      <Card hover padding="md" onClick={() => navigate('/preferences')} className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icons.settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Preferences</p>
              <p className="text-sm text-muted-foreground">
                Interests, skills, languages & more
              </p>
            </div>
          </div>
          <Icons.chevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Card>

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
