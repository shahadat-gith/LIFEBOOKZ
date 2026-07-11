import { cn } from '../../utils/helpers';

export function StatCard({ label, value, description, icon: Icon, trend, className }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 p-5',
        'transition-all duration-200 hover:shadow-sm',
        className
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm text-slate-500 font-medium">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium',
              trend > 0 ? 'text-emerald-600' : 'text-red-600'
            )}
          >
            {trend > 0 ? '+' : ''}
            {trend}%
          </span>
        )}
      </div>
      {description && (
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      )}
    </div>
  );
}

export default StatCard;
