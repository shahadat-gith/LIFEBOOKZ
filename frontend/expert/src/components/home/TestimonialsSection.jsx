import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../../config/api";
import Avatar from "../ui/Avatar";
import { Icons } from "../../icons";

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icons.starSolid
          key={n}
          className={`h-3.5 w-3.5 ${
            n <= rating ? "text-amber-400" : "text-muted-foreground/25"
          }`}
        />
      ))}
    </div>
  );
}

export default function TestimonialsSection({ refreshKey = 0 }) {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .get("/testimonials", { params: { limit: 12 } })
      .then((res) => {
        if (!cancelled) setTestimonials(res.data.data || []);
      })
      .catch(() => {
        if (!cancelled) setTestimonials([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <section id="testimonials" className="py-20 px-6 bg-muted/20 border-t border-border/60">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
            What Our Community Says
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Readers, authors and experts — real voices from the people who make
            Lifebookz what it is.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl bg-muted/60 border border-border/40"
              />
            ))}
          </div>
        ) : testimonials.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No testimonials yet — be the first to share yours!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => {
              const person = t.person || {};
              const name = person.fullName || "Anonymous";
              const role =
                person.profession ||
                (t.personType === "Author"
                  ? "Author"
                  : t.personType === "Expert"
                    ? "Verified Expert"
                    : "Reader");

              return (
                <motion.div
                  key={t.id || i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 3) * 0.08, duration: 0.4 }}
                  className="p-6 rounded-2xl bg-card border border-border/60 hover:border-border transition-all duration-300 shadow-xs hover:shadow-md"
                >
                  <div className="mb-4">
                    <Stars rating={Number(t.rating) || 0} />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    &ldquo;{t.message}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                    <Avatar
                      src={person.avatar?.url}
                      name={name}
                      size="sm"
                      className="ring-2 ring-border/50"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {role}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
