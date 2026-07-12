import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../../icons';

interface SearchBarProps {
  initialQuery?: string;
  large?: boolean;
  className?: string;
}

export default function SearchBar({
  initialQuery = '',
  large = false,
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Icons.search
        className={`absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground ${
          large ? 'h-5 w-5' : 'h-4 w-4'
        }`}
      />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search stories..."
        className={`
          w-full rounded-full border border-input bg-card text-foreground
          placeholder:text-muted-foreground
          focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
          transition-all duration-200
          ${large ? 'pl-12 pr-6 py-4 text-lg' : 'pl-10 pr-4 py-2 text-sm'}
          ${className}
        `}
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <Icons.close className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
