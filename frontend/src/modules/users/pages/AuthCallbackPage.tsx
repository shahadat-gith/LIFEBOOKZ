import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../store/AuthContext';
import Spinner from '../../../components/ui/Spinner';
import { Icons } from '../../../icons';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshTokenParam = searchParams.get('refresh_token');

    if (token && refreshTokenParam) {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshTokenParam);
      refreshUser()
        .then(() => navigate('/', { replace: true }))
        .catch(() => setError('Failed to authenticate'));
    } else {
      setError('Invalid authentication response');
    }
  }, [searchParams, navigate, refreshUser]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-destructive">
          <Icons.exclamationCircle className="h-12 w-12" />
        </div>
        <p className="text-foreground font-medium">Authentication failed</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => navigate('/login')}
          className="text-primary hover:underline text-sm"
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Spinner size="lg" />
      <p className="text-muted-foreground">Completing authentication...</p>
    </div>
  );
}
