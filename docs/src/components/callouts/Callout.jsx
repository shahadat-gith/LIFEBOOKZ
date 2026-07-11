import { cn } from '../../utils/helpers';
import { HiOutlineLightBulb, HiOutlineExclamationCircle, HiOutlineXCircle, HiOutlineInformationCircle } from 'react-icons/hi';

const types = {
  info: {
    icon: HiOutlineInformationCircle,
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    iconColor: 'text-blue-500',
  },
  warning: {
    icon: HiOutlineExclamationCircle,
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    iconColor: 'text-amber-500',
  },
  error: {
    icon: HiOutlineXCircle,
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-800',
    iconColor: 'text-red-500',
  },
  tip: {
    icon: HiOutlineLightBulb,
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
    iconColor: 'text-emerald-500',
  },
};

export function Callout({ type = 'info', title, children }) {
  const config = types[type] || types.info;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg border my-6',
        config.bg
      )}
    >
      <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', config.iconColor)} />
      <div className={cn('text-sm leading-relaxed', config.text)}>
        {title && <strong className="block mb-1 text-sm font-semibold">{title}</strong>}
        <div>{children}</div>
      </div>
    </div>
  );
}

export default Callout;
