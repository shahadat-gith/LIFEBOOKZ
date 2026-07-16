import { type ButtonHTMLAttributes, type ReactNode } from 'react';
interface P extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'outline' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; loading?: boolean; icon?: ReactNode; fullWidth?: boolean; }
export function Button({ variant = 'primary', size = 'md', loading, icon, fullWidth, className = '', children, ...p }: P) {
  const vc = { primary: 'bg-primary text-white hover:brightness-110', outline: 'border border-border bg-transparent hover:bg-muted', ghost: 'bg-transparent hover:bg-muted', danger: 'bg-destructive text-white hover:brightness-110' };
  const sc = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  return <button className={`inline-flex items-center justify-center font-medium rounded-lg transition-all disabled:opacity-50 ${vc[variant]} ${sc[size]} ${fullWidth ? 'w-full' : ''} ${className}`} {...p}>{loading ? '...' : icon}{children}</button>;
}
export default Button;
