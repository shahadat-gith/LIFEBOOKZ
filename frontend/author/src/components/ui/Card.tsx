import { type ReactNode, type HTMLAttributes } from 'react';
interface P extends HTMLAttributes<HTMLDivElement> { children: ReactNode; hover?: boolean; padding?: 'none' | 'sm' | 'md' | 'lg'; }
const pc = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-7' };
export function Card({ children, hover = false, padding = 'md', className = '', ...props }: P) {
  return <div className={`bg-card text-card-foreground rounded-xl border border-border shadow-xs ${hover ? 'hover:shadow-md hover:border-muted-foreground/30 transition-all duration-200 cursor-pointer' : ''} ${pc[padding]} ${className}`} {...props}>{children}</div>;
}
export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold text-foreground ${className}`}>{children}</h3>;
}
export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex items-center justify-end gap-3 pt-4 border-t border-border ${className}`}>{children}</div>;
}
export default Card;
