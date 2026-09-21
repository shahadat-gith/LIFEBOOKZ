import { useSearchParams } from "react-router-dom";

import AuthShell from "../../components/auth/AuthShell";
import AuthFooter from "../../components/auth/AuthFooter";
import NewPasswordForm from "../../components/auth/NewPasswordForm";
import { Icons } from "../../icons";

/**
 * Set a new password from an emailed reset link (`?token=`).
 *
 * The reset itself is the same form the OTP flow ends on, so this page only
 * has to validate the link and frame it.
 */
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <AuthShell>
        <div className="space-y-4 text-center">
          <Icons.exclamationCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="font-display text-xl font-semibold text-foreground">
            Invalid Reset Link
          </h1>
          <p className="text-sm text-muted-foreground">
            This reset link is invalid or missing a token.
          </p>
          <AuthFooter
            prompt="Need a new link?"
            linkLabel="Request another"
            to="/forgot-password"
          />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="mb-8 text-center">
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
