import type { ReactNode } from 'react';
import Button from '../ui/Button';
interface P { icon?: ReactNode; title: string; description?: string; action?: { label: string; onClick: () => void; }; }
export function EmptyState({ icon, title, description, action }: P) {
  return <div className="flex flex-col items-center justify-center py-16 text-center">{icon && <div className="mb-4 text-muted-foreground/40">{icon}</div>}<h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>{description && <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>}{action && <Button onClick={action.onClick}>{action.label}</Button>}</div>;
}
export default EmptyState;
