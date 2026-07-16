import { useState } from 'react';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function stringToColor(name?: string): string {
  if (!name) return '#6366f1';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 55%)`;
}

export function Avatar({
  src,
  alt = '',
  name,
  size = 'md',
  className = '',
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`
        rounded-full flex items-center justify-center font-semibold text-white
        ${sizeClasses[size]} ${className}
      `}
      style={{ backgroundColor: stringToColor(name) }}
      title={name || alt}
    >
      {getInitials(name)}
    </div>
  );
}

export default Avatar;
