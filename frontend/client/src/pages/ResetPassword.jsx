import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../config/axios";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { Icons } from "../icons";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/users/reset-password", { token, password });
      setSuccess(true);
      toast.success("Password reset successfully!");
    } catch (err) {
      const msg = err.response?.data?.error?.message;
      setError(msg || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
        <div className="text-center space-y-4">
          <Icons.exclamationCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Invalid Reset Link</h2>
          <p className="text-sm text-muted-foreground">
            This reset link is invalid or missing a token.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block text-sm text-primary font-medium hover:underline"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-3xl border border-border/80 bg-card shadow-xl overflow-hidden">
            <div className="p-8 sm:p-10">
              <div className="flex items-center gap-2 mb-8">
                <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
                <span className="font-bold text-lg text-foreground">LifeBookz</span>
              </div>

              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Icons.checkCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      Password reset!
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Your password has been successfully updated.
                    </p>
                  </div>
                  <Button
                    type="button"
                    fullWidth
                    size="lg"
                    onClick={() => navigate("/login")}
                    className="font-semibold"
                  >
                    Sign in with new password
                  </Button>
                </motion.div>
              ) : (
                <>
                  <div className="mb-8">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                    >
                      <Icons.arrowLeft className="h-4 w-4" />
                      Back to sign in
                    </Link>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      Set new password
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1.5">
                      Enter your new password below.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                      label="New password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      icon={<Icons.lock className="h-4 w-4" />}
                      showPasswordToggle
                    />
                    <Input
                      label="Confirm password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      icon={<Icons.lock className="h-4 w-4" />}
                      showPasswordToggle
                    />

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-destructive flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20"
                      >
                        <Icons.exclamationCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      loading={loading}
                      className="font-semibold"
                    >
                      Reset Password
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
