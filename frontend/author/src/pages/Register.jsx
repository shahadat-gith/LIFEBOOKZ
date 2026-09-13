import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import { sanitizeUsername } from "../utils/helpers";

import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import AuthShell from "../components/auth/AuthShell";
import { Icons } from "../icons";

/**
 * Lightweight signup: only name, email, password, and username.
 * The full profile (profession, bio, phone, DOB, gender, address) is
 * completed later — it's required before publishing a story.
 */
export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    username: "",
  });
  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = () => {
    const next = {};

    if (!form.fullName?.trim()) next.fullName = "Full name is required.";
    if (!form.email?.trim()) next.email = "Email is required.";
    if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Invalid email address.";
    if ((form.password || "").length < 8)
      next.password = "Password must be at least 8 characters.";

    const clean = sanitizeUsername(form.username || form.fullName || "");
    if (clean.length < 3) {
      next.username = "Username must be at least 3 characters.";
    } else if (!/^[a-z0-9_.-]+$/.test(clean)) {
      next.username = "Use only letters, numbers, dots, hyphens, underscores.";
    }

    setErrors(next);
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) return;

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("fullName", form.fullName.trim());
      fd.append("email", form.email.trim().toLowerCase());
      fd.append("password", form.password);
      fd.append("username", sanitizeUsername(form.username || form.fullName));

      await register(fd);

      toast.success("Welcome to Lifebookz! Let's set up your lifebook.");
      navigate("/");
    } catch (error) {
      toast.error(
        error.response?.data?.error?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="text-center mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Start writing in under a minute — complete your profile later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name *"
          value={form.fullName}
          onChange={(e) => update("fullName", e.target.value)}
          placeholder="Enter your full name"
          required
          icon={<Icons.user className="h-4 w-4" />}
          error={errors.fullName}
        />

        <Input
          label="Email *"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="Enter your email"
          required
          icon={<Icons.mail className="h-4 w-4" />}
          error={errors.email}
        />

        <Input
          label="Password *"
          type="password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          placeholder="Create a password"
          required
          icon={<Icons.lock className="h-4 w-4" />}
          showPasswordToggle
          error={errors.password}
        />

        <Input
          label="Username *"
          value={form.username}
          onChange={(e) => update("username", sanitizeUsername(e.target.value))}
          placeholder="Choose a unique username"
          required
          icon={<Icons.atSymbol className="h-4 w-4" />}
          helperText={
            form.username
              ? `lifebookz.com/authors/${form.username}`
              : "Your public handle — letters, numbers, dots, hyphens."
          }
          error={errors.username}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          className="mt-2 !rounded-xl"
          icon={<Icons.userAdd className="h-4 w-4" />}
        >
          Create Account
        </Button>
      </form>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground/70">
        By creating an account you agree to our Terms of Service and Privacy
        Policy.
      </p>

      <div className="mt-5 pt-6 border-t border-border/40 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary font-semibold hover:underline transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
