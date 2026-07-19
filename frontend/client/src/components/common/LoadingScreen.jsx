import Spinner from '../ui/Spinner';

export function LoadingScreen({ message = 'Loading...', fullScreen = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullScreen ? 'fixed inset-0 bg-background/80 backdrop-blur-sm z-40' : 'py-20'
      }`}
    >
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}

export default LoadingScreen;
