import { forwardRef } from 'react';

export const Input = forwardRef(function Input({ label, error, icon, helperText, showPasswordToggle, className = '', ...props }, ref) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">{icon}</div>}
        <input
          ref={ref}
          className={`w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 ${icon ? 'pl-10' : ''} ${error ? 'border-destructive focus:ring-destructive' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-destructive flex items-center gap-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
