import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Avatar from "../components/ui/Avatar";
import AuthShell from "../components/auth/AuthShell";
import { Icons } from "../icons";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  function handleAvatarChange(e) {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setAvatarPreview(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("email", email);
      fd.append("password", password);
      fd.append("fullName", fullName);
      if (avatarFile) fd.append("avatar", avatarFile);

      await registerUser(fd);
      toast.success("Account created successfully!");
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.error?.message;
      setError(msg || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="text-center mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Join the community of readers and storytellers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Avatar Section */}
        <div className="flex items-center gap-5 p-4 rounded-2xl bg-muted/20 border border-border/50">
          <div className="relative group shrink-0">
            <Avatar
              src={avatarPreview || ""}
              name={fullName || "User"}
              size="xl"
              className="ring-2 ring-border/80"
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">
              Profile Picture
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Optional — or use your initials as avatar.
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-2 text-xs text-primary font-medium hover:underline"
            >
              {avatarFile ? "Change photo" : "Upload photo"}
            </button>
          </div>
        </div>

        <Input
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
          required
          icon={<Icons.user className="h-4 w-4" />}
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          icon={<Icons.mail className="h-4 w-4" />}
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password"
          required
          icon={<Icons.lock className="h-4 w-4" />}
          showPasswordToggle
        />
        <p className="text-xs text-muted-foreground -mt-2">
          Use at least 8 characters.
        </p>

        {/* Error Display */}
        {error && (
          <div className="text-sm text-destructive flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <Icons.exclamationCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          className="font-semibold !rounded-xl"
          icon={<Icons.userAdd className="h-4 w-4" />}
        >
          Create Account
        </Button>
      </form>

      <div className="mt-7 pt-6 border-t border-border/40 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-primary font-semibold hover:underline underline-offset-4"
        >
          Sign in
        </Link>
      </div>
    </AuthShell>
  );
}
