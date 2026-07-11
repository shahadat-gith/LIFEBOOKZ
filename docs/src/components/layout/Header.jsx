import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/helpers';
import { HiOutlineMagnifyingGlass, HiOutlineXMark, HiArrowTopRightOnSquare } from 'react-icons/hi2';
import { HiOutlineMenu } from 'react-icons/hi';
import { FaGithub } from 'react-icons/fa';
import { docs } from '../../config/docs';

export function Header({ onMenuToggle }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    const q = query.toLowerCase();
    const results = docs
      .filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          doc.description.toLowerCase().includes(q)
      )
      .slice(0, 8);
    setSearchResults(results);
  };

  const handleSelect = (route) => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    navigate(route);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 no-print">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6 max-w-screen-2xl mx-auto">
        {/* Left: Logo & Mobile Menu */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            <HiOutlineMenu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <img src="/logo.png" alt="Lifebookz Logo" className="w-5 h-5 rounded-full" />
            </div>
            <span className="font-semibold text-slate-900 text-base hidden sm:block">
              Lifebookz
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:block">Docs</span>
          </Link>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md mx-4">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 hover:text-slate-500 transition-colors"
          >
            <HiOutlineMagnifyingGlass className="w-4 h-4" />
            <span>Search docs...</span>
            <kbd className="ml-auto hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-slate-400 bg-white border border-slate-200 rounded font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: GitHub & Version */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/lifebookz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="GitHub"
          >
            <FaGithub className="w-5 h-5" />
          </a>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-medium text-slate-500 bg-slate-100 rounded-full">
            v1.0.0
          </span>
        </div>
      </div>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery('');
              setSearchResults([]);
            }}
          />
          <div className="fixed inset-x-0 top-0 mx-auto mt-14 max-w-lg px-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-3 px-4 border-b border-slate-200">
                <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="flex-1 py-3 text-sm text-slate-900 placeholder-slate-400 bg-transparent border-0 outline-none focus:outline-none"
                />
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  <HiOutlineXMark className="w-4 h-4" />
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="max-h-64 overflow-y-auto p-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result.route)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 text-left transition-colors"
                    >
                      <result.icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{result.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{result.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="p-6 text-center text-sm text-slate-400">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
