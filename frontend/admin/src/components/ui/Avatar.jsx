import { useState } from 'react';

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

function initials(n) {
  if (!n) return '?';
  return n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2);
}

function color(n) {
  if (!n) return '#6366f1';
  let h = 0;
  for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
  return `hsl(${Math.abs(h % 360)}, 65%, 55%)`;
}

export default function Avatar({ src, name, size = 'md', className = '' }) {
  const [err, setErr] = useState(false);
  if (src && !err) {
    return <img src={src} alt={name || 'Avatar'} className={`rounded-full object-cover ${sizeClasses[size]} ${className}`} onError={() => setErr(true)} />;
  }
  return (
    <div className={`rounded-full flex items-center justify-center font-semibold text-white ${sizeClasses[size]} ${className}`} style={{ background: color(name) }}>
      {initials(name)}
    </div>
  );
}
