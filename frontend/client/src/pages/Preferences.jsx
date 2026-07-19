import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Icons } from '../icons';
import toast from 'react-hot-toast';

export default function PreferencesPage() {
 const { user, updateUser } = useAuth();
 const [interests, setInterests] = useState((user?.interests || []).join(', '));
 const [saving, setSaving] = useState(false);

 async function handleSubmit(e) {
  e.preventDefault(); setSaving(true);
  try {
   await updateUser({ interests: interests.split(',').map(s => s.trim()).filter(Boolean) });
   toast.success('Preferences saved');
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
     <div><Input label="Interests (comma-separated)" value={interests} onChange={e => setInterests(e.target.value)} placeholder="e.g., Cricket, Technology, Poetry" icon={<Icons.star className="h-4 w-4" />} />{interestList.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{interestList.map(i => <Badge key={i} variant="primary">{i}</Badge>)}</div>}</div>
    </CardContent>
    <CardFooter className="px-6 py-4"><Button type="submit" loading={saving} icon={<Icons.save className="h-4 w-4" />}>Save Preferences</Button></CardFooter>
   </Card>
  </form>
 </div>;
}
