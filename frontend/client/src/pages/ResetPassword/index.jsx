import { Link, useSearchParams } from "react-router-dom";

import AuthShell from "../../components/auth/AuthShell";
import AuthFooter from "../../components/auth/AuthFooter";
import NewPasswordForm from "../../components/auth/NewPasswordForm";
import ErrorState from "../../components/common/ErrorState";

/**
 * Reset password from an emailed link — the same form the OTP flow ends with,
 * reached straight from the token in the URL.
 */
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <AuthShell>
        <ErrorState
          title="Invalid reset link"
          message="This reset link is invalid or missing a token."
        />
        <div className="mt-2 text-center">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            Request a new reset link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="mb-8">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Back to sign in
        </Link>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Set new password
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter your new password below.
        </p>
      </div>

      <NewPasswordForm resetToken={token} />

      <AuthFooter prompt="Remember your password?" />
    </AuthShell>
  );
}
