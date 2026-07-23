import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Avatar from "../components/ui/Avatar";
import { Icons } from "../icons";
import toast from "react-hot-toast";

const INTEREST_OPTIONS = [
  "Fiction", "Poetry", "Romance", "Mystery", "Fantasy", "Science Fiction",
  "Horror", "Thriller", "Historical", "Biography", "Self-Help", "Philosophy",
  "Adventure", "Comedy", "Drama", "Spirituality", "Science", "Technology",
  "Cooking", "Travel", "Nature", "Sports", "Music", "Art",
];

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  function toggleInterest(interest) {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  }

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
      fd.append("interests", JSON.stringify(selectedInterests));
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 rounded-3xl border border-border/80 bg-card shadow-xl overflow-hidden my-6">
        
        {/* Left Side: Brand & Hero */}
        <div className="hidden md:flex md:col-span-5 flex-col justify-between p-10 bg-muted/30 border-r border-border/60 relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
              <span className="font-bold text-xl tracking-tight text-foreground">
                Stories
              </span>
            </div>

            <div className="pt-10 space-y-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground leading-tight">
                Start sharing your journey today.
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Create a personalized profile, select topics you care about, and publish your original stories to a global community.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-border/40 text-xs text-muted-foreground relative z-10">
            &copy; {new Date().getFullYear()} Stories Inc. All rights reserved.
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          <div className="flex md:hidden items-center gap-2 mb-8">
            <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
            <span className="font-bold text-lg text-foreground">Stories</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Create an account
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              Fill in your details below to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                <h4 className="text-sm font-semibold text-foreground">Profile Picture</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload an image or use your initials as avatar.
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

            {/* Inputs */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                required
                icon={Icons?.user ? <Icons.user className="h-4 w-4" /> : null}
              />
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                icon={Icons?.mail ? <Icons.mail className="h-4 w-4" /> : null}
              />
            </div>

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              icon={Icons?.lock ? <Icons.lock className="h-4 w-4" /> : null}
              showPasswordToggle
            />

            {/* Interests */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-sm font-medium text-foreground">
                  Select your interests
                </label>
                {selectedInterests.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {selectedInterests.length} selected
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1.5 rounded-xl border border-border/40 bg-muted/10">
                {INTEREST_OPTIONS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-card text-muted-foreground border-border/80 hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="text-sm text-destructive flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                {Icons?.exclamationCircle ? (
                  <Icons.exclamationCircle className="h-4 w-4 flex-shrink-0" />
                ) : null}
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              className="font-semibold"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-semibold hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}