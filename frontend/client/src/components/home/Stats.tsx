import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Icons } from '../../icons';

interface StatItem {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  suffix: string;
  gradient: string;
  iconColor: string;
}

const stats: StatItem[] = [
  {
    icon: Icons.book,
    value: 1200,
    label: 'Stories Published',
    suffix: '+',
    gradient: 'from-violet-500 to-purple-600',
    iconColor: 'text-violet-400',
  },
  {
    icon: Icons.edit,
    value: 350,
    label: 'Verified Authors',
    suffix: '+',
    gradient: 'from-emerald-500 to-teal-600',
    iconColor: 'text-emerald-400',
  },
  {
    icon: Icons.user,
    value: 15000,
    label: 'Active Readers',
    suffix: '+',
    gradient: 'from-blue-500 to-cyan-600',
    iconColor: 'text-blue-400',
  },
  {
    icon: Icons.globe,
    value: 12,
    label: 'Languages Supported',
    suffix: '',
    gradient: 'from-amber-500 to-orange-600',
    iconColor: 'text-amber-400',
  },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const counterRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(counterRef, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), value);
      setCount(current);
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={counterRef}>
      {count.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export function Stats() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section ref={sectionRef} className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />

      {/* Decorative dots */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            Growing{' '}
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Every Day
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Our community is thriving with stories, authors, and readers from across India
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="relative group"
            >
              <div className="relative p-6 sm:p-8 rounded-2xl bg-card border border-border/50 overflow-hidden transition-all duration-300 hover:border-border hover:shadow-lg">
                {/* Gradient accent bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`}
                />

                {/* Background glow */}
                <div
                  className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${stat.gradient} opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500`}
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`mb-4 ${stat.iconColor}`}>
                    <stat.icon className="w-8 h-8" />
                  </div>

                  {/* Value */}
                  <div className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-1">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>

                  {/* Label */}
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default Stats;
