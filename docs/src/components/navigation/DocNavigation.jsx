import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/helpers';
import { getAdjacentDocs } from '../../config/docs';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';

export function DocNavigation({ className }) {
  const location = useLocation();
  const { prev, next } = getAdjacentDocs(location.pathname);

  if (!prev && !next) return null;

  return (
    <nav
      className={cn(
        'flex items-center justify-between gap-4 mt-12 pt-8 border-t border-slate-200',
        className
      )}
    >
      {prev ? (
        <Link
          to={prev.route}
          className="group flex items-center gap-3 text-left max-w-[50%]"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-50 transition-colors shrink-0">
            <HiOutlineChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-400 mb-0.5">Previous</div>
            <div className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors truncate">
              {prev.title}
            </div>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          to={next.route}
          className="group flex items-center gap-3 text-right max-w-[50%]"
        >
          <div className="min-w-0">
            <div className="text-xs text-slate-400 mb-0.5">Next</div>
            <div className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors truncate">
              {next.title}
            </div>
          </div>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-50 transition-colors shrink-0">
            <HiOutlineChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
          </div>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}

export default DocNavigation;
