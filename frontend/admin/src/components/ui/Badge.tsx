import { type ReactNode } from 'react';
interface P { children: ReactNode; variant?: 'success' | 'warning' | 'danger' | 'info' | 'default'; className?: string; }
export function Badge({ children, variant = 'default', className = '' }: P) {
  const v = { default: 'bg-muted text-muted-foreground', success: 'bg-success/10 text-success', warning: 'bg-warning/10 text-warning', danger: 'bg-destructive/10 text-destructive', info: 'bg-info/10 text-info' };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${v[variant]} ${className}`}>{children}</span>;
}
export default Badge;
