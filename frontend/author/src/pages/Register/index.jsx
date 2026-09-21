import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import { apiErrorMessage, sanitizeUsername } from "../../utils/helpers";
import AuthShell from "../../components/auth/AuthShell";
import AuthFooter from "../../components/auth/AuthFooter";
import AuthHeading from "../../components/auth/AuthHeading";
import FormError from "../../components/common/FormError";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { Icons } from "../../icons";

const MIN_PASSWORD = 8;
const MIN_USERNAME = 3;
const EMAIL_RE = /\S+@\S+\.\S+/;
const USERNAME_RE = /^[a-z0-9_.-]+$/;

const EMPTY = { fullName: "", email: "", password: "", username: "" };

/**
 * Lightweight signup: only name, email, password and username.
 *
 * The full profile (profession, bio, phone, DOB, gender, address) is
 * completed later — it is required before publishing a story, not before
 * writing one.
 */
export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /** Field updates clear that field's error as the author fixes it. */
  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validate() {
    const found = {};

    if (!form.fullName.trim()) found.fullName = "Full name is required.";
    if (!form.email.trim()) found.email = "Email is required.";
    else if (!EMAIL_RE.test(form.email)) found.email = "Invalid email address.";

    if (form.password.length < MIN_PASSWORD) {
      found.password = `Password must be at least ${MIN_PASSWORD} characters.`;
    }

    const username = sanitizeUsername(form.username || form.fullName || "");
    if (username.length < MIN_USERNAME) {
      found.username = `Username must be at least ${MIN_USERNAME} characters.`;
    } else if (!USERNAME_RE.test(username)) {
      found.username = "Use only letters, numbers, dots, hyphens, underscores.";
    }

    setErrors(found);
    return found;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (Object.keys(validate()).length > 0) return;

    setLoading(true);
    try {
      const body = new FormData();
      body.append("fullName", form.fullName.trim());
      body.append("email", form.email.trim().toLowerCase());
      body.append("password", form.password);
      body.append("username", sanitizeUsername(form.username || form.fullName));

      await register(body);

      toast.success("Welcome to Lifebookz! Let's set up your lifebook.");
      navigate("/");
    } catch (err) {
      setError(apiErrorMessage(err, "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <AuthHeading
        title="Create your account"
        subtitle="Start writing in under a minute — complete your profile later."
      />

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

        <FormError>{error}</FormError>

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

      <AuthFooter prompt="Already have an account?" />
    </AuthShell>
  );
}
