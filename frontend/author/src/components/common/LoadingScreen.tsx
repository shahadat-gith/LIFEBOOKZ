import Spinner from '../ui/Spinner';
interface P { message?: string; }
export function LoadingScreen({ message = 'Loading...' }: P) {
  return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" label={message} /></div>;
}
export default LoadingScreen;
