import { cn } from '../../utils/helpers';

const variants = {
  default: 'bg-slate-100 text-slate-700',
  primary: 'bg-indigo-100 text-indigo-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
};

const sizes = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-sm',
  lg: 'px-3 py-1.5 text-sm',
};

export function Badge({ children, variant = 'default', size = 'sm', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

export function MethodBadge({ method }) {
  const colorMap = {
    GET: 'bg-emerald-100 text-emerald-700',
    POST: 'bg-blue-100 text-blue-700',
    PUT: 'bg-amber-100 text-amber-700',
    PATCH: 'bg-orange-100 text-orange-700',
    DELETE: 'bg-red-100 text-red-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono uppercase tracking-wider',
        colorMap[method] || 'bg-slate-100 text-slate-700'
      )}
    >
      {method}
    </span>
  );
}

export default Badge;
