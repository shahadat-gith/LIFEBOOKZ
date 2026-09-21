import { useState } from "react";
import toast from "react-hot-toast";

import api from "../../config/api";
import { apiErrorMessage } from "../../utils/helpers";
import Button from "../ui/Button";
import Input from "../ui/Input";
import FormError from "../common/FormError";
import ResetSuccess from "./ResetSuccess";
import { Icons } from "../../icons";

const MIN_LENGTH = 8;

/**
 * Choose a new password, and confirm it.
 *
 * Reached two ways — the OTP flow's final step, and the emailed reset link —
 * and the same in both, so it keeps its own state and reports success itself.
 */
export default function NewPasswordForm({ resetToken }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function change(setter) {
    return (event) => {
      if (error) setError("");
      setter(event.target.value);
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password.length < MIN_LENGTH) {
      setError(`Password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/authors/reset-password", { resetToken, password });
      setDone(true);
      toast.success("Password reset successfully!");
    } catch (err) {
      setError(
        apiErrorMessage(err, "Failed to reset password. Please request a new link."),
      );
    } finally {
      setLoading(false);
    }
  }

  if (done) return <ResetSuccess />;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="New password"
        type="password"
        value={password}
        onChange={change(setPassword)}
        placeholder="Create a new password"
        required
        icon={<Icons.lock className="h-4 w-4" />}
        showPasswordToggle
      />

      <Input
        label="Confirm password"
        type="password"
        value={confirmPassword}
        onChange={change(setConfirmPassword)}
        placeholder="Re-enter your new password"
        required
        icon={<Icons.lock className="h-4 w-4" />}
        showPasswordToggle
      />

      <FormError>{error}</FormError>

      <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">
        Reset Password
      </Button>
    </form>
  );
}
