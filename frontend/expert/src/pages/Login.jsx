import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import AuthShell from "../components/auth/AuthShell";
import { Icons } from "../icons";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      setError(
        err?.response?.data?.error?.message || "Invalid email or password",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="text-center mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Expert sign in
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Manage your consultations and profile.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          icon={<Icons.mail className="h-4 w-4" />}
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-foreground">
              Password
            </span>
            <Link
              to="/forgot-password"
              className="text-xs text-primary font-medium hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            icon={<Icons.lock className="h-4 w-4" />}
            showPasswordToggle
          />
        </div>

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
          icon={<Icons.login className="h-4 w-4" />}
          className="mt-2 !rounded-xl"
        >
          Sign In
        </Button>
      </form>

      <div className="mt-7 pt-6 border-t border-border/40 text-center">
        <p className="text-sm text-muted-foreground">
          Not registered as an expert?{" "}
          <Link
            to="/register"
            className="text-primary font-semibold hover:underline transition-colors"
          >
            Apply here
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
