import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { Icons } from "../icons";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginUser(email, password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.error?.message;
      setError(msg || "Invalid email address or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-3xl border border-border/80 bg-card shadow-xl overflow-hidden">
        {/* Left Side: Brand Panel */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-muted/30 border-r border-border/60 relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
              <span className="font-bold text-xl tracking-tight text-foreground">
                Stories
              </span>
            </div>
            
            <div className="pt-12 space-y-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground leading-tight">
                Welcome back to your workspace.
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Log in to access your published stories, track performance analytics, and connect with your audience.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-border/40 text-xs text-muted-foreground relative z-10">
            &copy; {new Date().getFullYear()} Stories Inc. All rights reserved.
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          {/* Mobile Logo View */}
          <div className="flex md:hidden items-center gap-2 mb-8">
            <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
            <span className="font-bold text-lg text-foreground">Stories</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Sign in
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
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
                placeholder="Your password"
                required
                icon={<Icons.lock className="h-4 w-4" />}
                showPasswordToggle
              />
            </div>

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
              className="mt-2 font-semibold"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="text-primary font-semibold hover:underline underline-offset-4"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}