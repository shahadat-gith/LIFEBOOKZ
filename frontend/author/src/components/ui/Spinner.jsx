import { Icons } from '../../icons';

const sizeClasses = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };

export function Spinner({ size = 'md', label } = {}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Icons.spinner className={`animate-spin text-primary ${sizeClasses[size]}`} />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}

export default Spinner;
