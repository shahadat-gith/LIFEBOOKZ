import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import { apiErrorMessage } from "../../utils/helpers";
import AuthShell from "../../components/auth/AuthShell";
import AuthFooter from "../../components/auth/AuthFooter";
import AuthHeading from "../../components/auth/AuthHeading";
import FormError from "../../components/common/FormError";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { Icons } from "../../icons";

/** Sign in. `?redirect=<path>` lands the author where they were headed. */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email, password });
      toast.success("Welcome back!");

      const redirect = searchParams.get("redirect");
      navigate(redirect && redirect.startsWith("/") ? redirect : "/");
    } catch (err) {
      setError(apiErrorMessage(err, "Invalid email or password"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <AuthHeading
        title="Welcome back"
        subtitle="Sign in to continue writing your Lifebook."
      />

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
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Password</span>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
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

      <AuthFooter prompt="New to Lifebookz?" linkLabel="Create your account" to="/register" />
    </AuthShell>
  );
}
