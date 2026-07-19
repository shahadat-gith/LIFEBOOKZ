import { forwardRef } from 'react';

const Textarea = forwardRef(function Textarea({ label, className = '', ...props }, ref) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
      <textarea
        ref={ref}
        className={`w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all min-h-[100px] resize-y ${className}`}
        {...props}
      />
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
