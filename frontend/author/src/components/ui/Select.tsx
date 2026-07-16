import { type SelectHTMLAttributes } from 'react';
interface P extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; options: { value: string; label: string; }[]; placeholder?: string; }
export function Select({ label, options, placeholder, className = '', ...props }: P) {
  return <div className="space-y-1.5">{label && <label className="block text-sm font-medium text-foreground">{label}</label>}<select className={`w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 ${className}`} {...props}><option value="" disabled>{placeholder || 'Select...'}</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>;
}
export default Select;
