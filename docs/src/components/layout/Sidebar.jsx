import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/helpers';
import { sidebarGroups } from '../../config/navigation';
import { HiOutlineChevronDown } from 'react-icons/hi';
import { HiOutlineHome } from 'react-icons/hi2';

export function Sidebar({ open, onClose }) {
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState(() => {
    // Auto-expand the group of the current page
    const currentRoute = location.pathname;
    const expanded = {};
    sidebarGroups.forEach((group) => {
      const isActive = group.items.some((item) => item.route === currentRoute);
      expanded[group.id] = isActive;
    });
    return expanded;
  });

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const isActive = (route) => {
    if (route === '/') return location.pathname === '/';
    return location.pathname === route;
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-14 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 overflow-y-auto transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="p-4 pb-8">
          {/* Home link */}
          <Link
            to="/"
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm rounded-lg mb-2 transition-colors',
              isActive('/')
                ? 'sidebar-link-active'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            )}
          >
            <HiOutlineHome className="w-4 h-4 shrink-0" />
            <span>Home</span>
          </Link>

          {/* Section groups */}
          {sidebarGroups.map((group) => {
            const isExpanded = expandedGroups[group.id];
            const isGroupActive = group.items.some((item) => isActive(item.route));
            const GroupIcon = group.icon;

            return (
              <div key={group.id} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
                    isGroupActive
                      ? 'text-indigo-600 font-medium'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {GroupIcon && <GroupIcon className="w-4 h-4 shrink-0" />}
                  <span className="flex-1 text-left">{group.label}</span>
                  <HiOutlineChevronDown
                    className={cn(
                      'w-3.5 h-3.5 transition-transform duration-200',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </button>

                <div
                  className={cn(
                    'overflow-hidden transition-all duration-200',
                    isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  <div className="ml-4 mt-0.5 border-l border-slate-200">
                    {group.items.map((item) => {
                      const active = isActive(item.route);
                      const ItemIcon = item.icon;
                      return (
                        <Link
                          key={item.id}
                          to={item.route}
                          onClick={onClose}
                          className={cn(
                            'flex items-center gap-3 px-3 py-1.5 text-sm rounded-r-lg transition-colors ml-2',
                            active
                              ? 'sidebar-link-active'
                              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                          )}
                        >
                          {ItemIcon && <ItemIcon className="w-3.5 h-3.5 shrink-0" />}
                          <span className="truncate">{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
