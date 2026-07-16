import { type ReactNode } from 'react';
type V = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
interface P { children: ReactNode; variant?: V; className?: string; }
const vc: Record<V, string> = { default: 'bg-muted text-muted-foreground', primary: 'bg-primary/10 text-primary', secondary: 'bg-secondary/10 text-secondary-foreground', success: 'bg-success/10 text-success', warning: 'bg-warning/10 text-warning', danger: 'bg-destructive/10 text-destructive', info: 'bg-info/10 text-info' };
export function Badge({ children, variant = 'default', className = '' }: P) {
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${vc[variant]} ${className}`}>{children}</span>;
}
export default Badge;
