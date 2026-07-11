import { Link } from 'react-router-dom';
import { categories } from '../../config/docs';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-50 no-print">
      <div className="max-w-screen-2xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
                <span className="text-white text-[10px] font-bold font-mono">L</span>
              </div>
              <span className="font-semibold text-slate-900 text-sm">Lifebookz</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              The world's first digital library of human lives. Preserving stories forever.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Documentation</h4>
            <ul className="space-y-2">
              {categories.slice(0, 4).map((cat) => {
                const CatIcon = cat.icon;
                return (
                  <li key={cat.id}>
                    <Link
                      to={`/${cat.id === 'ai' ? 'ai' : cat.id}`}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                      {CatIcon && <CatIcon className="w-3 h-3" />}
                      {cat.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">More</h4>
            <ul className="space-y-2">
              {categories.slice(4).map((cat) => {
                const CatIcon = cat.icon;
                return (
                  <li key={cat.id}>
                    <Link
                      to={`/${cat.id}`}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                      {CatIcon && <CatIcon className="w-3 h-3" />}
                      {cat.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://github.com/lifebookz" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-indigo-600 transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-slate-500 hover:text-indigo-600 transition-colors">
                  Status
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-slate-500 hover:text-indigo-600 transition-colors">
                  Changelog
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-400">
            &copy; {currentYear} Lifebookz. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">
            Crafted with care for engineering excellence.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
