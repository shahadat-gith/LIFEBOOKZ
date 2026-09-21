import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AuthShell from "../../components/auth/AuthShell";
import AuthHeading from "../../components/auth/AuthHeading";
import AuthFooter from "../../components/auth/AuthFooter";
import FormError from "../../components/common/FormError";
import { Icons } from "../../icons";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginUser(email, password);
      toast.success("Welcome back!");
      // ?redirect=<path> — land the user where they were headed
      const redirect = searchParams.get("redirect");
      navigate(redirect && redirect.startsWith("/") ? redirect : "/");
    } catch (err) {
      const msg = err.response?.data?.error?.message;
      setError(msg || "Invalid email address or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <AuthHeading
        title="Welcome back"
        subtitle="Sign in to continue reading and sharing stories."
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

        <FormError message={error} />

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          icon={<Icons.login className="h-4 w-4" />}
          className="mt-2 font-semibold !rounded-xl"
        >
          Sign In
        </Button>
      </form>

      <AuthFooter
        prompt="New to Lifebookz?"
        linkLabel="Create an account"
        to="/register"
      />
    </AuthShell>
  );
}
