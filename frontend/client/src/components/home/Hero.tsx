import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Icons } from '../../icons';

const floatingAnimation = {
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const pulseAnimation = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.4, 0.6, 0.4],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />

      {/* Animated Orbs */}
      <motion.div
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-blue-500/30 to-cyan-500/30 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [0, -90, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-pink-500/10 to-amber-500/10 blur-3xl"
        {...pulseAnimation}
      />

      {/* Floating Icons */}
      <motion.div
        className="absolute top-20 left-[15%] text-white/10"
        {...floatingAnimation}
      >
        <Icons.sparkles className="w-12 h-12" />
      </motion.div>

      <motion.div
        className="absolute top-32 right-[20%] text-white/10"
        animate={{
          y: [0, 15, 0],
          transition: {
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          },
        }}
      >
        <Icons.book className="w-8 h-8" />
      </motion.div>

      <motion.div
        className="absolute bottom-40 left-[25%] text-white/10"
        animate={{
          y: [0, -15, 0],
          transition: {
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          },
        }}
      >
        <Icons.edit className="w-10 h-10" />
      </motion.div>

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-8"
          >
            <Icons.sparkles className="w-4 h-4 text-amber-400" />
            <span>Preserve Every Story That Matters</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
          >
            <span className="text-white">Some Moments Fade.</span>
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
              Your Story Doesn't Have To.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg sm:text-xl text-white/75 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            LifeBookz is your digital legacy—a place to preserve memories,
            document life's journey, and pass your story on to future
            generations.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <a href="http://localhost:5174/register" target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-gray-900 font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 px-8 py-4 text-lg rounded-xl"
              >
                Write Your Story
              </Button>
            </a>

            <Link to="/stories">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 backdrop-blur-sm px-8 py-4 text-lg rounded-xl transition-all duration-300"
              >
                Explore Stories
              </Button>
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-8 text-white/50 text-sm"
          >
            <div className="flex items-center gap-2">
              <Icons.checkCircle className="w-4 h-4 text-emerald-400" />
              <span>Thousands of Memories Preserved</span>
            </div>

            <div className="flex items-center gap-2">
              <Icons.shieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Private & Secure</span>
            </div>

            <div className="flex items-center gap-2">
              <Icons.user className="w-4 h-4 text-emerald-400" />
              <span>Families Connected</span>
            </div>

            <div className="flex items-center gap-2">
              <Icons.globe className="w-4 h-4 text-emerald-400" />
              <span>Stories That Last Forever</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

export default Hero;