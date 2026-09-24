import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import { apiError } from "../utils/helpers";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import AuthShell from "../components/auth/AuthShell";
import FormError from "../components/common/FormError";
import { Icons } from "../icons";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Which input the API rejected — "wrong email" vs "wrong password" — so the
  // offending field is marked, not just the form.
  const [fieldErrors, setFieldErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);
    try {
      await login({ email, password });
      toast.success("Welcome back!");
      // ?redirect=<path> — land the expert where they were headed
      const redirect = searchParams.get("redirect");
      navigate(
        redirect && redirect.startsWith("/") ? redirect : "/dashboard",
      );
    } catch (err) {
      const { message, fields } = apiError(
        err,
        "Could not sign you in. Please try again.",
      );
      setError(message);
      setFieldErrors(fields);
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
          invalid={Boolean(fieldErrors.email)}
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
            invalid={Boolean(fieldErrors.password)}
            icon={<Icons.lock className="h-4 w-4" />}
            showPasswordToggle
          />
        </div>

        <FormError>{error}</FormError>

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
