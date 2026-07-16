import { Icons } from '../../icons';
interface P { size?: 'sm' | 'md' | 'lg'; label?: string; }
const sc = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };
export function Spinner({ size = 'md', label }: P) {
  return <div className="flex flex-col items-center gap-2"><Icons.spinner className={`animate-spin text-primary ${sc[size]}`} />{label && <p className="text-sm text-muted-foreground">{label}</p>}</div>;
}
export default Spinner;
