import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import { sanitizeUsername } from "../utils/helpers";

import AccountSection from "../components/register/AccountSection";
import AddressSection from "../components/register/AddressSection";
import ProfileSection from "../components/register/ProfileSection";
import SocialSection from "../components/register/SocialSection";

import Button from "../components/ui/Button";
import { Icons } from "../icons";

const STORAGE_KEY = "lifebookz-author-register";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);

  const [form, setForm] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      email: "",
      password: "",
      fullName: "",
      username: "",
      profession: "",
      bio: "",
      phone: "",
      dob: "",
      gender: "",
      address: {
        country: "",
        state: "",
        city: "",
        zipCode: "",
      },
      socialLinks: {
        website: "",
        x: "",
        instagram: "",
        linkedin: "",
        facebook: "",
        youtube: "",
      },
    };
  });

  useEffect(() => {
    const rest = { ...form };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  }, [form]);

  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
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
    if (!form.profession?.trim()) next.profession = "Profession is required.";
    if (!form.bio?.trim()) next.bio = "Bio is required.";
    if (!form.phone?.trim()) next.phone = "Phone number is required.";
    if (!form.dob) next.dob = "Date of birth is required.";
    if (!form.gender) next.gender = "Gender is required.";
    if (!form.address?.country?.trim())
      next["address.country"] = "Country is required.";
    if (!form.address?.state?.trim())
      next["address.state"] = "State is required.";
    if (!form.address?.city?.trim()) next["address.city"] = "City is required.";

    // Validate username format
    const rawUsername = form.username || form.fullName || "";
    const clean = sanitizeUsername(rawUsername);
    const usernameVal = form.username?.trim() || "";

    if (usernameVal && clean !== usernameVal) {
      next.username = `Invalid characters removed. Suggested: "${clean || "username"}"`;
    } else if (clean.length < 3) {
      next.username = "Username must be at least 3 characters.";
    } else if (!/^[a-z0-9_.-]+$/.test(clean)) {
      next.username = "Use only letters, numbers, dots, hyphens, underscores.";
    }

    setErrors(next);
    return next;
  };

  const scrollToElement = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      if (
        errs.fullName ||
        errs.email ||
        errs.password ||
        errs.username ||
        errs.phone ||
        errs.dob ||
        errs.gender
      ) {
        scrollToElement("section-personal");
      } else if (
        errs["address.country"] ||
        errs["address.state"] ||
        errs["address.city"]
      ) {
        scrollToElement("section-address");
      } else if (errs.profession || errs.bio) {
        scrollToElement("section-profile");
      }
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("email", form.email);
      fd.append("password", form.password);
      fd.append("fullName", form.fullName);
      fd.append(
        "username",
        form.username ||
          sanitizeUsername(form.fullName)
      );
      fd.append("profession", form.profession);
      fd.append("bio", form.bio);
      fd.append("phone", form.phone);
      fd.append("dob", form.dob);
      fd.append("gender", form.gender);
      fd.append("address", JSON.stringify(form.address));
      fd.append("socialLinks", JSON.stringify(form.socialLinks));
      if (avatar) fd.append("avatar", avatar);

      await register(fd);

      toast.success(
        "Application submitted successfully! We'll notify you once your account is approved."
      );
      navigate("/dashboard");
    } catch (error) {
      toast.error(
        error.response?.data?.error?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Grid container for sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left Column */}
              <div className="space-y-8">
                {/* Section 1: Personal Information */}
                <div id="section-personal" className="scroll-mt-24">
                  <AccountSection form={form} errors={errors} onChange={update} />
                </div>

                {/* Section 2: Address */}
                <div id="section-address" className="scroll-mt-24">
                  <AddressSection form={form} errors={errors} onChange={update} />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                {/* Section 3: Profile */}
                <div id="section-profile" className="scroll-mt-24">
                  <ProfileSection
                    form={form}
                    avatar={avatar}
                    errors={errors}
                    onAvatarChange={(file) => setAvatar(file)}
                    onChange={update}
                  />
                </div>

                {/* Section 4: Social Links */}
                <div id="section-social" className="scroll-mt-24">
                  <SocialSection form={form} onChange={update} />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-6">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-sm text-muted-foreground">
                  Already have an author account?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
                <Button
                  type="submit"
                  size="lg"
                  loading={loading}
                >
                  Submit Application
                </Button>
              </div>
              <p className="mt-4 text-xs text-center text-muted-foreground sm:text-left">
                By submitting, you agree to our{" "}
                <Link
                  to="/terms"
                  className="underline hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="underline hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}