import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Icons } from '../icons';
import toast from 'react-hot-toast';
import { userApi } from '../api/user';

export default function PreferencesPage() {
  const { refreshUser } = useAuth();
  const [interests, setInterests] = useState('');
  const [profession, setProfession] = useState('');
  const [languages, setLanguages] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      await userApi.updatePreferences({
        interests: interests.split(',').map(s => s.trim()).filter(Boolean),
        profession, languages: languages.split(',').map(s => s.trim()).filter(Boolean),
        location: { country, city },
      });
      await refreshUser(); toast.success('Preferences saved');
    } catch { toast.error('Failed to save preferences'); }
    finally { setSaving(false); }
  }

  const interestList = interests.split(',').map(s => s.trim()).filter(Boolean);

  return <div className="max-w-2xl mx-auto py-10 px-4">
    <div className="mb-8"><h1 className="text-2xl font-bold">Preferences</h1><p className="text-sm text-muted-foreground mt-1">Help us personalize your experience</p></div>
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <CardContent className="p-6 space-y-5">
          <CardTitle>Personalization</CardTitle>
          <Input label="Profession" value={profession} onChange={e => setProfession(e.target.value)} placeholder="e.g., Software Engineer, Teacher, Doctor" icon={<Icons.briefcase className="h-4 w-4" />} />
          <div><Input label="Interests (comma-separated)" value={interests} onChange={e => setInterests(e.target.value)} placeholder="e.g., Cricket, Technology, Poetry" icon={<Icons.star className="h-4 w-4" />} />{interestList.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{interestList.map(i => <Badge key={i} variant="primary">{i}</Badge>)}</div>}</div>
          <Input label="Languages (comma-separated)" value={languages} onChange={e => setLanguages(e.target.value)} placeholder="e.g., hi, en, ta" icon={<Icons.translate className="h-4 w-4" />} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Country" value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g., India" icon={<Icons.globe className="h-4 w-4" />} />
            <Input label="City" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g., Mumbai" icon={<Icons.location className="h-4 w-4" />} />
          </div>
        </CardContent>
        <CardFooter className="px-6 py-4"><Button type="submit" loading={saving} icon={<Icons.save className="h-4 w-4" />}>Save Preferences</Button></CardFooter>
      </Card>
    </form>
  </div>;
}
