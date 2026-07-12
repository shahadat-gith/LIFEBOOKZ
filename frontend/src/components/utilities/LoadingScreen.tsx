import Spinner from '../ui/Spinner';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingScreen({
  message = 'Loading...',
  fullScreen = false,
}: LoadingScreenProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center gap-3
        ${fullScreen ? 'fixed inset-0 bg-background/80 backdrop-blur-sm z-40' : 'py-20'}
      `}
    >
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}
