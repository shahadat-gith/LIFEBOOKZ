import { Link } from 'react-router-dom';
import { cn } from '../../utils/helpers';

export function FeatureCard({ title, description, icon: Icon, route, color = 'indigo' }) {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      ring: 'ring-indigo-200',
      hover: 'hover:ring-indigo-300',
    },
    fuchsia: {
      bg: 'bg-fuchsia-50',
      text: 'text-fuchsia-600',
      ring: 'ring-fuchsia-200',
      hover: 'hover:ring-fuchsia-300',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      ring: 'ring-emerald-200',
      hover: 'hover:ring-emerald-300',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      ring: 'ring-amber-200',
      hover: 'hover:ring-amber-300',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      ring: 'ring-blue-200',
      hover: 'hover:ring-blue-300',
    },
    slate: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      ring: 'ring-slate-200',
      hover: 'hover:ring-slate-300',
    },
  };

  const colors = colorMap[color] || colorMap.indigo;

  return (
    <Link
      to={route}
      className={cn(
        'group block p-5 bg-white rounded-xl border border-slate-200',
        'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        'ring-1 ring-transparent',
        colors.hover
      )}
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <div className={cn('p-2.5 rounded-lg shrink-0', colors.bg)}>
            <Icon className={cn('w-5 h-5', colors.text)} />
          </div>
        )}
        <div className="min-w-0">
          <h3 className={cn('font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors')}>
            {title}
          </h3>
          <p className="mt-1 text-sm text-slate-500 line-clamp-2">{description}</p>
        </div>
      </div>
    </Link>
  );
}

export default FeatureCard;
