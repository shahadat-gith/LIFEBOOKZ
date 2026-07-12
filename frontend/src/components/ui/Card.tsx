import { type ReactNode, type HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

interface CardSectionProps {
  children: ReactNode;
  className?: string;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export default function Card({
  children,
  hover = false,
  padding = 'md',
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        bg-card text-card-foreground rounded-xl border border-border shadow-xs
        ${hover ? 'hover:shadow-md hover:border-muted-foreground/30 transition-all duration-200 cursor-pointer' : ''}
        ${paddingClasses[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardSectionProps) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: CardSectionProps) {
  return (
    <h3 className={`text-lg font-semibold text-foreground ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }: CardSectionProps) {
  return (
    <p className={`text-sm text-muted-foreground mt-1 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }: CardSectionProps) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }: CardSectionProps) {
  return (
    <div className={`flex items-center justify-end gap-3 mt-4 pt-4 border-t border-border ${className}`}>
      {children}
    </div>
  );
}
