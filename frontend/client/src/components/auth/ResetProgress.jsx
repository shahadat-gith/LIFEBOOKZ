import { Icons } from "../../icons";

/**
 * The dots-and-lines showing how far the password reset has got:
 * email → OTP → new password.
 */
export default function ResetProgress({ step, total = 3 }) {
  const steps = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      {steps.map((n) => (
        <div key={n} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
              step >= n
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step > n ? <Icons.check className="h-4 w-4" /> : n}
          </div>
          {n < total && (
            <div
              className={`h-0.5 w-10 transition-colors duration-300 ${
                step > n ? "bg-primary" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
