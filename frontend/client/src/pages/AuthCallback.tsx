import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/login', { replace: true }); }, [navigate]);
  return <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4"><Spinner size="lg" /><p className="text-muted-foreground">Redirecting...</p></div>;
}
