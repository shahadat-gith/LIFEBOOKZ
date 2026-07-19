import { Icons } from '../../icons';
import Button from '../ui/Button';

export function EmptyState({
  icon = <Icons.document className="h-12 w-12" />,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="text-muted-foreground/40 mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      )}
      {action && (
        <Button variant="primary" onClick={action.onClick} icon={<Icons.plus className="h-4 w-4" />}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
