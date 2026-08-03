import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Avatar } from "../ui/Avatar";
import api from "../../config/axios";

const FALLBACK_TESTIMONIALS = [
  {
    name: "Priya Sharma",
    role: "Author",
    title: "Hindi Story Writer",
    avatar: "",
    content:
      "Lifebookz gave me the platform to share my Hindi stories with readers across India. The editing tools helped me refine my work beautifully.",
  },
  {
    name: "Arun Kumar",
    role: "Author",
    title: "Tamil Poet & Author",
    avatar: "",
    content:
      "Writing in Tamil and reaching thousands of readers was a dream. Lifebookz made it real. The community is incredibly supportive.",
  },
  {
    name: "Sneha Patel",
    role: "Reader",
    title: "Avid Reader",
    avatar: "",
    content:
      "The platform is so intuitive! I love how I can read stories in my native language and discover regional voices from across India.",
  },
  {
    name: "Rajesh Das",
    role: "Guest",
    title: "Literary Enthusiast",
    avatar: "",
    content:
      "A wonderfully crafted space for modern Indian literature. Exploring distinct regional stories has never been easier.",
  },
];

const ROLE_STYLES = {
  Author: "bg-accent/10 text-accent border-accent/30",
  Reader: "bg-primary/10 text-primary border-primary/20",
  Guest: "bg-muted text-muted-foreground border-border",
};

/**
 * Map the API response shape to the card display shape.
 * The API returns:
 *   { person: { fullName, avatar, profession }, personType: "Author"|"User",
 *     message, rating, createdAt }
 */
function mapApiToCard(t) {
  const person = t.person || {};
  const role = t.personType === "Author" ? "Author" : "Reader";
  return {
    name: person.fullName || "Anonymous",
    role,
    title: person.profession || "Community Member",
    avatar: person.avatar?.url || "",
    content: t.message || "",
  };
}

export function TestimonialsSection() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get("/testimonials", { params: { limit: 10 } })
      .then((res) => {
        if (cancelled) return;
        const data = res.data.data || [];
        if (data.length > 0) {
          setCards(data.map(mapApiToCard));
        } else {
          setCards(FALLBACK_TESTIMONIALS);
        }
      })
      .catch(() => {
        if (!cancelled) setCards(FALLBACK_TESTIMONIALS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Use hardcoded fallback while loading to avoid visual blankness
  const displayCards = (loading ? [] : cards).length > 0 ? cards : FALLBACK_TESTIMONIALS;
  const isShowingFallback = loading || cards.length === 0;

  // Duplicate array so the seamless infinite loop has no visible break
  const carouselItems = [...displayCards, ...displayCards];

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/50 to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            Loved by{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Storytellers & Readers
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {isShowingFallback
              ? "Loading voices from our community..."
              : "Hear from our community across India"}
          </p>
        </div>
      </div>

      {/* Infinite Moving Track */}
      <div className="relative w-full overflow-hidden py-4">
        {/* Fade masks on sides for clean visual transition */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />

        <motion.div
          className="flex gap-6 w-max"
          animate={{
            x: ["0%", "-50%"],
          }}
          transition={{
            duration: 25,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {carouselItems.map((testimonial, index) => {
            const roleStyle = ROLE_STYLES[testimonial.role] ?? "bg-muted text-muted-foreground border-border";

            return (
              <div
                key={`${testimonial.name}-${index}`}
                className="w-[320px] sm:w-[380px] shrink-0"
              >
                <div className="h-full flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-card border border-border/60 hover:border-border transition-all duration-300 hover:shadow-md">
                  <div>
                    {/* Header: Quote Icon & Role Pill */}
                    <div className="flex items-center justify-between mb-6">
                      <svg
                        className="w-8 h-8 text-primary/20"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z" />
                      </svg>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border tracking-wide uppercase ${roleStyle}`}
                      >
                        {testimonial.role}
                      </span>
                    </div>

                    {/* Content */}
                    <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-8">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                  </div>

                  {/* Author Info Footer */}
                  <div className="flex items-center gap-3.5 pt-4 border-t border-border/40">
                    <Avatar
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fallback={testimonial.name.charAt(0)}
                      className="w-10 h-10 ring-2 ring-border/50 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground text-sm truncate">
                        {testimonial.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {testimonial.title}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default TestimonialsSection;