export function Card({ children, className = '', padding = 'p-5' }) {
  return (
    <div className={`bg-card rounded-xl border border-border shadow-xs ${padding} ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-lg font-semibold text-foreground ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`flex items-center justify-end gap-3 pt-4 border-t border-border ${className}`}>{children}</div>;
}

export default Card;
