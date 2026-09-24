import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import { CONSULT_CATEGORIES } from "../config";
import { apiError, sanitizeUsername } from "../utils/helpers";
import { Icons } from "../icons";

import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import Card, { CardTitle } from "../components/ui/Card";
import FormError from "../components/common/FormError";

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const fileRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");

  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    expertise: "",
    qualification: "",
    experience: "",
    price: "",
    bio: "",
    languages: "English",
    categories: [],
  });

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const toggleCategory = (id) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(id)
        ? prev.categories.filter((c) => c !== id)
        : [...prev.categories, id],
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.categories;
      return next;
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0] || null;
    setAvatar(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : null);
  };

  const validate = () => {
    const next = {};

    if (!form.fullName.trim()) next.fullName = "Full name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Invalid email address.";
    if (form.password.length < 8)
      next.password = "Password must be at least 8 characters.";
    if (!form.phone.trim()) next.phone = "Phone number is required.";

    const rawUsername = form.username || form.fullName;
    const clean = sanitizeUsername(rawUsername);
    if (clean.length < 3) next.username = "Username must be at least 3 characters.";

    if (!form.expertise.trim())
      next.expertise = "Tell us the area you are an expert in.";
    if (!form.qualification.trim())
      next.qualification = "Qualification is required.";
    if (!form.bio.trim()) next.bio = "A short bio is required.";
    if (form.categories.length === 0)
      next.categories = "Select at least one consultancy category.";

    setErrors(next);
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("fullName", form.fullName.trim());
      fd.append("username", sanitizeUsername(form.username || form.fullName));
      fd.append("email", form.email.trim());
      fd.append("password", form.password);
      fd.append("phone", form.phone.trim());
      fd.append("expertise", form.expertise.trim());
      fd.append("qualification", form.qualification.trim());
      fd.append("bio", form.bio.trim());
      fd.append("experience", String(Math.max(0, Number(form.experience) || 0)));
      fd.append("price", String(Math.max(0, Number(form.price) || 0)));
      fd.append(
        "languages",
        JSON.stringify(
          form.languages
            .split(",")
            .map((l) => l.trim())
            .filter(Boolean),
        ),
      );
      fd.append("categories", JSON.stringify(form.categories));
      if (avatar) fd.append("avatar", avatar);

      await register(fd);

      toast.success(
        "Application submitted! We'll notify you once your account is approved.",
      );
      navigate("/dashboard");
    } catch (err) {
      const { message, fields } = apiError(
        err,
        "Registration failed. Please try again.",
      );

      // Field-level failures read best under the input they belong to; the
      // banner is left for failures that are not about one field.
      const hasFields = Object.keys(fields).length > 0;
      setErrors((prev) => ({ ...prev, ...fields }));
      setError(hasFields ? "" : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Become a LifeBookz Expert
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tell us about your expertise so we can match you with the right
              people.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-start">
              {/* Left column — account */}
              <div className="space-y-8">
                <Card className="p-6 border border-border/60">
                  <CardTitle className="mb-5">Account details</CardTitle>

                  <div className="space-y-5">
                    <Input
                      label="Full name"
                      value={form.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                      placeholder="Enter your full name"
                      icon={<Icons.user className="h-4 w-4" />}
                      error={errors.fullName}
                      required
                    />

                    <Input
                      label="Username"
                      value={form.username}
                      onChange={(e) => update("username", e.target.value)}
                      placeholder="Choose a unique username"
                      helperText="Lowercase letters, numbers, dots, hyphens or underscores."
                      error={errors.username}
                    />

                    <Input
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="Enter your email"
                      icon={<Icons.mail className="h-4 w-4" />}
                      error={errors.email}
                      required
                    />

                    <Input
                      label="Password"
                      type="password"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder="Create a password"
                      icon={<Icons.lock className="h-4 w-4" />}
                      error={errors.password}
                      showPasswordToggle
                      required
                    />

                    <Input
                      label="Phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="Enter your phone number"
                      icon={<Icons.phone className="h-4 w-4" />}
                      error={errors.phone}
                      required
                    />
                  </div>
                </Card>

                {/* Profile photo */}
                <Card className="p-6 border border-border/60">
                  <CardTitle className="mb-5">Profile photo</CardTitle>
                  <div className="flex items-center gap-5">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/40"
                    >
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-display text-lg font-bold text-muted-foreground">
                          {initials(form.fullName)}
                        </span>
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                        <Icons.camera className="h-6 w-6 text-white" />
                      </span>
                    </button>
                    <div className="text-sm">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileRef.current?.click()}
                      >
                        Upload photo
                      </Button>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Optional. JPG or PNG, max 10MB.
                      </p>
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                </Card>
              </div>

              {/* Right column — expertise */}
              <div className="space-y-8">
                <Card className="p-6 border border-border/60">
                  <CardTitle className="mb-5">Expertise</CardTitle>

                  <div className="space-y-5">
                    <Input
                      label="Area of expertise"
                      value={form.expertise}
                      onChange={(e) => update("expertise", e.target.value)}
                      placeholder="Enter your area of expertise"
                      icon={<Icons.academic className="h-4 w-4" />}
                      error={errors.expertise}
                      required
                    />

                    <Input
                      label="Qualification"
                      value={form.qualification}
                      onChange={(e) => update("qualification", e.target.value)}
                      placeholder="Enter your qualification"
                      icon={<Icons.shieldCheck className="h-4 w-4" />}
                      error={errors.qualification}
                      required
                    />

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Input
                        label="Years of experience"
                        type="number"
                        min="0"
                        max="60"
                        value={form.experience}
                        onChange={(e) => update("experience", e.target.value)}
                        placeholder="Enter years of experience"
                        icon={<Icons.clock className="h-4 w-4" />}
                      />
                      <Input
                        label="Session price (USD)"
                        type="number"
                        min="0"
                        value={form.price}
                        onChange={(e) => update("price", e.target.value)}
                        placeholder="Enter session price"
                        icon={<Icons.money className="h-4 w-4" />}
                      />
                    </div>

                    <Input
                      label="Languages"
                      value={form.languages}
                      onChange={(e) => update("languages", e.target.value)}
                      placeholder="Enter languages you speak"
                      icon={<Icons.globe className="h-4 w-4" />}
                      helperText="Separate multiple languages with commas."
                    />
                  </div>
                </Card>

                <Card className="p-6 border border-border/60">
                  <CardTitle className="mb-2">Consultancy categories</CardTitle>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Pick every category you&apos;re comfortable consulting in.
                    These power the search that matches you with people.
                  </p>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {CONSULT_CATEGORIES.map((cat) => {
                      const checked = form.categories.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                            checked
                              ? "border-accent bg-accent/10 text-foreground"
                              : "border-border/70 text-muted-foreground hover:border-accent/40 hover:text-foreground"
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                              checked
                                ? "border-accent bg-accent text-accent-foreground"
                                : "border-border"
                            }`}
                          >
                            {checked && <Icons.check className="h-3 w-3" />}
                          </span>
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                  {errors.categories && (
                    <p className="mt-3 text-xs text-destructive">
                      {errors.categories}
                    </p>
                  )}
                </Card>

                <Card className="p-6 border border-border/60">
                  <CardTitle className="mb-5">About you</CardTitle>
                  <Textarea
                    label="Short bio"
                    value={form.bio}
                    onChange={(e) => update("bio", e.target.value)}
                    rows={5}
                    placeholder="Describe what you help people with, and how you work"
                    error={errors.bio}
                  />
                </Card>
              </div>
            </div>

            {/* Footer */}
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-6">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-sm text-muted-foreground">
                  Already registered?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-primary hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
                <Button type="submit" size="lg" loading={loading}>
                  Submit Application
                </Button>
              </div>
              <FormError className="mt-4">{error}</FormError>
              <p className="mt-4 text-center text-xs text-muted-foreground sm:text-left">
                Your profile is reviewed by our team before it becomes visible to
                the community.
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
