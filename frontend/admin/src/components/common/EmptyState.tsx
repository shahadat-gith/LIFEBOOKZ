import type { ReactNode } from 'react';
interface P { icon?: ReactNode; title: string; description?: string; action?: { label: string; onClick: () => void }; }
export default function EmptyState({ icon, title, description, action }: P) {
  return <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {icon && <div className="text-muted-foreground/40 mb-4">{icon}</div>}
    <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
    {description && <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>}
    {action && <button onClick={action.onClick} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all">{action.label}</button>}
  </div>;
}
