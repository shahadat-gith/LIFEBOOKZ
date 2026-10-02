import { motion } from "framer-motion";

function greetingFor(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Time-based greeting with the author's first name. */
export default function GreetingHero({ author }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
        {greetingFor(new Date().getHours())}, {author.fullName?.split(" ")[0]} 👋
      </h1>
      <p className="mt-1.5 text-sm sm:text-base text-muted-foreground leading-relaxed">
        Every life has a story.
        <br className="hidden sm:block" />
        What will you remember today?
      </p>
    </motion.div>
  );
}
