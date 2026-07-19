import { useState, forwardRef } from "react";

export const Input = forwardRef(function Input(
  {
    label,
    error,
    icon,
    helperText,
    className = "",
    id,
    showPasswordToggle,
    ...props
  },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = props.type === "password";
  const inputType = isPassword && showPassword ? "text" : props.type;
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  const baseClasses =
    "block w-full rounded-lg border bg-card text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted py-2 text-sm";
  const paddingClasses = `${icon ? "pl-10" : "pl-3"} ${showPasswordToggle ? "pr-10" : "pr-3"}`;
  const stateClasses = error
    ? "border-destructive focus:ring-destructive"
    : "border-input hover:border-muted-foreground/50";

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
            {icon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={inputType}
          className={`${baseClasses} ${paddingClasses} ${stateClasses} ${className}`}
          aria-invalid={!!error}
          {...props}
        />

        {isPassword && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex="-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        )}
      </div>

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        helperText && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )
      )}
    </div>
  );
});

export default Input;
