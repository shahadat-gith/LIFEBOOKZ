import { Icons } from '../../icons';

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export default function Spinner({ size = 'md', label, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Icons.spinner className={`animate-spin text-accent ${sizeClasses[size]}`} />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}
