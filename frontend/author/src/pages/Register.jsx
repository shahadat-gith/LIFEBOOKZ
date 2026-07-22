import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";

import AccountSection from "../components/register/AccountSection";
import ProfileSection from "../components/register/ProfileSection";
import SocialSection from "../components/register/SocialSection";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
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
      profession: "",
      bio: "",
      website: "",
      socialLinks: {
        x: "",
        linkedin: "",
        instagram: "",
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

    if (!form.fullName?.trim()) {
      next.fullName = "Full name is required.";
    }
    if (!form.email?.trim()) {
      next.email = "Email is required.";
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      next.email = "Invalid email address.";
    }
    if ((form.password || "").length < 8) {
      next.password = "Password must be at least 8 characters.";
    }
    if (!form.profession?.trim()) {
      next.profession = "Profession is required.";
    }
    if (!form.bio?.trim()) {
      next.bio = "Bio is required.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("email", form.email);
      fd.append("password", form.password);
      fd.append("fullName", form.fullName);
      fd.append("profession", form.profession);
      fd.append("bio", form.bio);
      if (form.website) fd.append("website", form.website);
      fd.append("socialLinks", JSON.stringify(form.socialLinks));
      if (avatar) fd.append("avatar", avatar);

      await register(fd);

      toast.success(
        "Application submitted successfully. We'll notify you once your account is approved.",
      );
      navigate("/dashboard");
    } catch (error) {
      toast.error(
        error.response?.data?.error?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-7xl py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden rounded-3xl border">
          <div className="border-b bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 px-10 py-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              Become a Lifebookz Author
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Share your stories, inspire readers, and build your personal
              writing profile on Lifebookz.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-8 py-8 px-8 lg:grid-cols-2">
              <AccountSection form={form} errors={errors} onChange={update} />
              <ProfileSection
                form={form}
                avatar={avatar}
                errors={errors}
                onAvatarChange={(file) => setAvatar(file)}
                onChange={update}
              />
            </div>

            <div className="pb-8 px-8">
              <SocialSection form={form} onChange={update} />
            </div>

            <div className="flex flex-col items-center justify-between gap-4 border-t bg-muted/20 px-8 py-6 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Already have an author account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
              <Button
                type="submit"
                size="lg"
                loading={loading}
                icon={<Icons.userAdd className="h-4 w-4" />}
              >
                Submit Application
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
