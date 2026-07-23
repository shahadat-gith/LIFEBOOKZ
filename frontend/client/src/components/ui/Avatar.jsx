const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-lg",
};

export function Avatar({ src, alt, name, size = "md", className = "" }) {
  return (
    <div
      className={`relative shrink-0 rounded-full border border-border/60 bg-muted/40 overflow-hidden select-none flex items-center justify-center ${sizeClasses[size]} ${className}`}
    >
      <img
        src={src?.trim() || "/user.png"}
        alt={alt || name || "User Avatar"}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export default Avatar;