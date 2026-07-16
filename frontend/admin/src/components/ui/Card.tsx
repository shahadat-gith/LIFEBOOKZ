import { type ReactNode } from 'react';
interface P { children: ReactNode; className?: string; padding?: string; }
export function Card({ children, className = '', padding = 'p-5' }: P) {
  return <div className={`bg-card rounded-xl border border-border shadow-xs ${padding} ${className}`}>{children}</div>;
}
export default Card;
