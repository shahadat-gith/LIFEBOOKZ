const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export function Card({ children, hover = false, padding = 'md', className = '', ...props }) {
  return (
    <div
      className={`bg-card text-card-foreground rounded-xl border border-border shadow-sm ${hover ? 'hover:shadow-md hover:border-muted-foreground/30 transition-all duration-200 cursor-pointer' : ''} ${paddingClasses[padding] || ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`flex items-center justify-between mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-lg font-semibold text-foreground ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }) {
  return <p className={`text-sm text-muted-foreground mt-1 ${className}`}>{children}</p>;
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`flex items-center justify-end gap-3 mt-4 pt-4 border-t border-border ${className}`}>{children}</div>;
}

export default Card;
