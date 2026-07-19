import Spinner from '../ui/Spinner';
export function LoadingScreen({ message = 'Loading...' }) {
  return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" label={message} /></div>;
}
export default LoadingScreen;
