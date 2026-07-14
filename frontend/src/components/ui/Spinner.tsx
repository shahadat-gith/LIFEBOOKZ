import { Icons } from '../../icons';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

export function Spinner({
  size = 'md',
  className = '',
  label,
}: SpinnerProps) {
  return (
    <div
      className={`flex items-center justify-center gap-2 text-muted-foreground ${className}`}
      role="status"
    >
      <Icons.spinner className={`animate-spin ${sizeClasses[size]}`} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export default Spinner;
