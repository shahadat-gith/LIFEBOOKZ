import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { useAuth } from "../context/AuthContext";
import { CONSULT_CATEGORIES } from "../config";
import { Icons } from "../icons";
import Button from "../components/ui/Button";
import TestimonialForm from "../components/home/TestimonialForm";
import TestimonialsSection from "../components/home/TestimonialsSection";

const BENEFITS = [
  {
    icon: Icons.search,
    title: "Get discovered",
    desc: "Your expertise is matched to people describing exactly the situation you help with.",
  },
  {
    icon: Icons.calendar,
    title: "Manage your bookings",
    desc: "See every consultation request in one place and confirm, complete or cancel in a click.",
  },
  {
    icon: Icons.shieldCheck,
    title: "Verified experts only",
    desc: "Every expert profile is reviewed before it becomes visible to the community.",
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [testimonialKey, setTestimonialKey] = useState(0);

  return (
    <div className="bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full bg-accent/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 bottom-0 h-[320px] w-[320px] rounded-full bg-primary/5 blur-3xl"
        />

        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              <Icons.sparkles className="h-3.5 w-3.5" />
              LifeBookz Expert Portal
            </span>

            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              Share your expertise.
              <br />
              <span className="text-accent">Change someone&apos;s story.</span>
            </h1>

            <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Join the LifeBookz expert network and offer one-on-one
              consultations in education, relationships, career, business,
              personal growth and wellness.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <Link
                to={isAuthenticated ? "/dashboard" : "/register"}
                className="w-full sm:w-auto"
              >
                <Button size="lg" className="w-full sm:w-auto">
                  <Icons.userAdd className="h-4 w-4" />
                  {isAuthenticated ? "Go to Dashboard" : "Become an Expert"}
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <Icons.login className="h-4 w-4" />
                    Expert Sign In
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t border-border/60 bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {BENEFITS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Categories */}
          <div className="mt-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Consultancy Areas
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {CONSULT_CATEGORIES.map((cat) => (
                <span
                  key={cat.id}
                  className="rounded-full border border-border/70 bg-card px-4 py-2 text-xs font-semibold text-muted-foreground"
                >
                  {cat.label}
                </span>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="mt-16 rounded-3xl border border-border/60 bg-card p-8 sm:p-10">
            <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
              How it works
            </h2>
            <ol className="mt-6 grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Apply",
                  desc: "Register with your area of expertise, qualification and the categories you want to consult in.",
                },
                {
                  step: "2",
                  title: "Get verified",
                  desc: "Our team reviews your application. Once approved, your profile becomes searchable.",
                },
                {
                  step: "3",
                  title: "Consult",
                  desc: "People are matched to you automatically. Review requests and manage them from your dashboard.",
                },
              ].map((item) => (
                <li key={item.step} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
                    {item.step}
                  </span>
                  <div>
                    <p className="font-display text-base font-bold">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            {!isAuthenticated && (
              <div className="mt-8">
                <Link to="/register">
                  <Button size="lg">
                    <Icons.arrowRight className="h-4 w-4" />
                    Start your application
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border/60 py-20 px-4 sm:px-6">
        <TestimonialForm onSubmitted={() => setTestimonialKey((k) => k + 1)} />
      </section>
      <TestimonialsSection refreshKey={testimonialKey} />
    </div>
  );
}
