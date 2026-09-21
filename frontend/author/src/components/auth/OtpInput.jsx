import { useRef } from "react";

const LENGTH = 6;

/**
 * Six single-digit boxes for the one-time code.
 *
 * Typing a digit advances, backspace and the arrow keys move between boxes,
 * and pasting a code fills them all — the three things people expect from an
 * OTP field.
 */
export default function OtpInput({ value, onChange }) {
  const refs = useRef([]);

  function focus(index) {
    refs.current[index]?.focus();
  }

  function handleChange(index, raw) {
    // Keep only the last digit if several arrived at once.
    const digit = raw.replace(/\D/g, "").slice(-1);

    const next = [...value];
    next[index] = digit;
    onChange(next);

    if (digit && index < LENGTH - 1) focus(index + 1);
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace") {
      if (!value[index] && index > 0) focus(index - 1);
    } else if (event.key === "ArrowLeft" && index > 0) {
      focus(index - 1);
    } else if (event.key === "ArrowRight" && index < LENGTH - 1) {
      focus(index + 1);
    }
  }

  function handlePaste(event) {
    event.preventDefault();

    const digits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, LENGTH)
      .split("");
    if (digits.length === 0) return;

    const next = [...value];
    digits.forEach((digit, i) => {
      next[i] = digit;
    });
    onChange(next);

    focus(Math.min(digits.length, LENGTH - 1));
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={index === 0 ? handlePaste : undefined}
          autoComplete="one-time-code"
          aria-label={`Digit ${index + 1}`}
          className="h-12 w-11 rounded-lg border border-input bg-background text-center text-lg font-bold text-foreground transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring sm:h-14 sm:w-12"
        />
      ))}
    </div>
  );
}
