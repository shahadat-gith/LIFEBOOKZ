const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
  xl: "w-20 h-20",
};

export function Avatar({ src, alt, name, size = "md" }) {
  return (
    <div className={`relative shrink-0 p-2 rounded-full border border-border/60 bg-muted/40 overflow-hidden select-none flex items-center justify-center ${sizeClasses[size]}`}>
      <img
        src={src?.trim() || "/user.png"}
        alt={alt || name || "User Avatar"}
        className="h-4 w-4 object-cover rounded-full"
      />
    </div>
  );
}

export default Avatar;
