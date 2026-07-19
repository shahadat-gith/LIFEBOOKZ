const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-3',
};

export default function Spinner({ size = 'md', label, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`animate-spin rounded-full border-primary/30 border-t-primary ${sizeClasses[size]}`} />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}
