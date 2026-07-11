import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/helpers';
import { getBreadcrumbs } from '../../config/docs';
import { HiOutlineChevronRight, HiOutlineHome } from 'react-icons/hi';

export function Breadcrumb() {
  const location = useLocation();
  const crumbs = getBreadcrumbs(location.pathname);

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.route} className="flex items-center gap-1.5">
              {index === 0 ? (
                <HiOutlineHome className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <HiOutlineChevronRight className="w-3.5 h-3.5 text-slate-300" />
              )}
              {isLast ? (
                <span className="text-slate-600 font-medium">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.route}
                  className="text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
