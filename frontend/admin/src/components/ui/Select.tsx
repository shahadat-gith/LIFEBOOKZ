import { type SelectHTMLAttributes, type ReactNode } from 'react';
interface P extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; options: { value: string; label: string; }[]; icon?: ReactNode; }
export default function Select({ label, options, icon, className = '', ...props }: P) {
  return <div className="space-y-1.5">
    {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>}
      <select className={`w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all appearance-none ${icon ? 'pl-10' : ''} ${className}`} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
      </div>
    </div>
  </div>;
}
