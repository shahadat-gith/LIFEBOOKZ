import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Icons } from "../../icons";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Hindi Story Writer",
    avatar: "",
    content:
      "Lifebookz gave me the platform to share my Hindi stories with readers across India. The editing tools helped me refine my work beautifully.",
    badge: "Top Author",
    badgeVariant: "success",
  },
  {
    name: "Arun Kumar",
    role: "Tamil Poet & Author",
    avatar: "",
    content:
      "Writing in Tamil and reaching thousands of readers was a dream. Lifebookz made it real. The community is incredibly supportive.",
    badge: "Verified Author",
    badgeVariant: "primary",
  },
  {
    name: "Sneha Patel",
    role: "Gujarati Storyteller",
    avatar: "",
    content:
      "The platform is so intuitive! I love how I can write in my native language and still reach a wider audience across India.",
    badge: "Rising Star",
    badgeVariant: "info",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export function TestimonialsSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/50 to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            Loved by{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Storytellers
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Hear from our community of authors across India
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-3 gap-6 sm:gap-8"
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              variants={cardVariants}
              className="group relative"
            >
              <div className="relative h-full p-6 sm:p-8 rounded-2xl bg-card border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg">
                {/* Quote mark */}
                <div className="mb-6">
                  <svg
                    className="w-8 h-8 text-primary/20 group-hover:text-primary/30 transition-colors duration-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z" />
                  </svg>
                </div>

                {/* Content */}
                <p className="text-muted-foreground leading-relaxed mb-8">
                  {testimonial.content}
                </p>

                {/* Author info */}
                <div className="flex items-center gap-4 mt-auto">
                  <Avatar
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    fallback={testimonial.name.charAt(0)}
                    className="w-12 h-12 ring-2 ring-border/50"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {testimonial.role}
                    </div>
                  </div>
                  <Badge variant={testimonial.badgeVariant} size="sm">
                    {testimonial.badge}
                  </Badge>
                </div>

                {/* Hover glow */}
                <div
                  className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${testimonial.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
