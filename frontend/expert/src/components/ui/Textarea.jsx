export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
      <textarea className={`w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 resize-y min-h-[80px] ${error ? 'border-destructive' : ''} ${className}`} {...props}></textarea>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
export default Textarea;
