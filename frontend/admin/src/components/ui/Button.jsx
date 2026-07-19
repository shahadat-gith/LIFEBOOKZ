const variantClasses = {
  primary: 'bg-primary text-white hover:brightness-110',
  outline: 'border border-border bg-transparent hover:bg-muted',
  ghost: 'bg-transparent hover:bg-muted',
  danger: 'bg-destructive text-white hover:brightness-110',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({ variant = 'primary', size = 'md', loading, icon, fullWidth, className = '', children, ...p }) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...p}
    >
      {loading ? '...' : icon}{children}
    </button>
  );
}

export default Button;
