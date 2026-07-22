import { forwardRef } from 'react';

const Textarea = forwardRef(function Textarea({ label, error, className = '', ...props }, ref) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
      <textarea
        ref={ref}
        className={`w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all min-h-[100px] resize-y ${error ? 'border-destructive' : 'hover:border-muted-foreground/30'} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
