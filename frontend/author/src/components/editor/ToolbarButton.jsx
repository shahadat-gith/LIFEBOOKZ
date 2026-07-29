export default function ToolbarButton({ onClick, active, children, label, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      disabled={disabled}
      className={`p-2 rounded-lg text-sm transition-all duration-150 ${
        active
          ? "bg-primary/15 text-primary shadow-xs"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}