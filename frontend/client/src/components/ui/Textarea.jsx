import { forwardRef } from 'react';

export const Textarea = forwardRef(function Textarea(
  { label, error, className = '', id, ...props },
  ref
) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={`
          block w-full rounded-lg border bg-card text-foreground placeholder:text-muted-foreground
          transition-all duration-200 resize-y min-h-[100px]
          focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted
          px-3 py-2 text-sm
          ${error ? 'border-destructive focus:ring-destructive' : 'border-input hover:border-muted-foreground/50'}
          ${className}
        `}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
});

export default Textarea;
