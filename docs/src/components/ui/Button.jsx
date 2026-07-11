import { cn } from '../../utils/helpers';

const variants = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500 shadow-sm',
  secondary:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:ring-indigo-500',
  ghost:
    'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-500',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  icon: Icon,
  iconPosition = 'left',
  disabled,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
    </button>
  );
}

export default Button;
