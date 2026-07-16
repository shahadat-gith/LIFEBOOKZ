import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Icons } from '../../icons';

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  gradient: string;
}

const steps: Step[] = [
  {
    icon: Icons.edit,
    title: 'Write Your Story',
    description:
      'Capture your memories, milestones, and life experiences through beautiful stories. Add photos, videos, and meaningful moments that define your journey.',
    color: 'from-violet-500 to-purple-600',
    gradient: 'from-violet-500/20 to-purple-600/20',
  },
  {
    icon: Icons.shieldCheck,
    title: 'Keep It Safe',
    description:
      'Choose who can view your stories. Keep them private, share them with family, or make them public for others to discover and cherish.',
    color: 'from-blue-500 to-cyan-600',
    gradient: 'from-blue-500/20 to-cyan-600/20',
  },
  {
    icon: Icons.globe,
    title: 'Leave Your Legacy',
    description:
      'Build a timeless digital legacy that future generations can revisit, celebrate, and remember for years to come.',
    color: 'from-amber-500 to-orange-600',
    gradient: 'from-amber-500/20 to-orange-600/20',
  },
];

const lineVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.8, ease: 'easeOut' },
  },
};

export function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold font-display sm:text-5xl">
            How{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              LifeBookz
            </span>{' '}
            Works
          </h2>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Preserve your life's journey in three simple steps.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative mx-auto max-w-5xl">
          {/* Connecting Line */}
          <div className="absolute left-0 right-0 top-8 hidden h-0.5 lg:block">
            <motion.div
              className="h-full origin-left bg-gradient-to-r from-violet-500 via-blue-500 to-amber-500"
              variants={lineVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            />
          </div>

          <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.6,
                  delay: index * 0.2,
                }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Icon */}
                <div className="relative mb-6">
                  <motion.div
                    className={`absolute inset-0 rounded-full bg-gradient-to-r ${step.color} opacity-20 blur-lg`}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.2, 0.08, 0.2],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.5,
                      ease: 'easeInOut',
                    }}
                  />

                  <div
                    className={`relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} shadow-xl`}
                  >
                    <step.icon className="h-7 w-7 text-white" />
                  </div>

                  <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-border bg-card text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <h3 className="mb-3 text-2xl font-bold font-display">
                  {step.title}
                </h3>

                <p className="leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;