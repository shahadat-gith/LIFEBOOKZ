import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";

import type { RegisterRequest } from "../types";

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

  const [form, setForm] = useState<RegisterRequest>(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        return {
          ...JSON.parse(saved),
          avatar: null,
        };
      } catch {}
    }

    return {
      email: "",
      password: "",
      fullName: "",
      profession: "",
      bio: "",
      website: "",
      avatar: null,
      socialLinks: {
        x: "",
        linkedin: "",
        instagram: "",
      },
    };
  });

  useEffect(() => {
    const { avatar, ...rest } = form;

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  }, [form]);

  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterRequest, string>>
  >({});

  const update = <K extends keyof RegisterRequest>(
    field: K,
    value: RegisterRequest[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const validate = () => {
    const next: Partial<Record<keyof RegisterRequest, string>> = {};

    if (!form.fullName.trim()) {
      next.fullName = "Full name is required.";
    }

    if (!form.email.trim()) {
      next.email = "Email is required.";
    }

    if (!/\S+@\S+\.\S+/.test(form.email)) {
      next.email = "Invalid email address.";
    }

    if (form.password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }

    if (!form.profession.trim()) {
      next.profession = "Profession is required.";
    }

    if (!form.bio.trim()) {
      next.bio = "Bio is required.";
    }

    setErrors(next);

    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();

      fd.append("email", form.email);
      fd.append("password", form.password);
      fd.append("fullName", form.fullName);
      fd.append("profession", form.profession);
      fd.append("bio", form.bio);

      if (form.website) {
        fd.append("website", form.website);
      }

      fd.append("socialLinks", JSON.stringify(form.socialLinks));

      if (form.avatar) {
        fd.append("avatar", form.avatar);
      }

      await register(fd);

      toast.success(
        "Application submitted successfully. We'll notify you once your account is approved.",
      );

      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-7xl py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden rounded-3xl border">
          <div className="border-b bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 px-10 py-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              Become a Lifebookz Author
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Share your stories, inspire readers, and build your personal
              writing profile on Lifebookz.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-8 py-8 lg:grid-cols-2">
              <AccountSection form={form} errors={errors} onChange={update} />

              <ProfileSection
                form={form}
                avatar={form.avatar}
                errors={errors}
                onAvatarChange={(file) => update("avatar", file)}
                onChange={update}
              />
            </div>

            <div className="py-8 pb-8">
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
