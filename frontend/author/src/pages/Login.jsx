import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import AuthShell from "../components/auth/AuthShell";
import { Icons } from "../icons";
import toast from "react-hot-toast";

export default function AuthorLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Two-step sign-in: when the author enabled it, the password only gets us
  // to a challenge, and the emailed code finishes the sign-in.
  const [challenge, setChallenge] = useState(null);
  const [otp, setOtp] = useState("");
  const { login, completeTwoStepLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ?redirect=<path> — land the author where they were headed
  function finishSignIn() {
    toast.success("Welcome back!");
    const redirect = searchParams.get("redirect");
    navigate(redirect && redirect.startsWith("/") ? redirect : "/");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login({ email, password });

      if (result?.twoStepRequired) {
        setChallenge(result);
        toast.success("We emailed you a sign-in code.");
        return;
      }

      finishSignIn();
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message || "Invalid email or password";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await completeTwoStepLogin({
        challengeId: challenge.challengeId,
        otp: otp.trim(),
      });
      finishSignIn();
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message || "That code didn't work";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="text-center mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          {challenge ? "Enter your code" : "Welcome back"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {challenge
            ? `We emailed a 6-digit code to ${challenge.email || "your address"}.`
            : "Sign in to continue writing your Lifebook."}
        </p>
      </div>

      {challenge ? (
      <form onSubmit={handleVerify} className="space-y-5">
        <Input
          label="Sign-in code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          placeholder="Enter the 6-digit code"
          required
          icon={<Icons.lock className="h-4 w-4" />}
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
          icon={<Icons.login className="h-4 w-4" />}
          className="mt-2 !rounded-xl"
        >
          Verify &amp; Sign In
        </Button>

        <button
          type="button"
          onClick={() => {
            setChallenge(null);
            setOtp("");
            setError("");
          }}
          className="w-full text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Use a different account
        </button>
      </form>
      ) : (
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
            <span className="text-sm font-medium text-foreground">Password</span>
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
      )}

      {!challenge && (
      <div className="mt-7 pt-6 border-t border-border/40 text-center">
        <p className="text-sm text-muted-foreground">
          New to Lifebookz?{" "}
          <Link
            to="/register"
            className="text-primary font-semibold hover:underline transition-colors"
          >
            Create your account
          </Link>
        </p>
      </div>
      )}
    </AuthShell>
  );
}
