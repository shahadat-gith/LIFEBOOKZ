export function LoadingScreen({ message = 'Loading...' }) {
  return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">{message}</p></div>;
}

export default LoadingScreen;
