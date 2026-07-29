import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../config/api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card, { CardTitle } from "../components/ui/Card";
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
      await api.post("/authors/reset-password", { token, password });
      setSuccess(true);
      toast.success("Password reset successfully!");
    } catch (err) {
      const msg = err.response?.data?.error?.message;
      setError(msg || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  // Handle missing/invalid link state
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-background text-foreground">
        <Card className="p-8 border border-border/60 bg-card shadow-sm rounded-2xl max-w-md w-full text-center space-y-4">
          <Icons.exclamationCircle className="h-12 w-12 text-destructive mx-auto" />
          <CardTitle className="text-xl">Invalid Reset Link</CardTitle>
          <p className="text-sm text-muted-foreground">
            This reset link is invalid or missing a token.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block text-sm text-primary font-medium hover:underline"
          >
            Request a new reset link
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-background text-foreground">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 border border-border/60 bg-card shadow-sm rounded-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex justify-center mb-4"
              >
                <div className="w-14 h-14 rounded-xl border border-border/80 bg-muted/30 flex items-center justify-center p-2.5 shadow-xs">
                  <img
                    src="/logo.png"
                    alt="Lifebookz Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <CardTitle className="text-2xl font-semibold font-display tracking-tight">
                  Set new password
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Enter your new password below.
                </p>
              </motion.div>
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
                  <CardTitle className="text-xl">Password reset!</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Your password has been successfully updated.
                  </p>
                </div>
                <Button
                  type="button"
                  fullWidth
                  size="lg"
                  onClick={() => navigate("/login")}
                  className="mt-2"
                >
                  Sign in with new password
                </Button>
              </motion.div>
            ) : (
              <motion.form
                onSubmit={handleSubmit}
                className="space-y-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Input
                  label="New password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    if (error) setError("");
                    setPassword(e.target.value);
                  }}
                  placeholder="Min. 8 characters"
                  required
                  icon={<Icons.lock className="h-4 w-4" />}
                  showPasswordToggle
                />
                <Input
                  label="Confirm password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    if (error) setError("");
                    setConfirmPassword(e.target.value);
                  }}
                  placeholder="Re-enter new password"
                  required
                  icon={<Icons.lock className="h-4 w-4" />}
                  showPasswordToggle
                />

                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs text-destructive flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
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
                  className="mt-2"
                >
                  Reset Password
                </Button>
              </motion.form>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="mt-6 pt-6 border-t border-border/40 text-center"
            >
              <p className="text-xs sm:text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link
                  to="/login"
                  className="text-primary font-medium hover:underline transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}