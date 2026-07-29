import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card, { CardTitle } from "../components/ui/Card";
import { Icons } from "../icons";
import toast from "react-hot-toast";

export default function AuthorLoginPage() {
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
      const msg =
        err?.response?.data?.error?.message || "Invalid email or password";
      setError(msg);
    } finally {
      setLoading(false);
    }
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
            {/* Logo & Header */}
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
                  Author Sign In
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Access your author dashboard and manage stories
                </p>
              </motion.div>
            </div>

            {/* Login Form */}
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
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
                className="mt-2"
              >
                Sign In
              </Button>
            </motion.form>

            {/* Footer Navigation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="mt-6 pt-6 border-t border-border/40 text-center"
            >
              <p className="text-xs sm:text-sm text-muted-foreground">
                Not registered as an author?{" "}
                <Link
                  to="/register"
                  className="text-primary font-medium hover:underline transition-colors"
                >
                  Register here
                </Link>
              </p>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}