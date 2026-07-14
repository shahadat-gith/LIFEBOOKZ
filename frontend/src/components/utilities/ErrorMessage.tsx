import { Icons } from '../../icons';
import Button from '../ui/Button';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export function ErrorMessage({
  message = 'Something went wrong',
  onRetry,
  fullScreen = false,
}: ErrorMessageProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center gap-4 text-center
        ${fullScreen ? 'fixed inset-0 bg-background z-40' : 'py-16'}
      `}
    >
      <div className="text-destructive/80">
        <Icons.exclamationCircle className="h-12 w-12" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">Error</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          icon={<Icons.refresh className="h-4 w-4" />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}

export default ErrorMessage;
