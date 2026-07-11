import { cn } from '../../utils/helpers';

export function Card({
  children,
  className,
  hover = true,
  padding = true,
  bordered = true,
  ...props
}) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl',
        bordered && 'border border-slate-200',
        hover && 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        padding && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ children, className, ...props }) {
  return (
    <div className={cn('text-slate-600 text-sm leading-relaxed', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn('mt-4 pt-4 border-t border-slate-100', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
